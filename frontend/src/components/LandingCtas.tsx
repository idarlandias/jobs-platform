'use client'

import React from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/authStore'

type Size = 'lg' | 'md'

const STYLES: Record<Size, { primary: string; secondary: string }> = {
  lg: {
    primary:
      'px-8 py-4 font-semibold text-white rounded-2xl accent-glow-gradient hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center',
    secondary:
      'px-8 py-4 font-semibold text-slate-200 rounded-2xl glass-card hover:bg-slate-900/60 border border-slate-700/50 hover:border-slate-500/50 transition-all duration-300 flex items-center justify-center',
  },
  md: {
    primary:
      'px-6 py-3 font-semibold text-white rounded-xl accent-glow-gradient hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 flex items-center justify-center',
    secondary:
      'px-6 py-3 font-semibold text-slate-300 rounded-xl bg-slate-900 border border-slate-800 hover:text-white transition-all duration-300 flex items-center justify-center',
  },
}

export default function LandingCtas({ size = 'lg' }: { size?: Size }) {
  const { isAuthenticated, user } = useAuthStore()
  const s = STYLES[size]

  let primary = { label: 'Quero Me Candidatar', href: '/register?role=CANDIDATE' }
  let secondary = { label: 'Anunciar Vaga', href: '/register?role=COMPANY' }

  if (isAuthenticated && user?.role === 'CANDIDATE') {
    primary = { label: 'Buscar Vagas', href: '/vagas' }
    secondary = { label: 'Minhas Candidaturas', href: '/candidaturas' }
  } else if (isAuthenticated && user?.role === 'COMPANY') {
    primary = { label: 'Publicar Vaga', href: '/empresa/vagas/nova' }
    secondary = { label: 'Painel de Vagas', href: '/empresa/vagas' }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Link href={primary.href} className={s.primary}>
        {primary.label}
      </Link>
      <Link href={secondary.href} className={s.secondary}>
        {secondary.label}
      </Link>
    </div>
  )
}
