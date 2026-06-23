import { prisma } from './lib/prisma'
import { hashPassword } from './lib/authUtils'
import { generateEmbedding } from './lib/gemini'

/**
 * Seed de demonstração — idempotente.
 * Cria 1 empresa, 1 candidato e algumas vagas com embeddings.
 * Login demo:
 *   Empresa:   empresa@demo.com   / demo1234
 *   Candidato: candidato@demo.com / demo1234
 */

const DEMO_PASSWORD = 'demo1234'

const DEMO_JOBS = [
  {
    title: 'Desenvolvedor(a) Backend Node.js Sênior',
    description:
      'Construa APIs escaláveis em Node.js e TypeScript, com foco em performance, testes e boas práticas de arquitetura.',
    requirements: ['Experiência sólida com Node.js', 'Conhecimento em PostgreSQL', 'Testes automatizados'],
    skills: ['Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'REST API'],
    benefits: ['Vale refeição', 'Plano de saúde', 'Home office'],
    workType: 'FULL_TIME' as const,
    workplaceType: 'REMOTE' as const,
    location: 'Remoto',
    salaryMin: 9000,
    salaryMax: 14000,
  },
  {
    title: 'Engenheiro(a) de Machine Learning',
    description:
      'Desenvolva e implante modelos de visão computacional e NLP em produção, trabalhando com pipelines de dados e MLOps.',
    requirements: ['Python avançado', 'Experiência com TensorFlow ou PyTorch', 'Deploy de modelos'],
    skills: ['Python', 'TensorFlow', 'Machine Learning', 'Docker', 'MLOps'],
    benefits: ['Bônus anual', 'Plano de saúde', 'Auxílio educação'],
    workType: 'FULL_TIME' as const,
    workplaceType: 'HYBRID' as const,
    location: 'São Paulo, SP',
    salaryMin: 12000,
    salaryMax: 18000,
  },
  {
    title: 'Desenvolvedor(a) Frontend React',
    description:
      'Crie interfaces modernas e acessíveis com React, Next.js e Tailwind, colaborando próximo ao time de design.',
    requirements: ['React e Next.js', 'CSS moderno', 'Boas práticas de acessibilidade'],
    skills: ['React', 'Next.js', 'TypeScript', 'Tailwind', 'UI'],
    benefits: ['Vale refeição', 'Gympass', 'Home office'],
    workType: 'FULL_TIME' as const,
    workplaceType: 'REMOTE' as const,
    location: 'Remoto',
    salaryMin: 7000,
    salaryMax: 11000,
  },
]

async function setEmbedding(table: 'Job' | 'Candidate', id: string, text: string) {
  try {
    const vector = await generateEmbedding(text)
    const vectorStr = `[${vector.join(',')}]`
    await prisma.$executeRawUnsafe(`UPDATE "${table}" SET embedding = $1::vector WHERE id = $2;`, vectorStr, id)
  } catch (err) {
    console.warn(`Não foi possível gerar embedding para ${table} ${id}:`, err)
  }
}

async function run() {
  console.log('🌱 Seed de demonstração iniciando...')
  const passwordHash = await hashPassword(DEMO_PASSWORD)

  // ---- Empresa demo ----
  let companyUser = await prisma.user.findUnique({ where: { email: 'empresa@demo.com' }, include: { company: true } })
  if (!companyUser) {
    companyUser = await prisma.user.create({
      data: {
        email: 'empresa@demo.com',
        name: 'TechNova Solutions',
        role: 'COMPANY',
        passwordHash,
        company: {
          create: {
            name: 'TechNova Solutions',
            cnpj: '12.345.678/0001-90',
            sector: 'Tecnologia',
            size: 'MEDIUM',
            description: 'Consultoria de software e IA para empresas do Nordeste.',
            isVerified: true,
          },
        },
      },
      include: { company: true },
    })
    console.log('✅ Empresa demo criada: empresa@demo.com / ' + DEMO_PASSWORD)
  } else {
    console.log('ℹ️  Empresa demo já existe, reaproveitando.')
  }

  const company = await prisma.company.findUnique({ where: { userId: companyUser.id } })
  if (!company) throw new Error('Falha ao localizar empresa demo.')

  // ---- Vagas demo ----
  for (const j of DEMO_JOBS) {
    const exists = await prisma.job.findFirst({ where: { companyId: company.id, title: j.title } })
    if (exists) {
      console.log(`ℹ️  Vaga já existe: ${j.title}`)
      continue
    }
    const job = await prisma.job.create({
      data: { ...j, companyId: company.id, status: 'ACTIVE' },
    })
    await setEmbedding('Job', job.id, `${j.title} ${j.description} ${j.skills.join(' ')}`)
    console.log(`✅ Vaga criada: ${j.title}`)
  }

  // ---- Candidato demo ----
  let candidateUser = await prisma.user.findUnique({ where: { email: 'candidato@demo.com' } })
  if (!candidateUser) {
    candidateUser = await prisma.user.create({
      data: {
        email: 'candidato@demo.com',
        name: 'João da Silva',
        role: 'CANDIDATE',
        passwordHash,
        candidate: {
          create: {
            headline: 'Desenvolvedor Backend Node.js',
            bio: 'Dev backend com foco em APIs Node.js, TypeScript e PostgreSQL.',
            skills: ['Node.js', 'TypeScript', 'PostgreSQL', 'Docker'],
            experienceYears: 4,
            salaryExpected: 10000,
            city: 'Fortaleza',
            state: 'CE',
          },
        },
      },
    })
    const candidate = await prisma.candidate.findUnique({ where: { userId: candidateUser.id } })
    if (candidate) {
      await setEmbedding('Candidate', candidate.id, 'Desenvolvedor Backend Node.js TypeScript PostgreSQL Docker')
    }
    console.log('✅ Candidato demo criado: candidato@demo.com / ' + DEMO_PASSWORD)
  } else {
    console.log('ℹ️  Candidato demo já existe, reaproveitando.')
  }

  console.log('🌱 Seed concluído.')
}

run()
  .catch((e) => {
    console.error('Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => process.exit(0))
