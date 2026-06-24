import { Hono } from 'hono'

// Proxy para o microserviço de ML (modelos scikit-learn treinados).
const app = new Hono()
const ML = process.env.ML_SERVICE_URL || ''

async function callML(path: string, body: unknown) {
  if (!ML) throw new Error('ML_SERVICE_URL não configurado.')
  const res = await fetch(`${ML}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`ML service ${res.status}: ${await res.text()}`)
  return res.json()
}

// GET /api/v1/ml/health
app.get('/health', async (c) => {
  try {
    if (!ML) return c.json({ error: 'ML_SERVICE_URL não configurado.', code: 'CONFIG' }, 500)
    const res = await fetch(`${ML}/health`)
    return c.json(await res.json())
  } catch (e: any) {
    return c.json({ error: e.message, code: 'ML_ERROR' }, 502)
  }
})

// POST /api/v1/ml/predict-fit - classificação Fit x No Fit (modelo treinado)
app.post('/predict-fit', async (c) => {
  try {
    const body = await c.req.json()
    return c.json(await callML('/predict/fit', body))
  } catch (e: any) {
    return c.json({ error: e.message, code: 'ML_ERROR' }, 502)
  }
})

// POST /api/v1/ml/predict-salary - regressão de salário (modelo treinado)
app.post('/predict-salary', async (c) => {
  try {
    const body = await c.req.json()
    return c.json(await callML('/predict/salary', body))
  } catch (e: any) {
    return c.json({ error: e.message, code: 'ML_ERROR' }, 502)
  }
})

export default app
