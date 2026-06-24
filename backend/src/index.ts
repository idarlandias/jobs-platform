import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

import authRoutes from './routes/auth'
import jobsRoutes from './routes/jobs'
import candidatesRoutes from './routes/candidates'
import companiesRoutes from './routes/companies'
import applicationsRoutes from './routes/applications'
import aiRoutes from './routes/ai'
import mlRoutes from './routes/ml'
import { isAIMock, embeddingProvider } from './lib/gemini'

const app = new Hono()

// Middlewares globais
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  credentials: true,
}))

// Health check
app.get('/health', (c) => c.json({ status: 'ok', version: '0.1.0' }))

// Rotas
app.route('/api/v1/auth', authRoutes)
app.route('/api/v1/jobs', jobsRoutes)
app.route('/api/v1/candidates', candidatesRoutes)
app.route('/api/v1/companies', companiesRoutes)
app.route('/api/v1/applications', applicationsRoutes)
app.route('/api/v1/ai', aiRoutes)
app.route('/api/v1/ml', mlRoutes)

// 404
app.notFound((c) => c.json({ error: 'Not found', code: 'NOT_FOUND' }, 404))

// Error handler
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: err.message, code: 'INTERNAL_ERROR' }, 500)
})

const port = parseInt(process.env.PORT ?? '3001')
console.log(`🚀 JobSpark API running at http://localhost:${port}`)
console.log(
  isAIMock
    ? '⚠️  LLM em MODO MOCK (sem chave Groq). Defina GROQ_API_KEY no .env para IA real.'
    : '🤖 LLM real ativo (Groq, ' + (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile') + ').'
)
console.log(
  embeddingProvider === 'google'
    ? '🧬 Embeddings: Google gemini-embedding-001 (768d).'
    : '🧬 Embeddings: locais (determinísticos, sem chave Google).'
)

export default { port, fetch: app.fetch }
