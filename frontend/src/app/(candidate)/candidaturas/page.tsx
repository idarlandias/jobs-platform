'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'
import { api } from '@/lib/api'
import { Briefcase, MapPin, DollarSign, Sparkles, Loader2, Lock, CheckCircle2, ChevronDown, ChevronUp, XCircle, Trophy, BookOpen, AlertCircle, Award, Trash2 } from 'lucide-react'

interface Application {
  id: string
  status: 'APPLIED' | 'SCREENING' | 'VIEWED' | 'SHORTLISTED' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED'
  matchScore: number | null
  feedback: string | null
  createdAt: string
  job: {
    id: string
    title: string
    workplaceType: string
    workType: string
    location: string | null
    salaryMin: number | null
    salaryMax: number | null
    company: {
      name: string
      logoUrl: string | null
    }
  }
}

interface RankingJob {
  id: string
  title: string
  location: string | null
  workplaceType: string
  workType: string
  matchScore: number
  company: {
    name: string
    logoUrl: string | null
    sector: string | null
  }
}

const PIPELINE_STAGES: { status: Application['status']; label: string }[] = [
  { status: 'APPLIED', label: 'Enviada' },
  { status: 'SCREENING', label: 'Triagem' },
  { status: 'VIEWED', label: 'Visualizada' },
  { status: 'SHORTLISTED', label: 'Selecionada' },
  { status: 'INTERVIEW', label: 'Entrevista' },
  { status: 'OFFER', label: 'Proposta' },
  { status: 'HIRED', label: 'Contratado' },
]

