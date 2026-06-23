'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/authStore'
import { Briefcase, MapPin, DollarSign, ListChecks, Heart, Loader2, ArrowLeft } from 'lucide-react'

const jobSchema = z.object({
  title: z.string().min(5, 'O título deve conter pelo menos 5 caracteres.'),
  description: z.string().min(20, 'Forneça uma descrição detalhada de no mínimo 20 caracteres.'),
  workplaceType: z.enum(['ONSITE', 'REMOTE', 'HYBRID']),
  workType: z.enum(['FULL_TIME', 'PART_TIME', 'FREELANCE', 'INTERNSHIP']),
  location: z.string().min(3, 'A localização/cidade é obrigatória.'),
  salaryMin: z.preprocess((val) => Number(val), z.number().positive('O salário mínimo deve ser maior que zero.')),
  salaryMax: z.preprocess((val) => Number(val), z.number().positive('O salário máximo deve ser maior que zero.')),
  skillsString: z.string().min(3, 'Insira pelo menos 2 competências separadas por vírgula.'),
  requirementsString: z.string().optional(),
  benefitsString: z.string().optional(),
}).refine((data) => data.salaryMin <= data.salaryMax, {
  message: 'O salário mínimo não pode ser maior que o salário máximo.',
  path: ['salaryMax'],
})

type JobInput = z.infer<typeof jobSchema>

export default function NewJobPage() {
  const router = useRouter()
  const { user, loadUser } = useAuthStore()
  const [localLoading, setLocalLoading] = React.useState(true)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<JobInput>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      description: '',
      workplaceType: 'HYBRID',
      workType: 'FULL_TIME',
      location: '',
      salaryMin: undefined,
      salaryMax: undefined,
      skillsString: '',
      requirementsString: '',
      benefitsString: '',
    },
  })

  React.useEffect(() => {
    const init = async () => {
      try {
        await loadUser()
      } catch (err) {
        console.error('Error loading user:', err)
      } finally {
        setLocalLoading(false)
      }
    }
    init()
  }, [])

  if (localLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  // Basic role check
  if (!user || user.role !== 'COMPANY') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-400">
        Acesso não autorizado.
      </div>
    )
  }

  const onSubmit = async (data: JobInput) => {
    try {
      const skills = data.skillsString.split(',').map(s => s.trim()).filter(s => s.length > 0)
      const requirements = data.requirementsString ? data.requirementsString.split('\n').map(r => r.trim()).filter(r => r.length > 0) : []
      const benefits = data.benefitsString ? data.benefitsString.split('\n').map(b => b.trim()).filter(b => b.length > 0) : []

      const token = localStorage.getItem('jobspark_token')
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      await api.post('/api/v1/jobs', {
        title: data.title,
        description: data.description,
        workplaceType: data.workplaceType,
        workType: data.workType,
        location: data.location,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        skills,
        requirements,
        benefits,
      }, { headers })

      router.push('/empresa/vagas')
    } catch (err: any) {
      alert(err.message || 'Erro ao publicar vaga.')
    }
  }

  return (
    <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
      {/* Back button */}
      <button
        onClick={() => router.push('/empresa/vagas')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Painel
      </button>

      <div className="p-8 rounded-3xl glass-card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 accent-glow-gradient" />

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Publicar Nova Vaga</h1>
          <p className="text-sm text-slate-400 mt-2">
            Preencha os dados e contrate o talento perfeito com o match de IA.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Título do Cargo
            </label>
            <input
              {...register('title')}
              placeholder="Ex: Desenvolvedor React Frontend Senior"
              className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
            />
            {errors.title && (
              <span className="text-[10px] font-bold text-rose-400">{errors.title.message}</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Workplace Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Modelo de Trabalho
              </label>
              <select
                {...register('workplaceType')}
                className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
              >
                <option value="HYBRID">Híbrido</option>
                <option value="REMOTE">Remoto</option>
                <option value="ONSITE">Presencial</option>
              </select>
            </div>

            {/* Work Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Contrato / Regime
              </label>
              <select
                {...register('workType')}
                className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
              >
                <option value="FULL_TIME">Tempo Integral (CLT/PJ)</option>
                <option value="PART_TIME">Meio Período</option>
                <option value="FREELANCE">Freelancer</option>
                <option value="INTERNSHIP">Estágio</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Location */}
            <div className="space-y-2 md:col-span-1">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Localização / Cidade
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <MapPin className="h-4 w-4" />
                </div>
                <input
                  {...register('location')}
                  placeholder="Ex: São Paulo, SP"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                />
              </div>
              {errors.location && (
                <span className="text-[10px] font-bold text-rose-400">{errors.location.message}</span>
              )}
            </div>

            {/* Salary Min */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Salário Mínimo (Transparência)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <DollarSign className="h-4 w-4" />
                </div>
                <input
                  {...register('salaryMin')}
                  type="number"
                  placeholder="Ex: 8000"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                />
              </div>
              {errors.salaryMin && (
                <span className="text-[10px] font-bold text-rose-400">{errors.salaryMin.message}</span>
              )}
            </div>

            {/* Salary Max */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Salário Máximo (Transparência)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <DollarSign className="h-4 w-4" />
                </div>
                <input
                  {...register('salaryMax')}
                  type="number"
                  placeholder="Ex: 12000"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                />
              </div>
              {errors.salaryMax && (
                <span className="text-[10px] font-bold text-rose-400">{errors.salaryMax.message}</span>
              )}
            </div>
          </div>

          {/* Skills Required */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Competências Requeridas (Skills)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <ListChecks className="h-4 w-4" />
              </div>
              <input
                {...register('skillsString')}
                placeholder="Insira as tags separadas por vírgula. Ex: React, TypeScript, Node.js, Next.js"
                className="w-full pl-9 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
              />
            </div>
            {errors.skillsString && (
              <span className="text-[10px] font-bold text-rose-400">{errors.skillsString.message}</span>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Descrição da Vaga
            </label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Descreva as responsabilidades, o dia a dia da função e informações sobre a cultura da empresa..."
              className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
            />
            {errors.description && (
              <span className="text-[10px] font-bold text-rose-400">{errors.description.message}</span>
            )}
          </div>

          {/* Requirements (Optional) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Requisitos & Qualificações (Um por linha)
            </label>
            <textarea
              {...register('requirementsString')}
              rows={3}
              placeholder="Ex: Experiência prévia com desenvolvimento Next.js&#10;Ex: Conhecimento sólido em APIs RESTful"
              className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Benefícios Oferecidos (Um por linha)
            </label>
            <textarea
              {...register('benefitsString')}
              rows={3}
              placeholder="Ex: Vale Refeição flexível&#10;Ex: Plano de Saúde Bradesco nacional"
              className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 font-semibold text-white rounded-xl accent-glow-gradient hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Publicar Vaga no Feed'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
