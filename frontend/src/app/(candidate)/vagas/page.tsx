'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'
import { api } from '@/lib/api'
import { MapPin, DollarSign, Briefcase, Sparkles, Loader2, Lock, Search } from 'lucide-react'

interface Job {
  id: string
  title: string
  workplaceType: 'ONSITE' | 'REMOTE' | 'HYBRID'
  workType: 'FULL_TIME' | 'PART_TIME' | 'FREELANCE' | 'INTERNSHIP'
  location: string | null
  salaryMin: number | null
  salaryMax: number | null
  matchScore?: number
  company: {
    name: true
    logoUrl: string | null
    sector: string | null
  }
}

export default function CandidateJobsFeed() {
  const router = useRouter()
  const { user, isAuthenticated, loadUser } = useAuthStore()
  const [jobs, setJobs] = useState<Job[]>([])
  const [searchQuery, setSearchQuery] = useState('')
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
          const data = await api.get<{ jobs: Job[] }>('/api/v1/jobs', { headers })
          setJobs(data.jobs)
        }
      } catch (err) {
        console.error('Error during init:', err)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

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
            Esta área é exclusiva para candidatos buscarem vagas e gerenciarem candidaturas.
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

  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (job.company as any).name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Feed Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Seu Feed de Vagas
        </h1>
        <p className="text-sm text-slate-400">
          Encontre oportunidades compatíveis e veja seu fit com a vaga em tempo real.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="max-w-xl mx-auto mb-10 relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          placeholder="Pesquisar por cargo ou empresa..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all shadow-xl"
        />
      </div>

      {filteredJobs.length === 0 ? (
        <div className="text-center p-12 max-w-md mx-auto">
          <Briefcase className="h-10 w-10 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Nenhuma vaga encontrada</h3>
          <p className="text-sm text-slate-500">
            Tente buscar outros termos ou volte mais tarde para novas publicações.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map((job) => {
            const score = job.matchScore ?? 0
            let scoreBg = 'bg-slate-900 border-slate-800 text-slate-400'
            if (score >= 80) {
              scoreBg = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/5 shadow-md'
            } else if (score >= 50) {
              scoreBg = 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }

            return (
              <div
                key={job.id}
                className="p-6 rounded-3xl glass-card glass-card-hover flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4 gap-2">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 block mb-1">
                        {(job.company as any).name}
                      </span>
                      <h2 className="text-lg font-bold text-white leading-snug">
                        {job.title}
                      </h2>
                    </div>

                    {/* Match Score Indicator */}
                    <div className={`px-3 py-1.5 rounded-2xl border text-xs font-extrabold flex items-center gap-1 ${scoreBg}`}>
                      <Sparkles className="h-3 w-3" />
                      <span>{score}% Match</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-x-4 gap-y-2 text-xs text-slate-400 flex-wrap mb-6">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      <span>{job.location || 'Remoto'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                      <span className="capitalize">{job.workplaceType.toLowerCase()} • {job.workType.replace('_', ' ').toLowerCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-900/60 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Faixa Salarial</span>
                    <span className="text-xs font-bold text-slate-300">
                      R$ {job.salaryMin?.toLocaleString('pt-BR')} - R$ {job.salaryMax?.toLocaleString('pt-BR')}
                    </span>
                  </div>

                  <button
                    onClick={() => router.push(`/vagas/${job.id}`)}
                    className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Ver Vaga
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
