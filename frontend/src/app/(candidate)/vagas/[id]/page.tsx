'use client'

import React, { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'
import { api } from '@/lib/api'
import { MapPin, DollarSign, Briefcase, Sparkles, Loader2, ArrowLeft, Send, CheckCircle2, ShieldCheck } from 'lucide-react'

interface JobDetails {
  id: string
  title: string
  description: string
  requirements: string[]
  skills: string[]
  benefits: string[]
  workplaceType: 'ONSITE' | 'REMOTE' | 'HYBRID'
  workType: 'FULL_TIME' | 'PART_TIME' | 'FREELANCE' | 'INTERNSHIP'
  location: string | null
  salaryMin: number | null
  salaryMax: number | null
  createdAt: string
  company: {
    id: string
    name: string
    logoUrl: string | null
    description: string | null
    sector: string | null
  }
}

interface Application {
  id: string
  jobId: string
  status: string
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function JobDetailsPage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const jobId = resolvedParams.id
  
  const { user, isAuthenticated, loadUser } = useAuthStore()
  
  const [job, setJob] = useState<JobDetails | null>(null)
  const [hasApplied, setHasApplied] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true)
        await loadUser()
        
        const token = localStorage.getItem('jobspark_token')
        if (token) {
          const headers: Record<string, string> = {
            'Authorization': `Bearer ${token}`
          }

          // 1. Fetch Job detail
          const jobData = await api.get<{ job: JobDetails }>(`/api/v1/jobs/${jobId}`, { headers })
          setJob(jobData.job)

          // 2. Fetch Candidate applications to check if already applied
          const appsData = await api.get<{ applications: Application[] }>('/api/v1/applications', { headers })
          const applied = appsData.applications.some((app) => app.jobId === jobId)
          setHasApplied(applied)
        }
      } catch (err) {
        console.error('Error during init:', err)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [jobId])

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (hasApplied || isSubmitting) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('jobspark_token')
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      await api.post('/api/v1/applications', {
        jobId,
        coverLetter: coverLetter.trim() || undefined,
      }, { headers })

      setHasApplied(true)
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar candidatura.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (!user || user.role !== 'CANDIDATE' || !job) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-400">
        Não autorizado ou vaga não encontrada.
      </div>
    )
  }

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back button */}
      <button
        onClick={() => router.push('/vagas')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Vagas
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Job Core Title */}
          <div className="p-8 rounded-3xl glass-card">
            <span className="text-xs font-semibold text-purple-400 block mb-2">{job.company.name}</span>
            <h1 className="text-3xl font-extrabold text-white mb-4 leading-tight">{job.title}</h1>
            
            <div className="flex items-center gap-x-6 gap-y-2 text-xs text-slate-400 flex-wrap">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-slate-500" />
                <span>{job.location || 'Remoto'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Briefcase className="h-4 w-4 text-slate-500" />
                <span className="capitalize">{job.workplaceType.toLowerCase()} • {job.workType.replace('_', ' ').toLowerCase()}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-slate-500" />
                <span>R$ {job.salaryMin?.toLocaleString('pt-BR')} - R$ {job.salaryMax?.toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="p-8 rounded-3xl glass-card space-y-4">
            <h2 className="text-xl font-bold text-white">Descrição da Vaga</h2>
            <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>

          {/* Requirements & Benefits */}
          {(job.requirements.length > 0 || job.benefits.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {job.requirements.length > 0 && (
                <div className="p-8 rounded-3xl glass-card space-y-4">
                  <h2 className="text-lg font-bold text-white">Requisitos</h2>
                  <ul className="space-y-2.5 text-sm text-slate-400">
                    {job.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {job.benefits.length > 0 && (
                <div className="p-8 rounded-3xl glass-card space-y-4">
                  <h2 className="text-lg font-bold text-white">Benefícios</h2>
                  <ul className="space-y-2.5 text-sm text-slate-400">
                    {job.benefits.map((ben, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-cyan-500 mt-1">•</span>
                        <span>{ben}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action / Sidebar column */}
        <div className="space-y-6">
          {/* Quick Apply Card */}
          <div className="p-8 rounded-3xl glass-card relative overflow-hidden border-purple-500/20">
            <h3 className="text-lg font-bold text-white mb-4">Candidatura em 1-Clique</h3>
            
            {hasApplied ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-white text-sm">Candidatura Confirmada!</h4>
                <p className="text-xs text-slate-400">
                  Sua inscrição foi enviada à empresa. Acompanhe o status no portal.
                </p>
                <button
                  onClick={() => router.push('/candidaturas')}
                  className="w-full mt-4 py-2.5 text-xs font-bold text-white bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Minhas Candidaturas
                </button>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Carta de Apresentação (Opcional)
                  </label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={3}
                    placeholder="Escreva uma mensagem rápida de introdução explicando por que você é o match ideal para esta vaga..."
                    className="w-full px-3 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 font-semibold text-white rounded-xl accent-glow-gradient hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Enviar Candidatura
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 pt-2">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Seus dados de contato estão protegidos.</span>
                </div>
              </form>
            )}
          </div>

          {/* Required Skills list */}
          <div className="p-8 rounded-3xl glass-card space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Competências Avaliadas</h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Company details sidebar */}
          <div className="p-8 rounded-3xl glass-card space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Sobre a Empresa</h3>
            <div className="space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Setor de Atuação</span>
                <span className="text-xs text-slate-300">{job.company.sector || 'Tecnologia / Software'}</span>
              </div>
              {job.company.description && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Quem somos</span>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">{job.company.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
