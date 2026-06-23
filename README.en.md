<div align="center">

# ⚡ JobSpark

### AI-Powered, Two-Way Recruitment Platform

*Smart candidate ↔ job matching, transparent for both sides.*

[![Live](https://img.shields.io/badge/demo-online-success?style=flat-square)](https://jobspark-frontend-231292456749.southamerica-east1.run.app)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Hono](https://img.shields.io/badge/Hono-4-orange?style=flat-square&logo=hono)](https://hono.dev/)
[![Bun](https://img.shields.io/badge/Bun-1-fbf0df?style=flat-square&logo=bun)](https://bun.sh/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-336791?style=flat-square&logo=postgresql)](https://github.com/pgvector/pgvector)
[![Cloud Run](https://img.shields.io/badge/Deploy-Cloud%20Run-4285F4?style=flat-square&logo=googlecloud)](https://cloud.google.com/run)

**[🌐 Open the live demo](https://jobspark-frontend-231292456749.southamerica-east1.run.app)**

</div>

---

## 📖 About

**JobSpark** is a recruitment SaaS that connects candidates and companies through **transparent AI**. Unlike traditional tools (where candidates are kept in the dark), here **both sides see the match**: candidates see their fit percentage for every job *before* applying, and companies receive applicants already ranked by compatibility.

The intelligence is twofold:
- **Semantic search** via vector *embeddings* (pgvector) — finds jobs by meaning, not keywords.
- **LLM analysis** — resume feedback and structured match scoring (matching skills, gaps, development suggestions, salary estimate).

---

## ✨ Features

### For Candidates
- 🔍 **Job feed** with a personalized *match score* by skills
- 🧠 **Semantic search** ("I want to work with AI at a remote startup")
- 🎯 **Top 5 ranking** of jobs by vector similarity to the profile
- 📊 **AI application analysis** (matching skills, gaps, suggestions, salary estimate)
- 👤 **Editable profile** (headline, bio, skills, links, salary expectation)
- 📨 **Application tracking** with real-time status

### For Companies
- 📝 **Job CRUD** with **mandatory salary transparency**
- 📥 **Candidate pipeline** ranked by *match score*
- 🔄 **Application status updates** (screening → hired)
- 🏢 **Public company profile** with active jobs

---

## 🏗️ Architecture

```
┌──────────────────┐        HTTPS        ┌──────────────────┐
│   Next.js 15     │  ───────────────►   │   Hono + Bun     │
│   (Cloud Run)    │   REST /api/v1      │   (Cloud Run)    │
│   Frontend       │  ◄───────────────   │   Backend        │
└──────────────────┘                     └────────┬─────────┘
                                                   │ Prisma
                          ┌────────────────────────┼────────────────────┐
                          ▼                         ▼                    ▼
                  ┌───────────────┐        ┌────────────────┐   ┌────────────────┐
                  │  Neon         │        │  Groq (LLM)    │   │ Google         │
                  │  Postgres +   │        │  Llama 3.3 70B │   │ gemini-embed   │
                  │  pgvector     │        │  analysis/match│   │ -001 (768d)    │
                  └───────────────┘        └────────────────┘   └────────────────┘
```

### JobMatch AI flow

```mermaid
graph TD
    A[Candidate Profile] -->|Google gemini-embedding-001| B(768d Vector)
    C[Job Requirements] -->|Google gemini-embedding-001| D(768d Vector)
    B --> E{PostgreSQL pgvector}
    D --> E
    E -->|Cosine distance| F[Top 5 Job Ranking]

    A -->|Submits application| G{JobMatch AI - Groq Llama 3.3 70B}
    C --> G
    G -->|Structured JSON| H[Candidate Feedback]
    H --> H1[Score 0-100%]
    H --> H2[Fit / No Fit]
    H --> H3[Matching / missing skills]
    H --> H4[Study suggestions]
    H --> H5[Salary estimate]
```

> **Engineering notes:** secrets live in **Google Secret Manager** (never baked into images); embeddings have a deterministic local *fallback* when no key is set; services **scale to zero** on Cloud Run (near-zero idle cost).

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 15 (App Router, standalone), React 19, Tailwind CSS v4, Zustand, React Hook Form, Lucide, Framer Motion |
| **Backend** | Hono.js, Bun, Prisma ORM, JWT (`hono/jwt`), `Bun.password` (hashing) |
| **Database** | PostgreSQL + `pgvector` (Neon serverless) |
| **AI / ML** | **Groq** — Llama 3.3 70B (analysis/match) · **Google** `gemini-embedding-001` (768d embeddings) |
| **Infra** | Google Cloud Run · Artifact Registry · Cloud Build · Secret Manager · Docker |

---

## 🚀 Getting Started (local)

### Prerequisites
[Bun](https://bun.sh/) (backend) · [Node.js 20+](https://nodejs.org/) (frontend) · [Docker](https://www.docker.com/) (local Postgres)

### 1. Start the local database (Postgres + pgvector)
```bash
cd infra && docker compose up -d
```

### 2. Backend
```bash
cd backend
cp .env.example .env          # fill in the keys (see below)
bun install
bun run db:migrate            # creates tables + vector extension
bun run db:seed               # seeds demo data
bun dev                       # http://localhost:3002
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                   # http://localhost:3000
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://user:pass@host:5432/db   # Postgres with pgvector
PORT=3002

# AI — Groq (https://console.groq.com/keys)
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile

# Embeddings — Google (https://aistudio.google.com/app/apikey)
GOOGLE_AI_API_KEY=
GOOGLE_EMBED_MODEL=gemini-embedding-001

# Auth — generate with: node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
JWT_SECRET=
BETTER_AUTH_SECRET=
```

> 💡 Without `GROQ_API_KEY` the LLM runs in **mock mode**; without `GOOGLE_AI_API_KEY` embeddings use the **deterministic local fallback**. The app works either way.

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3002
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📡 API (REST `/api/v1`)

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| `POST` | `/auth/register` | Sign up (candidate or company) | — |
| `POST` | `/auth/login` | Login (returns JWT) | — |
| `GET`  | `/auth/me` | Authenticated user | ✅ |
| `GET`  | `/jobs` | Job feed (+ match score when logged in) | optional |
| `POST` | `/jobs` | Create job | 🏢 |
| `GET`  | `/jobs/:id` | Job details | — |
| `PUT` / `DELETE` | `/jobs/:id` | Edit / delete job | 🏢 |
| `GET`  | `/jobs/company` | Logged-in company's jobs | 🏢 |
| `POST` | `/applications` | Apply (generates AI analysis) | 👤 |
| `GET`  | `/applications` | My applications | 👤 |
| `GET`  | `/applications/job/:jobId` | Applicants for a job | 🏢 |
| `PATCH`| `/applications/:id/status` | Update status | 🏢 |
| `GET` / `PUT` | `/candidates/me`, `/candidates/profile` | Candidate profile | 👤 |
| `GET` / `PUT` | `/companies/me`, `/companies/profile` | Company profile | 🏢 |
| `POST` | `/ai/search` | Semantic job search | — |
| `POST` | `/ai/analyze-resume` | AI resume feedback | — |
| `GET`  | `/ai/ranking` | Top 5 jobs for the candidate | 👤 |

---

## 🗂️ Project Structure

```
jobs-platform/
├── backend/
│   ├── src/
│   │   ├── routes/        # auth · jobs · candidates · companies · applications · ai
│   │   ├── lib/           # prisma · gemini (AI: Groq + Google embeddings) · authUtils
│   │   ├── middleware/    # auth (JWT)
│   │   ├── seed.ts        # demo data
│   │   └── index.ts       # Hono entry point
│   ├── prisma/            # schema + migrations
│   └── Dockerfile
├── frontend/
│   ├── src/app/           # App Router: (auth) (candidate) (company)
│   ├── src/lib/           # api client · authStore (Zustand)
│   ├── cloudbuild.yaml    # build with API URL baked in
│   └── Dockerfile
├── infra/                 # docker-compose (local Postgres)
└── docs/                  # PRD
```

---

## ☁️ Deployment (Google Cloud Run + Neon)

Summary of the production flow:

```bash
# 1. Project + APIs
gcloud projects create jobspark-prod-XXXX
gcloud services enable run cloudbuild artifactregistry secretmanager

# 2. Secrets
printf '%s' "$GROQ_KEY" | gcloud secrets create groq-api-key --data-file=-
# ...same for google-ai-api-key, jwt-secret, better-auth-secret, database-url

# 3. Migrations on Neon (DIRECT endpoint, no -pooler)
DATABASE_URL="$NEON_DIRECT" bunx prisma migrate deploy

# 4. Backend → Cloud Run
gcloud builds submit --tag <region>-docker.pkg.dev/<proj>/jobspark/backend backend/
gcloud run deploy jobspark-backend --image ... --set-secrets ...

# 5. Frontend → Cloud Run (build with the backend URL)
gcloud builds submit --config frontend/cloudbuild.yaml \
  --substitutions=_API_URL=<backend-url>,_IMAGE=...
gcloud run deploy jobspark-frontend --image ...
```

> Neon uses **direct** for migrations and **pooled + `pgbouncer=true`** at runtime. `NEXT_PUBLIC_API_URL` is baked at *build time*, so the frontend is built **after** the backend.

---

## 🔑 Demo

| Role | Email | Password |
|------|-------|----------|
| 🏢 Company | `empresa@demo.com` | `demo1234` |
| 👤 Candidate | `candidato@demo.com` | `demo1234` |

---

## 🗺️ Roadmap

- [x] Auth, job CRUD, applications
- [x] Skill-based match + AI application analysis
- [x] Semantic search and embedding ranking (pgvector)
- [x] Production deployment (Cloud Run + Neon)
- [ ] Real resume upload (Cloud Storage / R2)
- [ ] Candidate Kanban pipeline
- [ ] Real-time notifications (SSE/WebSocket)
- [ ] Automated tests (Vitest + Playwright)
- [ ] Subscription plans (Stripe)

---

## 👤 Author

**Idarlan Magalhães** — Developer focused on AI & Computer Vision
[GitHub](https://github.com/idarlandias) · [LinkedIn](https://www.linkedin.com/in/idarlandias/)

---

<div align="center">
<sub>Built with ⚡ Next.js, Hono, Bun and AI (Groq + Google).</sub>
</div>
