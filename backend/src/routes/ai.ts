import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { generateEmbedding, analyzeResume } from '../lib/gemini'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// POST /api/v1/ai/search - Semantic search for jobs using pgvector
app.post('/search', async (c) => {
  try {
    const { query } = await c.req.json()
    if (!query || query.trim() === '') {
      return c.json({ error: 'A query de busca é obrigatória.', code: 'BAD_REQUEST' }, 400)
    }

    const vector = await generateEmbedding(query)
    
    // Query jobs with similarity score using pgvector cosine distance
    const results = await prisma.$queryRaw<any[]>`
      SELECT 
        j.id, 
        j.title, 
        j.description, 
        j.location, 
        j."workType" as "workType", 
        j."workplaceType" as "workplaceType", 
        j."salaryMin" as "salaryMin", 
        j."salaryMax" as "salaryMax", 
        j.skills,
        c.name as "companyName", 
        c."logoUrl" as "companyLogo",
        c.sector as "companySector",
        (1 - (j.embedding <=> ${vector}::vector)) as "similarity"
      FROM "Job" j
      JOIN "Company" c ON j."companyId" = c.id
      WHERE j.status = 'ACTIVE' AND j.embedding IS NOT NULL
      ORDER BY j.embedding <=> ${vector}::vector
      LIMIT 10;
    `

    // Map result fields correctly for frontend consumption
    const formattedResults = results.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      location: row.location,
      workType: row.workType,
      workplaceType: row.workplaceType,
      salaryMin: row.salaryMin,
      salaryMax: row.salaryMax,
      skills: row.skills,
      matchScore: Math.round((row.similarity || 0) * 100), // Map cosine similarity to match score percentage
      company: {
        name: row.companyName,
        logoUrl: row.companyLogo,
        sector: row.companySector
      }
    }))

    return c.json({ results: formattedResults })
  } catch (error: any) {
    console.error('Semantic search error:', error)
    return c.json({ error: 'Erro ao realizar busca semântica: ' + error.message, code: 'INTERNAL_ERROR' }, 500)
  }
})

// POST /api/v1/ai/analyze-resume - Give AI feedback on a resume
app.post('/analyze-resume', async (c) => {
  try {
    const { resumeText, jobRequirements } = await c.req.json()
    if (!resumeText) {
      return c.json({ error: 'O texto do currículo é obrigatório.', code: 'BAD_REQUEST' }, 400)
    }

    const feedback = await analyzeResume(resumeText, jobRequirements)
    return c.json({ feedback })
  } catch (error: any) {
    console.error('Analyze resume error:', error)
    return c.json({ error: 'Erro ao analisar currículo: ' + error.message }, 500)
  }
})

// GET /api/v1/ai/ranking - Get top 5 job matches for the logged-in candidate using pgvector
app.get('/ranking', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    if (user.role !== 'CANDIDATE') {
      return c.json({ error: 'Apenas candidatos podem visualizar seu ranking de vagas.', code: 'FORBIDDEN' }, 403)
    }

    const candidate = await prisma.candidate.findUnique({
      where: { userId: user.userId }
    })

    if (!candidate) {
      return c.json({ error: 'Perfil de candidato não encontrado.', code: 'NOT_FOUND' }, 404)
    }

    // Generate candidate embedding if missing
    let embedding = candidate.embedding as number[] | null
    if (!embedding) {
      const textToEmbed = `${candidate.headline || ''} ${candidate.bio || ''} ${candidate.skills.join(' ')}`
      embedding = await generateEmbedding(textToEmbed)
      const vectorStr = `[${embedding.join(',')}]`
      await prisma.$executeRawUnsafe(
        'UPDATE "Candidate" SET embedding = $1::vector WHERE id = $2;',
        vectorStr,
        candidate.id
      )
    }

    // Query top 5 most similar active jobs using pgvector
    const results = await prisma.$queryRaw<any[]>`
      SELECT 
        j.id, 
        j.title, 
        j.description, 
        j.location, 
        j."workType" as "workType", 
        j."workplaceType" as "workplaceType", 
        j."salaryMin" as "salaryMin", 
        j."salaryMax" as "salaryMax", 
        j.skills,
        c.name as "companyName", 
        c."logoUrl" as "companyLogo",
        c.sector as "companySector",
        (1 - (j.embedding <=> ${embedding}::vector)) as "similarity"
      FROM "Job" j
      JOIN "Company" c ON j."companyId" = c.id
      WHERE j.status = 'ACTIVE' AND j.embedding IS NOT NULL
      ORDER BY j.embedding <=> ${embedding}::vector
      LIMIT 5;
    `

    const formattedResults = results.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      location: row.location,
      workType: row.workType,
      workplaceType: row.workplaceType,
      salaryMin: row.salaryMin,
      salaryMax: row.salaryMax,
      skills: row.skills,
      matchScore: Math.round((row.similarity || 0) * 100),
      company: {
        name: row.companyName,
        logoUrl: row.companyLogo,
        sector: row.companySector
      }
    }))

    return c.json({ ranking: formattedResults })
  } catch (error: any) {
    console.error('Job ranking error:', error)
    return c.json({ error: 'Erro ao obter ranking de vagas: ' + error.message, code: 'INTERNAL_ERROR' }, 500)
  }
})

export default app
