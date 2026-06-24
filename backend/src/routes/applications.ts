import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// POST /api/v1/applications - Apply to a job (Candidate only)
app.post('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    if (user.role !== 'CANDIDATE') {
      return c.json({ error: 'Apenas candidatos podem se candidatar a vagas.', code: 'FORBIDDEN' }, 403)
    }

    const { jobId, coverLetter } = await c.req.json()

    if (!jobId) {
      return c.json({ error: 'O ID da vaga (jobId) é obrigatório.', code: 'BAD_REQUEST' }, 400)
    }

    // 1. Fetch Candidate profile
    const candidate = await prisma.candidate.findUnique({
      where: { userId: user.userId },
    })

    if (!candidate) {
      return c.json({ error: 'Perfil de candidato não encontrado.', code: 'NOT_FOUND' }, 404)
    }

    // 2. Fetch Job details
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    })

    if (!job || job.status !== 'ACTIVE') {
      return c.json({ error: 'Vaga não encontrada ou inativa.', code: 'NOT_FOUND' }, 404)
    }

    // 3. Verify if already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobId_candidateId: {
          jobId,
          candidateId: candidate.id,
        },
      },
    })

    if (existingApplication) {
      return c.json({ error: 'Você já se candidatou para esta vaga.', code: 'ALREADY_EXISTS' }, 409)
    }

    // 4. Generate AI match analysis
    let matchScore = 0
    let aiFeedbackJson = ''
    try {
      const { generateJobMatchAnalysis } = require('../lib/gemini')
      const analysis = await generateJobMatchAnalysis(
        {
          headline: candidate.headline,
          bio: candidate.bio,
          skills: candidate.skills,
          experienceYears: candidate.experienceYears,
          salaryExpected: candidate.salaryExpected
        },
        {
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          skills: job.skills,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax
        }
      )
      matchScore = analysis.matchScore
      aiFeedbackJson = JSON.stringify(analysis)
    } catch (err) {
      console.error('Error generating AI match analysis, using fallback:', err)
      // Fallback matching logic
      if (job.skills.length > 0 && candidate.skills.length > 0) {
        const jobSkillsLower = job.skills.map((s) => s.toLowerCase().trim())
        const candidateSkillsLower = candidate.skills.map((s) => s.toLowerCase().trim())
        const matches = jobSkillsLower.filter((s) => candidateSkillsLower.includes(s))
        matchScore = Math.round((matches.length / jobSkillsLower.length) * 100)
      } else {
        matchScore = 70
      }
      aiFeedbackJson = JSON.stringify({
        matchScore,
        classification: matchScore >= 60 ? 'Fit' : 'No Fit',
        compatibleSkills: candidate.skills.filter(s => job.skills.includes(s)),
        missingSkills: job.skills.filter(s => !candidate.skills.includes(s)),
        developmentSuggestions: 'Conclua cursos recomendados sobre as tecnologias desta vaga.',
        salaryEstimation: job.salaryMin ? `R$ ${job.salaryMin} - R$ ${job.salaryMax}` : 'Faixa de mercado compatível.'
      })
    }

    // 5. Create Application
    const application = await prisma.application.create({
      data: {
        jobId,
        candidateId: candidate.id,
        coverLetter,
        matchScore,
        feedback: aiFeedbackJson,
        status: 'APPLIED',
      },
    })

    return c.json({ application }, 201)

  } catch (error: any) {
    console.error('Create application error:', error)
    return c.json({ error: 'Erro ao enviar candidatura: ' + error.message, code: 'INTERNAL_ERROR' }, 500)
  }
})

