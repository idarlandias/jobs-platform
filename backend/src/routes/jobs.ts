import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// POST /api/v1/jobs - Publish a new job (Company only)
app.post('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    if (user.role !== 'COMPANY') {
      return c.json({ error: 'Apenas empresas podem publicar vagas.', code: 'FORBIDDEN' }, 403)
    }

    // Find the company profile for the authenticated user
    const company = await prisma.company.findUnique({
      where: { userId: user.userId },
    })

    if (!company) {
      return c.json({ error: 'Perfil de empresa não encontrado.', code: 'NOT_FOUND' }, 404)
    }

    const {
      title,
      description,
      requirements,
      skills,
      benefits,
      salaryMin,
      salaryMax,
      workType,
      workplaceType,
      location,
    } = await c.req.json()

    // Validate inputs
    if (!title || !description || !skills || !Array.isArray(skills)) {
      return c.json({ error: 'Título, descrição e competências (skills) são obrigatórios.', code: 'BAD_REQUEST' }, 400)
    }

    // Enforce salary transparency
    if (salaryMin === undefined || salaryMax === undefined || salaryMin <= 0 || salaryMax <= 0) {
      return c.json({ error: 'Transparência salarial é obrigatória. Por favor, insira valores maiores que zero para as faixas salariais.', code: 'BAD_REQUEST' }, 400)
    }

    if (Number(salaryMin) > Number(salaryMax)) {
      return c.json({ error: 'O salário mínimo não pode ser maior que o salário máximo.', code: 'BAD_REQUEST' }, 400)
    }

    // Create the job
    const job = await prisma.job.create({
      data: {
        companyId: company.id,
        title,
        description,
        requirements: Array.isArray(requirements) ? requirements : [],
        skills,
        benefits: Array.isArray(benefits) ? benefits : [],
        salaryMin: Number(salaryMin),
        salaryMax: Number(salaryMax),
        workType,
        workplaceType,
        location,
        status: 'ACTIVE', // Default to active for MVP
      },
    })

    // Generate embedding asynchronously so it doesn't block the API response
    const { generateEmbedding } = require('../lib/gemini')
    const textToEmbed = `${title} ${description} ${skills.join(' ')}`
    generateEmbedding(textToEmbed)
      .then((vector: number[]) => {
        const vectorStr = `[${vector.join(',')}]`
        return prisma.$executeRawUnsafe(
          'UPDATE "Job" SET embedding = $1::vector WHERE id = $2;',
          vectorStr,
          job.id
        )
      })
      .catch((err: any) => console.error('Failed to generate and save embedding for job:', err))

    return c.json({ job }, 201)

  } catch (error: any) {
    console.error('Create job error:', error)
    return c.json({ error: 'Erro ao criar vaga: ' + error.message, code: 'INTERNAL_ERROR' }, 500)
  }
})

