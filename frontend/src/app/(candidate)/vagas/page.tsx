'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'
import { api } from '@/lib/api'
import { MapPin, Briefcase, Sparkles, Loader2, Lock, Search, X } from 'lucide-react'

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
    name: string
    logoUrl: string | null
    sector: string | null
  }
}

export default function CandidateJobsFeed() {
  const router = useRouter()
  const { user, loadUser } = useAuthStore()
  const [jobs, setJobs] = useState<Job[]>([])
  const [results, setResults] = useState<Job[] | null>(null) // null = modo feed; array = busca semântica
  const [query, setQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true)
        await loadUser()
        const token = localStorage.getItem('jobspark_token')
        if (token) {
          const headers = { Authorization: `Bearer ${token}` }
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) {
      setResults(null)
      setActiveQuery('')
      return
    }
    setIsSearching(true)
    try {
      const data = await api.post<{ results: Job[] }>('/api/v1/ai/search', { query: q })
      setResults(data.results || [])
      setActiveQuery(q)
    } catch (err: any) {
      alert('Erro na busca: ' + err.message)
    } finally {
      setIsSearching(false)
    }
  }

  const clearSearch = () => {
    setQuery('')
    setActiveQuery('')
    setResults(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

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

  const list = results !== null ? results : jobs
  const isSearchMode = results !== null

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Feed Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Seu Feed de Vagas
        </h1>
        <p className="text-sm text-slate-400">
          Busque por <strong className="text-purple-300">linguagem natural</strong> — descreva o que você quer e a IA encontra por significado.
        </p>
      </div>

      {/* Busca semântica (linguagem natural) */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-3 relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          placeholder='Ex: "quero trabalhar com IA e Python em startup remota"'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-11 pr-32 py-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all shadow-xl"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="absolute inset-y-1.5 right-1.5 px-4 font-semibold text-white text-sm rounded-xl accent-glow-gradient flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
        >
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Buscar
        </button>
      </form>

      {/* Banner do modo de busca */}
      {isSearchMode && (
        <div className="max-w-2xl mx-auto mb-8 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200">
          <span>
            Busca semântica por: <strong className="text-white">&ldquo;{activeQuery}&rdquo;</strong> — {list.length} resultado(s), ordenados por afinidade.
          </span>
          <button onClick={clearSearch} className="flex items-center gap-1 font-semibold hover:text-white cursor-pointer">
            <X className="h-3.5 w-3.5" /> Ver todas
          </button>
        </div>
      )}
      {!isSearchMode && <div className="mb-8" />}

      {list.length === 0 ? (
        <div className="text-center p-12 max-w-md mx-auto">
          <Briefcase className="h-10 w-10 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Nenhuma vaga encontrada</h3>
          <p className="text-sm text-slate-500">
            {isSearchMode ? 'Tente descrever de outra forma o que você procura.' : 'Volte mais tarde para novas publicações.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {list.map((job) => {
            const score = job.matchScore ?? 0
            let scoreBg = 'bg-slate-900 border-slate-800 text-slate-400'
            if (score >= 80) {
              scoreBg = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/5 shadow-md'
            } else if (score >= 50) {
              scoreBg = 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }

            return (
              <div key={job.id} className="p-6 rounded-3xl glass-card glass-card-hover flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-4 gap-2">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 block mb-1">{job.company?.name}</span>
                      <h2 className="text-lg font-bold text-white leading-snug">{job.title}</h2>
                    </div>
                    <div className={`px-3 py-1.5 rounded-2xl border text-xs font-extrabold flex items-center gap-1 ${scoreBg}`}>
                      <Sparkles className="h-3 w-3" />
                      <span>{score}% {isSearchMode ? 'afinidade' : 'Match'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-x-4 gap-y-2 text-xs text-slate-400 flex-wrap mb-6">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      <span>{job.location || 'Remoto'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                      <span className="capitalize">
                        {(job.workplaceType || '').toLowerCase()} • {(job.workType || '').replace('_', ' ').toLowerCase()}
                      </span>
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
