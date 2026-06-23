import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// GET /api/v1/candidates/me - Fetch logged-in candidate profile
app.get('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    if (user.role !== 'CANDIDATE') {
      return c.json({ error: 'Apenas candidatos possuem perfil de candidato.', code: 'FORBIDDEN' }, 403)
    }

    const candidate = await prisma.candidate.findUnique({
      where: { userId: user.userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    })

    if (!candidate) {
      return c.json({ error: 'Perfil do candidato não encontrado.', code: 'NOT_FOUND' }, 404)
    }

    return c.json({ candidate })
  } catch (error: any) {
    return c.json({ error: 'Erro ao buscar perfil: ' + error.message }, 500)
  }
})

// PUT /api/v1/candidates/profile - Update candidate profile details
app.put('/profile', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    if (user.role !== 'CANDIDATE') {
      return c.json({ error: 'Apenas candidatos podem atualizar o perfil.', code: 'FORBIDDEN' }, 403)
    }

    const {
      headline,
      bio,
      linkedinUrl,
      githubUrl,
      portfolioUrl,
      skills,
      experienceYears,
      salaryExpected,
      city,
      state,
      resumeUrl
    } = await c.req.json()

    // Find candidate ID
    const candidate = await prisma.candidate.findUnique({
      where: { userId: user.userId }
    })

    if (!candidate) {
      return c.json({ error: 'Perfil do candidato não encontrado.', code: 'NOT_FOUND' }, 404)
    }

    // Clean up skills: make sure they are trimmed strings
    let cleanSkills: string[] = []
    if (Array.isArray(skills)) {
      cleanSkills = skills.map((s: string) => s.trim()).filter((s: string) => s.length > 0)
    } else if (typeof skills === 'string') {
      // In case skills are passed as a comma-separated string
      cleanSkills = (skills as string).split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
    }

    const updated = await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        headline: headline !== undefined ? headline : undefined,
        bio: bio !== undefined ? bio : undefined,
        linkedinUrl: linkedinUrl !== undefined ? linkedinUrl : undefined,
        githubUrl: githubUrl !== undefined ? githubUrl : undefined,
        portfolioUrl: portfolioUrl !== undefined ? portfolioUrl : undefined,
        skills: skills !== undefined ? cleanSkills : undefined,
        experienceYears: experienceYears !== undefined ? Number(experienceYears) : undefined,
        salaryExpected: salaryExpected !== undefined ? Number(salaryExpected) : undefined,
        city: city !== undefined ? city : undefined,
        state: state !== undefined ? state : undefined,
        resumeUrl: resumeUrl !== undefined ? resumeUrl : undefined,
      }
    })

    // Generate embedding asynchronously so it doesn't block the API response
    const { generateEmbedding } = require('../lib/gemini')
    const textToEmbed = `${headline || ''} ${bio || ''} ${cleanSkills.join(' ')}`
    generateEmbedding(textToEmbed)
      .then((vector: number[]) => {
        const vectorStr = `[${vector.join(',')}]`
        return prisma.$executeRawUnsafe(
          'UPDATE "Candidate" SET embedding = $1::vector WHERE id = $2;',
          vectorStr,
          updated.id
        )
      })
      .catch((err: any) => console.error('Failed to generate and save embedding for candidate:', err))

    return c.json({ candidate: updated, message: 'Perfil atualizado com sucesso!' })
  } catch (error: any) {
    return c.json({ error: 'Erro ao atualizar perfil: ' + error.message }, 500)
  }
})

// GET /api/v1/candidates/:id - Get any candidate by ID
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    })
    if (!candidate) {
      return c.json({ error: 'Candidato não encontrado' }, 404)
    }
    return c.json({ candidate })
  } catch (error: any) {
    return c.json({ error: 'Erro ao buscar candidato: ' + error.message }, 500)
  }
})

export default app
