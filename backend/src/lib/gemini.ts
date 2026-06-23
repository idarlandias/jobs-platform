// Camada de IA do JobSpark.
// LLM: Groq (API compatível com OpenAI) — análise de currículo e match candidato↔vaga.
// Embeddings: Groq NÃO possui endpoint de embeddings, então usamos um embedding
// local determinístico por hashing de tokens (bom o bastante para busca semântica
// na demo: textos parecidos geram vetores parecidos). Mantemos o nome do arquivo
// (gemini.ts) para não quebrar os imports existentes.

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const isMockKey = GROQ_API_KEY === '' || GROQ_API_KEY === 'mock_key_for_now'

const GOOGLE_API_KEY = process.env.GOOGLE_AI_API_KEY || ''
const GOOGLE_EMBED_MODEL = process.env.GOOGLE_EMBED_MODEL || 'gemini-embedding-001'
const hasGoogleEmbeddings = GOOGLE_API_KEY !== '' && GOOGLE_API_KEY !== 'mock_key_for_now'

/** true quando o LLM (Groq) está em modo simulado (sem chave real). */
export const isAIMock = isMockKey
/** 'google' quando há chave de embeddings; 'local' = hashing determinístico. */
export const embeddingProvider: 'google' | 'local' = hasGoogleEmbeddings ? 'google' : 'local'

/** Normalização L2 — deixa a similaridade de cosseno consistente. */
function l2norm(v: number[]): number[] {
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1
  return v.map((x) => x / n)
}

interface ChatMessage {
  role: 'system' | 'user'
  content: string
}

async function groqChat(messages: ChatMessage[], opts: { json?: boolean } = {}): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.4,
      ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Groq API ${res.status}: ${body}`)
  }

  const data: any = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('Resposta vazia do Groq.')
  return content
}

/**
 * Embedding de 768 dimensões. Usa Google `gemini-embedding-001` quando há
 * GOOGLE_AI_API_KEY; senão (ou em caso de falha) cai no embedding local.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (hasGoogleEmbeddings) {
    try {
      return await googleEmbedding(text)
    } catch (err) {
      console.error('Falha no embedding Google, usando fallback local:', err)
    }
  }
  return localEmbedding(text)
}

/** Embedding real via Google Generative Language API (768d, L2-normalizado). */
async function googleEmbedding(text: string): Promise<number[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_EMBED_MODEL}:embedContent?key=${GOOGLE_API_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${GOOGLE_EMBED_MODEL}`,
      content: { parts: [{ text: text || '' }] },
      outputDimensionality: 768,
    }),
  })
  if (!res.ok) throw new Error(`Google embeddings ${res.status}: ${await res.text()}`)
  const data: any = await res.json()
  const values = data?.embedding?.values
  if (!Array.isArray(values)) throw new Error('Embedding vazio do Google.')
  return l2norm(values)
}

/**
 * Embedding local determinístico de 768 dimensões (hashing de tokens + L2-norm).
 * Sem rede. Textos com tokens em comum ficam próximos no espaço vetorial.
 */
