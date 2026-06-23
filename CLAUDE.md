# JobSpark — Plataforma de Recrutamento e Seleção

> Concorrente direta da Gupy.io. Foco em UX superior, IA nativa, e match inteligente candidato-vaga.

---

## Visão do Produto

JobSpark é uma plataforma SaaS de recrutamento que conecta candidatos a empresas. Diferencial principal: **IA de match bidirecional** — não só a empresa filtra candidatos, o candidato também vê o fit com cada vaga em tempo real.

**Usuários-alvo:**
- Candidatos buscando emprego (B2C)
- Empresas/RH contratando (B2B)
- Recrutadores independentes

---

## Stack Tecnológica

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Estilização:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **Estado global:** Zustand
- **Formulários:** React Hook Form + Zod
- **Gráficos:** Recharts
- **Animações:** Framer Motion
- **Ícones:** Lucide React

### Backend
- **Runtime:** Node.js + Bun
- **Framework:** Hono.js (edge-compatible, rápido)
- **ORM:** Prisma
- **Banco de dados:** PostgreSQL (Neon serverless)
- **Cache:** Redis (Upstash)
- **Autenticação:** Better Auth (ou Clerk)
- **File storage:** Cloudflare R2 (currículos, logos)
- **Fila de jobs:** BullMQ

### IA / ML
- **LLM:** Google Gemini 2.0 Flash (análise de currículos, triagem)
- **Embeddings:** text-embedding-004 (match semântico de vagas)
- **Vector DB:** pgvector (embutido no PostgreSQL)

### Infraestrutura
- **Deploy frontend:** Vercel
- **Deploy backend:** Railway / Fly.io
- **CDN:** Cloudflare
- **Monitoramento:** Sentry + Posthog

---

## Estrutura de Pastas

```
jobs-platform/
├── CLAUDE.md                    ← Este arquivo
├── frontend/
│   ├── src/
│   │   ├── app/                 ← Next.js App Router
│   │   │   ├── (auth)/          ← Login, registro
│   │   │   ├── (candidate)/     ← Portal do candidato
│   │   │   ├── (company)/       ← Portal da empresa/RH
│   │   │   ├── (recruiter)/     ← Portal do recrutador
│   │   │   └── api/             ← Route handlers Next.js
│   │   ├── components/
│   │   │   ├── ui/              ← shadcn/ui base components
│   │   │   ├── candidate/       ← Componentes do candidato
│   │   │   ├── company/         ← Componentes da empresa
│   │   │   └── shared/          ← Componentes compartilhados
│   │   ├── hooks/               ← React hooks customizados
│   │   ├── lib/
│   │   │   ├── api.ts           ← Client API
│   │   │   ├── auth.ts          ← Auth helpers
│   │   │   └── utils.ts
│   │   └── styles/
│   │       └── globals.css
│   ├── public/
│   ├── package.json
│   └── next.config.ts
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── jobs.ts
│   │   │   ├── candidates.ts
│   │   │   ├── companies.ts
│   │   │   ├── applications.ts
│   │   │   └── ai.ts
│   │   ├── services/
│   │   │   ├── matchService.ts  ← Motor de match IA
│   │   │   ├── resumeService.ts ← Parse e análise de currículo
│   │   │   ├── emailService.ts
│   │   │   └── notificationService.ts
│   │   ├── models/              ← Types/interfaces Prisma
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── rateLimit.ts
│   │   │   └── cors.ts
│   │   └── index.ts             ← Entry point Hono
│   ├── prisma/
│   │   ├── schema.prisma        ← Schema do banco
│   │   └── migrations/
│   └── package.json
├── infra/
│   ├── docker-compose.yml       ← PostgreSQL + Redis local
│   └── .env.example
└── docs/
    ├── PRD.md                   ← Product Requirements
    ├── API.md                   ← Documentação da API
    └── DIFERENCIAIS.md          ← Diferenciais vs Gupy
```

---

## Modelo de Dados (Prisma Schema Core)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      Role     @default(CANDIDATE)
  createdAt DateTime @default(now())

  candidate  Candidate?
  company    Company?
  recruiter  Recruiter?
}

enum Role {
  CANDIDATE
  COMPANY
  RECRUITER
  ADMIN
}

model Candidate {
  id           String  @id @default(cuid())
  userId       String  @unique
  user         User    @relation(fields: [userId], references: [id])
  headline     String?
  bio          String?
  resumeUrl    String?
  skills       String[] // array de skills
  experienceYears Int  @default(0)
  aiScore      Float?   // score gerado por IA
  embedding    Unsupported("vector(768)")? // pgvector

  applications Application[]
  savedJobs    SavedJob[]
}

model Company {
  id          String  @id @default(cuid())
  userId      String  @unique
  user        User    @relation(fields: [userId], references: [id])
  name        String
  cnpj        String  @unique
  logoUrl     String?
  sector      String?
  size        CompanySize @default(STARTUP)
  plan        Plan    @default(FREE)

  jobs        Job[]
}

enum CompanySize { STARTUP SMALL MEDIUM LARGE ENTERPRISE }
enum Plan { FREE BASIC PRO ENTERPRISE }

model Job {
  id              String     @id @default(cuid())
  companyId       String
  company         Company    @relation(fields: [companyId], references: [id])
  title           String
  description     String
  requirements    String[]
  skills          String[]
  salary          SalaryRange?
  workType        WorkType   @default(HYBRID)
  workplaceType   WorkplaceType @default(ONSITE)
  location        String?
  status          JobStatus  @default(DRAFT)
  embedding       Unsupported("vector(768)")?
  aiAnalysis      Json?      // análise gerada por IA
  createdAt       DateTime   @default(now())
  expiresAt       DateTime?

  applications    Application[]
  savedBy         SavedJob[]
}