// GET /api/v1/applications - List candidate's applications
app.get('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    if (user.role !== 'CANDIDATE') {
      return c.json({ error: 'Apenas candidatos podem visualizar suas candidaturas.', code: 'FORBIDDEN' }, 403)
    }

    const candidate = await prisma.candidate.findUnique({
      where: { userId: user.userId },
    })

    if (!candidate) {
      return c.json({ error: 'Perfil de candidato não encontrado.', code: 'NOT_FOUND' }, 404)
    }

    const applications = await prisma.application.findMany({
      where: { candidateId: candidate.id },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            workplaceType: true,
            workType: true,
            location: true,
            salaryMin: true,
            salaryMax: true,
            company: {
              select: {
                name: true,
                logoUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return c.json({ applications })

  } catch (error: any) {
    console.error('List applications error:', error)
    return c.json({ error: 'Erro ao listar candidaturas: ' + error.message, code: 'INTERNAL_ERROR' }, 500)
  }
})

// GET /api/v1/applications/job/:jobId - List applications for a specific job (Company only)
app.get('/job/:jobId', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const jobId = c.req.param('jobId')

    if (user.role !== 'COMPANY') {
      return c.json({ error: 'Apenas empresas podem listar candidatos.', code: 'FORBIDDEN' }, 403)
    }

    const company = await prisma.company.findUnique({
      where: { userId: user.userId },
    })

    if (!company) {
      return c.json({ error: 'Perfil de empresa não encontrado.', code: 'NOT_FOUND' }, 404)
    }

    // Verify ownership of the job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    })

    if (!job || job.companyId !== company.id) {
      return c.json({ error: 'Não autorizado ou vaga não encontrada.', code: 'UNAUTHORIZED' }, 401)
    }

    const applications = await prisma.application.findMany({
      where: { jobId },
      include: {
        candidate: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { matchScore: 'desc' }, // Highlight the best matching candidates first
    })

    return c.json({ applications })

  } catch (error: any) {
    console.error('List job applications error:', error)
    return c.json({ error: 'Erro ao listar candidaturas da vaga: ' + error.message, code: 'INTERNAL_ERROR' }, 500)
  }
})

// PATCH /api/v1/applications/:id/status - Update application status (Company only)
app.patch('/:id/status', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    const user = c.get('user')
    const { status } = await c.req.json()

    if (user.role !== 'COMPANY') {
      return c.json({ error: 'Apenas empresas podem atualizar status de candidaturas.', code: 'FORBIDDEN' }, 403)
    }

    const company = await prisma.company.findUnique({
      where: { userId: user.userId },
    })

    if (!company) {
      return c.json({ error: 'Perfil de empresa não encontrado.', code: 'NOT_FOUND' }, 404)
    }

    // Find application and check ownership via job
    const application = await prisma.application.findUnique({
      where: { id },
      include: { job: true },
    })

    if (!application || application.job.companyId !== company.id) {
      return c.json({ error: 'Candidatura não encontrada ou não autorizada.', code: 'NOT_FOUND' }, 404)
    }

    const updatedApplication = await prisma.application.update({
      where: { id },
      data: { status },
    })

    return c.json({ application: updatedApplication })

  } catch (error: any) {
    console.error('Update status error:', error)
    return c.json({ error: 'Erro ao atualizar status da candidatura: ' + error.message, code: 'INTERNAL_ERROR' }, 500)
  }
})

// DELETE /api/v1/applications/:id - Candidato cancela (retira) a própria candidatura
app.delete('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    const user = c.get('user')

    if (user.role !== 'CANDIDATE') {
      return c.json({ error: 'Apenas candidatos podem cancelar candidaturas.', code: 'FORBIDDEN' }, 403)
    }

    const candidate = await prisma.candidate.findUnique({
      where: { userId: user.userId },
    })

    if (!candidate) {
      return c.json({ error: 'Perfil de candidato não encontrado.', code: 'NOT_FOUND' }, 404)
    }

    const application = await prisma.application.findUnique({
      where: { id },
    })

    if (!application || application.candidateId !== candidate.id) {
      return c.json({ error: 'Candidatura não encontrada ou não autorizada.', code: 'NOT_FOUND' }, 404)
    }

    await prisma.application.delete({ where: { id } })

    return c.json({ message: 'Candidatura cancelada com sucesso.' })
  } catch (error: any) {
    console.error('Cancel application error:', error)
    return c.json({ error: 'Erro ao cancelar candidatura: ' + error.message, code: 'INTERNAL_ERROR' }, 500)
  }
})

export default app