function localEmbedding(text: string): number[] {
  const dims = 768
  const vec = new Array<number>(dims).fill(0)
  const tokens = (text || '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || []

  for (const tok of tokens) {
    // FNV-1a hash → índice da dimensão
    let h = 2166136261
    for (let i = 0; i < tok.length; i++) {
      h ^= tok.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    const idx = Math.abs(h) % dims
    const sign = (h & 1) === 0 ? 1 : -1
    vec[idx] += sign
  }

  return l2norm(vec)
}

/**
 * Análise de currículo via Groq (Llama 3.3). Fallback estático se não houver chave.
 */
export async function analyzeResume(resumeText: string, jobRequirements?: string): Promise<string> {
  if (isMockKey) {
    console.warn('Using mock resume analysis (GROQ_API_KEY não configurada)')
    return 'Seu currículo apresenta boa estrutura básica. Dica: Adicione competências mais específicas sobre tecnologias de nuvem e bancos de dados para aumentar o match com vagas backend.'
  }

  try {
    let userPrompt = `Analise o seguinte currículo profissional e dê um feedback construtivo resumido (dicas de melhoria de formatação, competências que faltam ou pontos fortes):\n\n${resumeText}`
    if (jobRequirements) {
      userPrompt += `\n\nCompare o currículo com os seguintes requisitos da vaga e aponte se o perfil é compatível:\n\n${jobRequirements}`
    }

    return await groqChat([
      { role: 'system', content: 'Você é um especialista em recrutamento e seleção. Responda em português do Brasil, de forma objetiva.' },
      { role: 'user', content: userPrompt },
    ])
  } catch (error: any) {
    console.error('Error generating content with Groq:', error)
    return 'Erro ao gerar análise de IA: Não foi possível conectar ao modelo no momento.'
  }
}

interface JobMatchAnalysisInput {
  headline?: string | null
  bio?: string | null
  skills: string[]
  experienceYears: number
  salaryExpected?: number | null
}

interface JobInput {
  title: string
  description: string
  requirements: string[]
  skills: string[]
  salaryMin?: number | null
  salaryMax?: number | null
}

export interface JobMatchAnalysisResult {
  matchScore: number
  classification: 'Fit' | 'No Fit'
  compatibleSkills: string[]
  missingSkills: string[]
  developmentSuggestions: string
  salaryEstimation: string
}

/**
 * Análise estruturada de match candidato↔vaga via Groq (Llama 3.3, JSON mode).
 */
export async function generateJobMatchAnalysis(
  candidateProfile: JobMatchAnalysisInput,
  job: JobInput
): Promise<JobMatchAnalysisResult> {
  if (isMockKey) {
    console.warn('Using mock job match analysis (GROQ_API_KEY não configurada)')
    const jobSkillsLower = job.skills.map((s) => s.toLowerCase().trim())
    const candidateSkillsLower = candidateProfile.skills.map((s) => s.toLowerCase().trim())
    const matches = jobSkillsLower.filter((s) => candidateSkillsLower.includes(s))

    let score = jobSkillsLower.length > 0 ? Math.round((matches.length / jobSkillsLower.length) * 100) : 75
    if (candidateProfile.experienceYears >= 5) score = Math.min(100, score + 15)
    else if (candidateProfile.experienceYears <= 1) score = Math.max(10, score - 15)

    const missing = job.skills.filter(
      (s) => !candidateProfile.skills.some((cs) => cs.toLowerCase().includes(s.toLowerCase()))
    )
    const compatible = job.skills.filter(
      (s) => candidateProfile.skills.some((cs) => cs.toLowerCase().includes(s.toLowerCase()))
    )

    return {
      matchScore: score,
      classification: score >= 60 ? 'Fit' : 'No Fit',
      compatibleSkills: compatible.length > 0 ? compatible : ['Lógica de programação', 'Trabalho em equipe'],
      missingSkills: missing.length > 0 ? missing : ['Práticas de CI/CD', 'Testes automatizados'],
      developmentSuggestions: `Para se destacar nesta posição, sugerimos focar em dominar: ${
        missing.length > 0 ? missing.join(', ') : 'Arquitetura de Software e Cloud computing'
      }. Pratique desenvolvendo projetos reais.`,
      salaryEstimation: job.salaryMin
        ? `A faixa salarial de R$ ${job.salaryMin.toLocaleString('pt-BR')} a R$ ${job.salaryMax?.toLocaleString('pt-BR')} proposta para a vaga está compatível com a média de mercado.`
        : 'Estimativa de mercado atual para profissionais similares: R$ 6.000,00 a R$ 9.000,00.',
    }
  }

  const prompt = `Você é um motor de IA de recrutamento e seleção avançado.
Analise a compatibilidade entre o perfil do Candidato e a Vaga de Emprego especificados abaixo.

Perfil do Candidato:
- Cargo/Headline: ${candidateProfile.headline || 'Não informado'}
- Resumo/Bio: ${candidateProfile.bio || 'Não informado'}
- Anos de Experiência: ${candidateProfile.experienceYears} anos
- Principais Competências: ${candidateProfile.skills.join(', ')}
- Pretensão Salarial: ${candidateProfile.salaryExpected ? `R$ ${candidateProfile.salaryExpected}` : 'Não informada'}

Dados da Vaga:
- Título: ${job.title}
- Descrição: ${job.description}
- Requisitos: ${job.requirements.join('; ')}
- Competências Necessárias: ${job.skills.join(', ')}
- Faixa Salarial Proposta: ${job.salaryMin ? `R$ ${job.salaryMin} - R$ ${job.salaryMax}` : 'Não especificada'}

Retorne obrigatoriamente um objeto JSON com exatamente estes campos:
{
  "matchScore": número inteiro de 0 a 100 (aderência do candidato à vaga),
  "classification": "Fit" se matchScore >= 60, caso contrário "No Fit",
  "compatibleSkills": array de strings com as habilidades do candidato relevantes para a vaga,
  "missingSkills": array de strings com as habilidades importantes da vaga que faltam no candidato,
  "developmentSuggestions": string com sugestão de desenvolvimento personalizada,
  "salaryEstimation": string com estimativa fundamentada de faixa salarial para o mercado brasileiro atual
}`

  try {
    const text = await groqChat(
      [
        { role: 'system', content: 'Você responde exclusivamente com JSON válido, em português do Brasil.' },
        { role: 'user', content: prompt },
      ],
      { json: true }
    )
    return JSON.parse(text) as JobMatchAnalysisResult
  } catch (error: any) {
    console.error('Error generating job match analysis with Groq:', error)
    throw new Error('Falha ao gerar análise de match com IA: ' + error.message)
  }
}