export default function CandidateApplicationsPage() {
  const router = useRouter()
  const { user, isAuthenticated, loadUser } = useAuthStore()
  const [applications, setApplications] = useState<Application[]>([])
  const [ranking, setRanking] = useState<RankingJob[]>([])
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
          // Fetch applications
          const data = await api.get<{ applications: Application[] }>('/api/v1/applications', { headers })
          setApplications(data.applications)

          // Fetch top 5 ranking
          try {
            const rankingData = await api.get<{ ranking: RankingJob[] }>('/api/v1/ai/ranking', { headers })
            setRanking(rankingData.ranking)
          } catch (rankErr) {
            console.error('Failed to fetch ranking:', rankErr)
          }
        }
      } catch (err) {
        console.error('Error during init:', err)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  const [cancelingId, setCancelingId] = useState<string | null>(null)

  const cancelApplication = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta candidatura? Esta ação não pode ser desfeita.')) return
    setCancelingId(id)
    try {
      const token = localStorage.getItem('jobspark_token')
      await api.delete(`/api/v1/applications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setApplications((prev) => prev.filter((a) => a.id !== id))
    } catch (err: any) {
      alert('Erro ao cancelar candidatura: ' + err.message)
    } finally {
      setCancelingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  // Route protection
  if (!user || user.role !== 'CANDIDATE') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 relative z-10">
        <div className="max-w-md w-full p-8 rounded-3xl glass-card text-center">
          <Lock className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Acesso Restrito</h2>
          <p className="text-sm text-slate-400 mb-6">
            Esta área é exclusiva para candidatos acompanharem o status de suas inscrições.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 px-4 font-semibold text-white rounded-xl accent-glow-gradient"
          >
            Entrar como Candidato
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10 pb-6 border-b border-slate-900">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Minhas Candidaturas</h1>
        <p className="text-sm text-slate-400 mt-1">
          Acompanhe em tempo real as etapas dos seus processos seletivos de forma transparente com análise de IA.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Applications List */}
        <div className="lg:col-span-3 space-y-6">
          {applications.length === 0 ? (
            <div className="text-center p-12 rounded-3xl border border-slate-800 bg-slate-950/20 max-w-2xl mx-auto">
              <Briefcase className="h-12 w-12 text-slate-655 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Nenhuma candidatura enviada</h3>
              <p className="text-sm text-slate-400 mb-6">
                Você ainda não se inscreveu em nenhuma vaga. Encontre a oportunidade ideal em nosso feed.
              </p>
              <button
                onClick={() => router.push('/vagas')}
                className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg accent-glow-gradient cursor-pointer"
              >
                Ver Vagas Disponíveis
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {applications.map((app) => {
                const isRejected = app.status === 'REJECTED'
                const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.status === app.status)
                const isExpanded = expandedAppId === app.id

                // Parse AI feedback if available
                let aiFeedback: {
                  matchScore: number
                  classification: string
                  compatibleSkills: string[]
                  missingSkills: string[]
                  developmentSuggestions: string
                  salaryEstimation: string
                } | null = null

                if (app.feedback) {
                  try {
                    aiFeedback = JSON.parse(app.feedback)
                  } catch (e) {
                    console.error('Failed to parse app feedback:', e)
                  }
                }

                return (
                  <div
                    key={app.id}
                    className="p-6 sm:p-8 rounded-3xl glass-card border-slate-800/80 flex flex-col gap-6"
                  >
                    {/* Header detail */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-semibold text-purple-400 block mb-1">
                          {app.job.company.name}
                        </span>
                        <h2
                          onClick={() => router.push(`/vagas/${app.job.id}`)}
                          className="text-xl font-bold text-white hover:text-purple-300 cursor-pointer transition-colors leading-tight"
                        >
                          {app.job.title}
                        </h2>
                        
                        <div className="flex items-center gap-x-4 gap-y-1 text-xs text-slate-500 flex-wrap mt-2">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{app.job.location || 'Remoto'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            <span>R$ {app.job.salaryMin?.toLocaleString('pt-BR')} - R$ {app.job.salaryMax?.toLocaleString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 sm:self-start">
                        {/* Match Score */}
                        {app.matchScore !== null && (
                          <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-300 flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>{app.matchScore}% Fit</span>
                          </div>
                        )}

                        {/* Expand AI feedback toggle */}
                        {aiFeedback && (
                          <button
                            onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                          >
                            <span>Detalhes IA</span>
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        )}

                        {/* Cancelar candidatura */}
                        <button
                          onClick={() => cancelApplication(app.id)}
                          disabled={cancelingId === app.id}
                          title="Cancelar candidatura"
                          className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 hover:text-rose-300 hover:border-rose-500/30 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          {cancelingId === app.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          <span className="hidden sm:inline">Cancelar</span>
                        </button>
                      </div>
                    </div>

                    {/* Detailed AI Feedback Panel (Expanded) */}
                    {isExpanded && aiFeedback && (
                      <div className="p-5 rounded-2xl border border-purple-500/10 bg-purple-950/5 space-y-5 animate-fadeIn">
                        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-900">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-400" />
                            <h3 className="text-sm font-bold text-white">Análise do JobMatch AI</h3>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase border ${
                            aiFeedback.classification === 'Fit' 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          }`}>
                            Classificação: {aiFeedback.classification}
                          </span>
                        </div>

                        {/* Compatible vs Missing Skills */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                              <Award className="h-4 w-4" />
                              <span>Habilidades Compatíveis</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {aiFeedback.compatibleSkills.map((s, idx) => (
                                <span key={idx} className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-300">
                                  {s}
                                </span>
                              ))}
                              {aiFeedback.compatibleSkills.length === 0 && (
                                <span className="text-xs text-slate-500 italic">Nenhuma mapeada.</span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                              <AlertCircle className="h-4 w-4" />
                              <span>Habilidades Faltantes</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {aiFeedback.missingSkills.map((s, idx) => (
                                <span key={idx} className="px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] font-semibold text-rose-300">
                                  {s}
                                </span>
                              ))}
                              {aiFeedback.missingSkills.length === 0 && (
                                <span className="text-xs text-emerald-500 italic">Você tem todas as habilidades principais exigidas!</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Development suggestions */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400">
                            <BookOpen className="h-4 w-4" />
                            <span>Sugestão de Desenvolvimento</span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                            {aiFeedback.developmentSuggestions}
                          </p>
                        </div>

                        {/* Salary estimation */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                            <DollarSign className="h-4 w-4" />
                            <span>Estimativa de Faixa Salarial para a Vaga</span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {aiFeedback.salaryEstimation}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Horizontal Progress Timeline */}
                    <div className="border-t border-slate-900/60 pt-6">
                      {isRejected ? (
                        <div className="flex items-center gap-2 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-xs font-bold text-rose-400 max-w-max animate-fadeIn">
                          <XCircle className="h-5 w-5 flex-shrink-0" />
                          <span>Processo Encerrado: A empresa optou por não seguir com o seu perfil neste momento.</span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Timeline flow */}
                          <div className="relative flex items-center justify-between w-full">
                            {/* Connecting Line */}
                            <div className="absolute left-0 right-0 top-[14px] h-[3px] bg-slate-900 -z-10" />
                            <div
                              className="absolute left-0 top-[14px] h-[3px] accent-glow-gradient -z-10 transition-all duration-500"
                              style={{
                                width: `${(currentStageIndex / (PIPELINE_STAGES.length - 1)) * 100}%`,
                              }}
                            />

                            {PIPELINE_STAGES.map((stage, idx) => {
                              const isCompleted = idx <= currentStageIndex
                              const isActive = idx === currentStageIndex

                              let dotClass = 'bg-slate-950 border-slate-800 text-slate-500'
                              if (isActive) {
                                dotClass = 'bg-purple-500 border-purple-400 text-white shadow-lg shadow-purple-500/30'
                              } else if (isCompleted) {
                                dotClass = 'bg-slate-950 border-purple-500 text-purple-400'
                              }

                              return (
                                <div key={idx} className="flex flex-col items-center text-center flex-1 relative">
                                  {/* Timeline Dot */}
                                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-extrabold z-10 transition-all ${dotClass}`}>
                                    {isCompleted && !isActive ? '✓' : idx + 1}
                                  </div>
                                  {/* Label text */}
                                  <span className={`text-[10px] font-bold mt-2 hidden sm:block ${
                                    isActive ? 'text-white' : isCompleted ? 'text-purple-400' : 'text-slate-500'
                                  }`}>
                                    {stage.label}
                                  </span>
                                </div>
                              )
                            })}
                          </div>

                          {/* Small active description */}
                          <p className="text-xs text-slate-400 pt-2 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-purple-400" />
                            <span>
                              Fase atual do processo:{' '}
                              <strong className="text-white font-semibold">
                                {PIPELINE_STAGES[currentStageIndex]?.label}
                              </strong>.
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sidebar - Top 5 Job Matches (Ranking) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-3xl glass-card border-purple-500/10 space-y-4 sticky top-6">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
              <Trophy className="h-5 w-5 text-purple-400 animate-float" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Top 5 Recomendações</h2>
            </div>
            
            <p className="text-[10px] text-slate-400 leading-relaxed">
              O JobMatch AI calcula o ranking das vagas ativas que mais combinam com o seu perfil e competências cadastradas.
            </p>

            <div className="space-y-4 pt-2">
              {ranking.map((rankJob, idx) => (
                <div
                  key={rankJob.id}
                  onClick={() => router.push(`/vagas/${rankJob.id}`)}
                  className="p-4 rounded-2xl bg-slate-950/40 border border-slate-900/80 hover:border-purple-500/20 cursor-pointer hover:bg-slate-900/20 transition-all flex items-start justify-between gap-2 group"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-purple-400">#{idx + 1} Vaga</span>
                    <h3 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                      {rankJob.title}
                    </h3>
                    <p className="text-[9px] text-slate-500">
                      {rankJob.company.name}
                    </p>
                  </div>

                  <span className="flex-shrink-0 text-[10px] font-extrabold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">
                    {rankJob.matchScore}%
                  </span>
                </div>
              ))}

              {ranking.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-500 italic">
                  Complete seu perfil para gerar o ranking de compatibilidade.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
