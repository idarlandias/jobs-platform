'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'
import { api } from '@/lib/api'
import { User, Mail, Link as LinkIcon, FileText, Sparkles, Loader2, Lock, ArrowLeft, Save, Briefcase, MapPin } from 'lucide-react'

export default function CandidateProfilePage() {
  const router = useRouter()
  const { user, loadUser } = useAuthStore()

  // Candidate states
  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [skillsString, setSkillsString] = useState('')
  const [experienceYears, setExperienceYears] = useState(0)
  const [salaryExpected, setSalaryExpected] = useState(0)
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true)
        await loadUser()

        const token = localStorage.getItem('jobspark_token')
        if (token) {
          const headers = { 'Authorization': `Bearer ${token}` }
          const data = await api.get<{
            candidate: {
              headline: string | null
              bio: string | null
              skills: string[]
              experienceYears: number
              salaryExpected: number | null
              city: string | null
              state: string | null
              linkedinUrl: string | null
              githubUrl: string | null
              portfolioUrl: string | null
              resumeUrl: string | null
            }
          }>('/api/v1/candidates/me', { headers })

          if (data.candidate) {
            setHeadline(data.candidate.headline || '')
            setBio(data.candidate.bio || '')
            setSkillsString(data.candidate.skills ? data.candidate.skills.join(', ') : '')
            setExperienceYears(data.candidate.experienceYears || 0)
            setSalaryExpected(data.candidate.salaryExpected || 0)
            setCity(data.candidate.city || '')
            setState(data.candidate.state || '')
            setLinkedinUrl(data.candidate.linkedinUrl || '')
            setGithubUrl(data.candidate.githubUrl || '')
            setPortfolioUrl(data.candidate.portfolioUrl || '')
            setResumeUrl(data.candidate.resumeUrl || '')
          }
        }
      } catch (err: any) {
        console.error('Error loading candidate profile:', err)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage(null)

    try {
      const token = localStorage.getItem('jobspark_token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const response = await api.put<{ message: string }>('/api/v1/candidates/profile', {
        headline: headline.trim(),
        bio: bio.trim(),
        skills: skillsString.split(',').map(s => s.trim()).filter(s => s.length > 0),
        experienceYears: Number(experienceYears),
        salaryExpected: salaryExpected ? Number(salaryExpected) : null,
        city: city.trim(),
        state: state.trim(),
        linkedinUrl: linkedinUrl.trim(),
        githubUrl: githubUrl.trim(),
        portfolioUrl: portfolioUrl.trim(),
        resumeUrl: resumeUrl.trim()
      }, { headers })

      setMessage({ type: 'success', text: response.message || 'Perfil atualizado com sucesso!' })
      
      // Clear message after 4 seconds
      setTimeout(() => setMessage(null), 4000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao salvar informações de perfil.' })
    } finally {
      setIsSaving(false)
    }
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
            Você precisa estar logado como candidato para editar o seu perfil profissional.
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
    <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
      {/* Back to feed */}
      <button
        onClick={() => router.push('/vagas')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Ver Vagas no Feed
      </button>

      <div className="p-8 rounded-3xl glass-card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 accent-glow-gradient" />

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Meu Perfil Profissional</h1>
          <p className="text-sm text-slate-400 mt-2">
            Complete seus dados e competências para que a IA do JobSpark calcule o match perfeito para você.
          </p>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border text-xs font-bold ${
            message.type === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/20 bg-rose-500/10 text-rose-400'
          }`}>
            {message.type === 'success' ? '✅' : '⚠️'} {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Readonly identity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 mb-6">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Nome Completo</span>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                <User className="h-4 w-4 text-purple-400" />
                <span>{user.name}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">E-mail da Conta</span>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                <Mail className="h-4 w-4 text-cyan-400" />
                <span>{user.email}</span>
              </div>
            </div>
          </div>

          {/* Professional Details Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-2">Sobre Minha Carreira</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Headline */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Título Profissional (Headline)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Ex: Desenvolvedor Node.js Backend Sênior"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Experience Years */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Anos de Experiência
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                  required
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Mini Biografia / Apresentação
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Escreva brevemente sobre sua trajetória, projetos que liderou e objetivos profissionais..."
                className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
              />
            </div>

            {/* Location and Salary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1 space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Cidade
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: São Paulo"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                  />
                </div>
              </div>

              <div className="md:col-span-1 space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Estado (UF)
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  placeholder="Ex: SP"
                  className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Pretensão Salarial Mensal (R$)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <span className="text-xs font-bold">R$</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={salaryExpected}
                    onChange={(e) => setSalaryExpected(Number(e.target.value))}
                    placeholder="Ex: 8500"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Skills / Competências Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-2">Habilidades Técnicas</h2>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Minhas Competências (Separadas por vírgula)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Sparkles className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={skillsString}
                  onChange={(e) => setSkillsString(e.target.value)}
                  placeholder="Ex: Node.js, TypeScript, PostgreSQL, Docker, Git, REST API"
                  className="w-full pl-9 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-500">
                ⚠️ Insira as tecnologias exatas que você domina. Elas são usadas para calcular seu match automático de IA com cada vaga disponível!
              </p>
            </div>
          </div>

          {/* Social Links and Resume */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-2">Links & Currículo</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LinkedIn */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Perfil do LinkedIn (URL)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <LinkIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/seu-perfil"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                  />
                </div>
              </div>

              {/* GitHub */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Perfil do GitHub (URL)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <LinkIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/seu-usuario"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                  />
                </div>
              </div>

              {/* Portfolio */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Portfólio / Site Pessoal (URL)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <LinkIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://seusite.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                  />
                </div>
              </div>

              {/* Resume File URL */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Link do Currículo em PDF (Google Drive/Dropbox/etc)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <FileText className="h-4 w-4" />
                  </div>
                  <input
                    type="url"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 px-4 font-semibold text-white rounded-xl accent-glow-gradient hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Meu Perfil Profissional
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
