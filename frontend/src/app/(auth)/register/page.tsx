'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { User, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Building2 } from 'lucide-react'
import { useAuthStore } from '@/lib/authStore'

const registerSchema = z.object({
  name: z.string().min(3, 'O nome deve conter pelo menos 3 caracteres.'),
  email: z.string().email('Por favor, insira um e-mail válido.'),
  password: z.string().min(6, 'A senha deve conter no mínimo 6 caracteres.'),
  confirmPassword: z.string().min(6, 'Confirme sua senha.'),
  role: z.enum(['CANDIDATE', 'COMPANY']),
  cnpj: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas digitadas não coincidem.',
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.role === 'COMPANY' && (!data.cnpj || data.cnpj.trim() === '')) {
    return false
  }
  return true
}, {
  message: 'CNPJ é obrigatório para cadastros de empresa.',
  path: ['cnpj'],
})

type RegisterInput = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { register: signup, error, clearError, isLoading } = useAuthStore()
  const [selectedRole, setSelectedRole] = useState<'CANDIDATE' | 'COMPANY'>('CANDIDATE')
  const [showPassword, setShowPassword] = useState(false)

  const {
    register: formRegister,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'CANDIDATE',
      cnpj: '',
    },
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const roleParam = params.get('role')
      if (roleParam === 'COMPANY' || roleParam === 'CANDIDATE') {
        setSelectedRole(roleParam as 'CANDIDATE' | 'COMPANY')
        setValue('role', roleParam as 'CANDIDATE' | 'COMPANY')
      }
    }
  }, [setValue])

  const handleRoleChange = (role: 'CANDIDATE' | 'COMPANY') => {
    setSelectedRole(role)
    setValue('role', role)
    clearError()
  }

  const onSubmit = async (data: RegisterInput) => {
    try {
      clearError()
      await signup({
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role,
        cnpj: data.role === 'COMPANY' ? data.cnpj : undefined,
      })
      router.push('/')
    } catch (_) {
      // Managed in auth store
    }
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12 relative z-10">
      <div className="absolute w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md p-8 rounded-3xl glass-card relative overflow-hidden animate-glow-box">
        <div className="absolute top-0 left-0 right-0 h-1 accent-glow-gradient" />

        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Crie sua Conta
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Faça parte da revolução do recrutamento
          </p>
        </div>

        {/* Tab Role Switcher */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-900 mb-6">
          <button
            type="button"
            onClick={() => handleRoleChange('CANDIDATE')}
            className={`py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
              selectedRole === 'CANDIDATE'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/20 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sou Candidato
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('COMPANY')}
            className={`py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
              selectedRole === 'COMPANY'
                ? 'bg-cyan-600/30 text-cyan-200 border border-cyan-500/20 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sou Empresa / RH
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-xs font-semibold text-rose-400">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Hidden Role Input */}
          <input type="hidden" {...formRegister('role')} />

          {/* Full Name / Company Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              {selectedRole === 'CANDIDATE' ? 'Nome Completo' : 'Nome da Empresa'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                {selectedRole === 'CANDIDATE' ? <User className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
              </div>
              <input
                {...formRegister('name')}
                type="text"
                placeholder={selectedRole === 'CANDIDATE' ? 'Ex: João da Silva' : 'Ex: JobSpark Tech Ltda'}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
              />
            </div>
            {errors.name && (
              <span className="text-[10px] font-bold text-rose-400">{errors.name.message}</span>
            )}
          </div>

          {/* CNPJ (Company Only) */}
          {selectedRole === 'COMPANY' && (
            <div className="space-y-2 animate-float" style={{ animationDuration: '4s' }}>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                CNPJ da Empresa
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Building2 className="h-5 w-5" />
                </div>
                <input
                  {...formRegister('cnpj')}
                  type="text"
                  placeholder="00.000.000/0000-00"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                />
              </div>
              {errors.cnpj && (
                <span className="text-[10px] font-bold text-rose-400">{errors.cnpj.message}</span>
              )}
            </div>
          )}

          {/* E-mail */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              E-mail
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="h-5 w-5" />
              </div>
              <input
                {...formRegister('email')}
                type="email"
                placeholder={selectedRole === 'CANDIDATE' ? 'joao@email.com' : 'rh@empresa.com'}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
              />
            </div>
            {errors.email && (
              <span className="text-[10px] font-bold text-rose-400">{errors.email.message}</span>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Crie uma Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="h-5 w-5" />
              </div>
              <input
                {...formRegister('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-11 pr-11 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <span className="text-[10px] font-bold text-rose-400">{errors.password.message}</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Confirme sua Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="h-5 w-5" />
              </div>
              <input
                {...formRegister('confirmPassword')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Repita sua senha"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
              />
            </div>
            {errors.confirmPassword && (
              <span className="text-[10px] font-bold text-rose-400">{errors.confirmPassword.message}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 font-semibold text-white rounded-xl accent-glow-gradient hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Criar Conta Grátis
                <ArrowRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-8 pt-6 border-t border-slate-900">
          <p className="text-xs text-slate-400">
            Já possui uma conta?{' '}
            <button
              onClick={() => router.push('/login')}
              className="font-bold text-purple-400 hover:text-purple-300 transition-colors"
            >
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