enum WorkType { FULL_TIME PART_TIME FREELANCE INTERNSHIP }
enum WorkplaceType { ONSITE REMOTE HYBRID }
enum JobStatus { DRAFT ACTIVE PAUSED CLOSED }

model Application {
  id          String            @id @default(cuid())
  jobId       String
  job         Job               @relation(fields: [jobId], references: [id])
  candidateId String
  candidate   Candidate         @relation(fields: [candidateId], references: [id])
  status      ApplicationStatus @default(APPLIED)
  matchScore  Float?            // score de match IA (0-100)
  coverLetter String?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  @@unique([jobId, candidateId])
}

enum ApplicationStatus {
  APPLIED
  SCREENING   // triagem por IA
  VIEWED
  SHORTLISTED
  INTERVIEW
  OFFER
  HIRED
  REJECTED
}
```

---

## Páginas e Rotas

### Portal do Candidato (`/app/candidato/`)
| Rota | Página | Descrição |
|------|--------|-----------|
| `/vagas` | Feed de Vagas | Lista de vagas com match score personalizado |
| `/vagas/[id]` | Detalhe da Vaga | Descrição + fit score + candidatura rápida |
| `/candidaturas` | Minhas Candidaturas | Status de todas as candidaturas em tempo real |
| `/perfil` | Meu Perfil | Currículo, skills, experiência |
| `/perfil/ia` | Análise por IA | Feedback do currículo + sugestões |

### Portal da Empresa (`/app/empresa/`)
| Rota | Página | Descrição |
|------|--------|-----------|
| `/vagas` | Gerenciar Vagas | CRUD de vagas + métricas |
| `/vagas/nova` | Criar Vaga | Formulário com sugestões de IA |
| `/vagas/[id]/candidatos` | Candidatos da Vaga | Pipeline Kanban de candidatos |
| `/talentos` | Banco de Talentos | Busca semântica por candidatos |
| `/relatorios` | Relatórios | Métricas de recrutamento + funil |

---

## Diferenciais vs Gupy (Implementar Primeiro)

1. **Match Score Visível ao Candidato** — candidato vê seu % de fit com cada vaga antes de se candidatar
2. **Candidatura em 1 clique** — perfil salvo, sem refazer o formulário a cada candidatura
3. **Status em Tempo Real** — WebSocket/SSE para atualizações instantâneas de candidatura
4. **Feedback por IA no currículo** — ao fazer upload, o candidato recebe análise e sugestões
5. **Busca Semântica de Vagas** — "quero trabalhar com IA em startup remota" → busca por vetor
6. **Pipeline Kanban visual** — RH arrasta candidatos entre etapas como um Trello
7. **Entrevistas assíncronas** — candidato grava vídeo resposta a perguntas pré-definidas
8. **Sem SPAM de recrutadores** — empresa só contata após candidato aceitar o contato
9. **Salary transparency** — todas as vagas exibem faixa salarial obrigatoriamente
10. **Analytics para candidato** — candidato vê quantas vezes seu perfil foi visualizado

---

## Comandos de Desenvolvimento

```bash
# Subir ambiente local
cd infra && docker-compose up -d

# Backend
cd backend && bun install && bun dev

# Frontend
cd frontend && npm install && npm run dev

# Migrations
cd backend && bunx prisma migrate dev

# Gerar Prisma Client
cd backend && bunx prisma generate
```

---

## Variáveis de Ambiente

Copiar `infra/.env.example` para `.env` na raiz de cada serviço.

**Backend:**
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
GOOGLE_AI_API_KEY=...
JWT_SECRET=...
R2_BUCKET_URL=...
R2_ACCESS_KEY=...
R2_SECRET_KEY=...
```

**Frontend:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Prioridade de Implementação (MVP)

### Fase 1 — Core (Semanas 1-3)
- [ ] Autenticação (candidato + empresa)
- [ ] CRUD de Vagas (empresa)
- [ ] Feed de Vagas (candidato)
- [ ] Sistema de Candidatura
- [ ] Dashboard básico empresa

### Fase 2 — IA (Semanas 4-6)
- [ ] Parse de currículo com Gemini
- [ ] Geração de embeddings de vagas e candidatos
- [ ] Match Score bidirecional
- [ ] Busca semântica
- [ ] Sugestões na criação de vagas

### Fase 3 — Experiência (Semanas 7-9)
- [ ] Pipeline Kanban de candidatos
- [ ] Notificações em tempo real (WebSocket)
- [ ] Entrevistas assíncronas (gravação de vídeo)
- [ ] Analytics para candidato e empresa
- [ ] Salary transparency enforcement

### Fase 4 — Monetização (Semana 10+)
- [ ] Planos de assinatura (Free/Basic/Pro/Enterprise)
- [ ] Integração Stripe
- [ ] Destaque de vagas pagas
- [ ] Banco de talentos (feature paga)

---

## Convenções de Código

- **TypeScript strict mode** em todo o projeto
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`)
- **Nomenclatura:** camelCase para variáveis, PascalCase para componentes/tipos
- **API:** REST + JSON, versionada (`/api/v1/`)
- **Erros:** sempre retornar `{ error: string, code: string }` padronizado
- **Testes:** Vitest para unitários, Playwright para E2E (Fase 3)

---

## Contexto para o Claude

Este é um projeto SaaS de recrutamento. Ao receber uma tarefa:
1. Verifique sempre o schema Prisma antes de criar serviços
2. Use Hono.js para rotas do backend, não Express
3. Use App Router do Next.js (não Pages Router)
4. Componentes de UI preferem shadcn/ui + Tailwind v4
5. Toda lógica de IA fica em `backend/src/services/`
6. Match score usa pgvector — não fazer cálculos client-side
7. Nunca expor API keys no frontend