// GET /api/v1/jobs - Feed of jobs (lists all active jobs, calculates match score if candidate is logged in)
app.get('/', async (c) => {
  try {
    // 1. Fetch active jobs
    const jobs = await prisma.job.findMany({
      where: { status: 'ACTIVE' },
      include: {
        company: {
          select: {
            name: true,
            logoUrl: true,
            sector: true,
            size: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 2. Fetch candidate info if they passed token in auth header
    const authHeader = c.req.header('Authorization')
    let candidateSkills: string[] = []
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { verifyToken } = require('../lib/authUtils')
      const payload = await verifyToken(token)
      if (payload && payload.role === 'CANDIDATE') {
        const candidate = await prisma.candidate.findUnique({
          where: { userId: payload.userId },
          select: { skills: true },
        })
        if (candidate) {
          candidateSkills = candidate.skills.map((s: string) => s.toLowerCase().trim())
        }
      }
    }

    // 3. Map jobs and calculate skill-based match score
    const jobsWithScores = jobs.map((job) => {
      let matchScore = 0

      if (candidateSkills.length > 0 && job.skills.length > 0) {
        const jobSkillsLower = job.skills.map((s) => s.toLowerCase().trim())
        const matches = jobSkillsLower.filter((s) => candidateSkills.includes(s))
        
        // Match percentage based on job required skills
        matchScore = Math.round((matches.length / jobSkillsLower.length) * 100)
      } else if (job.skills.length === 0) {
        matchScore = 100 // If no skills are required, match is 100
      }

      return {
        ...job,
        matchScore,
      }
    })

    return c.json({ jobs: jobsWithScores })

  } catch (error: any) {
    console.error('List jobs error:', error)
    return c.json({ error: 'Erro ao listar vagas: ' + error.message, code: 'INTERNAL_ERROR' }, 500)
  }
})

// GET /api/v1/jobs/company - List jobs published by the active company
app.get('/company', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    if (user.role !== 'COMPANY') {
      return c.json({ error: 'Apenas empresas podem gerenciar vagas.', code: 'FORBIDDEN' }, 403)
    }

    const company = await prisma.company.findUnique({
      where: { userId: user.userId },
    })

    if (!company) {
      return c.json({ error: 'Perfil de empresa não encontrado.', code: 'NOT_FOUND' }, 404)
    }

    const jobs = await prisma.job.findMany({
      where: { companyId: company.id },
      include: {
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return c.json({ jobs })

  } catch (error: any) {
    console.error('List company jobs error:', error)
    return c.json({ error: 'Erro ao listar vagas da empresa: ' + error.message, code: 'INTERNAL_ERROR' }, 500)
  }
})

// GET /api/v1/jobs/:id - Job Details (increments viewCount)
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            description: true,
            sector: true,
          },
        },
      },
    })

    if (!job) {
      return c.json({ error: 'Vaga não encontrada.', code: 'NOT_FOUND' }, 404)
    }

    // Increment viewCount asynchronously
    prisma.job.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch(err => console.error('Failed to increment viewCount:', err))

    return c.json({ job })

  } catch (error: any) {
    console.error('Get job details error:', error)
    return c.json({ error: 'Erro ao buscar detalhes da vaga: ' + error.message, code: 'INTERNAL_ERROR' }, 500)
  }
})

// PUT /api/v1/jobs/:id - Edit Job
app.put('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    const user = c.get('user')

    if (user.role !== 'COMPANY') {
      return c.json({ error: 'Apenas empresas podem editar vagas.', code: 'FORBIDDEN' }, 403)
    }

    const company = await prisma.company.findUnique({
      where: { userId: user.userId },
    })

    if (!company) {
      return c.json({ error: 'Perfil de empresa não encontrado.', code: 'NOT_FOUND' }, 404)
    }

    // Verify ownership
    const job = await prisma.job.findUnique({
      where: { id },
    })

    if (!job || job.companyId !== company.id) {
      return c.json({ error: 'Não autorizado ou vaga não encontrada.', code: 'UNAUTHORIZED' }, 401)
    }

    const {
      title,
      description,
      requirements,
      skills,
      benefits,
      salaryMin,
      salaryMax,
      workType,
      workplaceType,
      location,
      status,
    } = await c.req.json()

    // Validate inputs
    if (salaryMin !== undefined && salaryMax !== undefined) {
      if (salaryMin <= 0 || salaryMax <= 0 || Number(salaryMin) > Number(salaryMax)) {
        return c.json({ error: 'Valores de faixa salarial inválidos.', code: 'BAD_REQUEST' }, 400)
      }
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        title,
        description,
        requirements,
        skills,
        benefits,
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
        workType,
        workplaceType,
        location,
        status,
      },
    })

    return c.json({ job: updatedJob })

  } catch (error: any) {
    console.error('Update job error:', error)
    return c.json({ error: 'Erro ao editar vaga: ' + error.message, code: 'INTERNAL_ERROR' }, 500)
  }
})

// DELETE /api/v1/jobs/:id - Delete Job
app.delete('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    const user = c.get('user')

    if (user.role !== 'COMPANY') {
      return c.json({ error: 'Apenas empresas podem excluir vagas.', code: 'FORBIDDEN' }, 403)
    }

    const company = await prisma.company.findUnique({
      where: { userId: user.userId },
    })

    if (!company) {
      return c.json({ error: 'Perfil de empresa não encontrado.', code: 'NOT_FOUND' }, 404)
    }

    // Verify ownership
    const job = await prisma.job.findUnique({
      where: { id },
    })

    if (!job || job.companyId !== company.id) {
      return c.json({ error: 'Não autorizado ou vaga não encontrada.', code: 'UNAUTHORIZED' }, 401)
    }

    await prisma.job.delete({
      where: { id },
    })

    return c.json({ message: 'Vaga excluída com sucesso.' })

  } catch (error: any) {
    console.error('Delete job error:', error)
    return c.json({ error: 'Erro ao excluir vaga: ' + error.message, code: 'INTERNAL_ERROR' }, 500)
  }
})

export default app
