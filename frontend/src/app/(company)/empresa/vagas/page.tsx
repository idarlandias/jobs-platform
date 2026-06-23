'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'
import { api } from '@/lib/api'
import { Plus, Eye, Users, MapPin, Calendar, DollarSign, Briefcase, Loader2, Lock } from 'lucide-react'

interface CompanyJob {
  id: string
  title: string
  workplaceType: 'ONSITE' | 'REMOTE' | 'HYBRID'
  workType: 'FULL_TIME' | 'PART_TIME' | 'FREELANCE' | 'INTERNSHIP'
  location: string | null
  salaryMin: number | null
  salaryMax: number | null
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED'
  viewCount: number
  createdAt: string
  _count: {
    applications: number
  }
}

export default function CompanyJobsDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, loadUser } = useAuthStore()
  const [jobs, setJobs] = useState<CompanyJob[]>([])
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
          const data = await api.get<{ jobs: CompanyJob[] }>('/api/v1/jobs/company', { headers })
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
  if (!user || user.role !== 'COMPANY') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 relative z-10">
        <div className="max-w-md w-full p-8 rounded-3xl glass-card text-center">
          <Lock className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Acesso Negado</h2>
          <p className="text-sm text-slate-400 mb-6">
            Esta área é exclusiva para perfis de empresas e recrutadores autorizados.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 px-4 font-semibold text-white rounded-xl accent-glow-gradient"
          >
            Fazer Login como Empresa
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 pb-6 border-b border-slate-900">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Gerenciar Vagas
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Acompanhe o engajamento e gerencie os candidatos das suas vagas ativas
          </p>
        </div>
        <button
          onClick={() => router.push('/empresa/vagas/nova')}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white rounded-xl accent-glow-gradient hover:shadow-lg hover:shadow-purple-500/20 transition-all transform hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          Criar Nova Vaga
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center p-12 rounded-3xl border border-slate-800 bg-slate-950/20 max-w-2xl mx-auto">
          <Briefcase className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Nenhuma vaga publicada</h3>
          <p className="text-sm text-slate-400 mb-6">
            Publique sua primeira oportunidade de emprego com faixa salarial transparente e receba candidatos qualificados por IA.
          </p>
          <button
            onClick={() => router.push('/empresa/vagas/nova')}
            className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg accent-glow-gradient"
          >
            Criar Vaga
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="p-6 sm:p-8 rounded-3xl glass-card border-slate-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold text-white hover:text-purple-400 cursor-pointer transition-colors">
                    {job.title}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                    job.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-slate-500/10 border border-slate-500/20 text-slate-400'
                  }`}>
                    {job.status === 'ACTIVE' ? 'Ativa' : 'Rascunho'}
                  </span>
                </div>

                <div className="flex items-center gap-x-6 gap-y-2 text-xs text-slate-400 flex-wrap mb-6">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    <span>{job.location || 'Remoto'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                    <span className="capitalize">{job.workplaceType.toLowerCase()} • {job.workType.replace('_', ' ').toLowerCase()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-slate-500" />
                    <span>
                      R$ {job.salaryMin?.toLocaleString('pt-BR')} - R$ {job.salaryMax?.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <span>Publicada em {new Date(job.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              {/* Stats Counters */}
              <div className="flex items-center gap-6 border-t md:border-t-0 border-slate-900 w-full md:w-auto pt-4 md:pt-0">
                <div className="text-center px-4">
                  <div className="flex items-center justify-center gap-1 text-slate-300 mb-1">
                    <Eye className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-bold">{job.viewCount}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Visualizações</span>
                </div>

                <div className="text-center px-4">
                  <div className="flex items-center justify-center gap-1 text-slate-300 mb-1">
                    <Users className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm font-bold">{job._count.applications}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Candidatos</span>
                </div>

                <div className="ml-auto">
                  <button
                    onClick={() => router.push(`/empresa/vagas/${job.id}/candidatos`)}
                    className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Ver Candidatos
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
