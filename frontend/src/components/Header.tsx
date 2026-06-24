'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'
import { LogOut, User as UserIcon, Briefcase, FileText, PlusCircle, Cpu } from 'lucide-react'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, loadUser, logout } = useAuthStore()

  useEffect(() => {
    loadUser()
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full glass-nav border-b border-slate-900/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl accent-glow-gradient flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform duration-300">
              ✨
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
              JobSpark
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-slate-300">
            <Link href="/" className={`hover:text-white transition-colors duration-200 ${pathname === '/' ? 'text-white font-bold' : ''}`}>
              Início
            </Link>

            <Link href="/ml-demo" className={`hover:text-white transition-colors duration-200 flex items-center gap-1.5 ${pathname === '/ml-demo' ? 'text-white font-bold' : ''}`}>
              <Cpu className="h-4 w-4" /> JobMatch AI
            </Link>

            {/* Candidate specific links */}
            {isAuthenticated && user?.role === 'CANDIDATE' && (
              <>
                <Link href="/vagas" className={`hover:text-white transition-colors duration-200 flex items-center gap-1.5 ${pathname === '/vagas' ? 'text-white font-bold' : ''}`}>
                  <Briefcase className="h-4 w-4" /> Buscar Vagas
                </Link>
                <Link href="/candidaturas" className={`hover:text-white transition-colors duration-200 flex items-center gap-1.5 ${pathname === '/candidaturas' ? 'text-white font-bold' : ''}`}>
                  <FileText className="h-4 w-4" /> Minhas Inscrições
                </Link>
                <Link href="/perfil" className={`hover:text-white transition-colors duration-200 flex items-center gap-1.5 ${pathname === '/perfil' ? 'text-white font-bold' : ''}`}>
                  <UserIcon className="h-4 w-4" /> Meu Perfil
                </Link>
              </>
            )}

            {/* Company specific links */}
            {isAuthenticated && user?.role === 'COMPANY' && (
              <>
                <Link href="/empresa/vagas" className={`hover:text-white transition-colors duration-200 flex items-center gap-1.5 ${pathname.startsWith('/empresa/vagas') && !pathname.endsWith('/nova') ? 'text-white font-bold' : ''}`}>
                  <Briefcase className="h-4 w-4" /> Painel de Vagas
                </Link>
                <Link href="/empresa/vagas/nova" className={`hover:text-white transition-colors duration-200 flex items-center gap-1.5 ${pathname === '/empresa/vagas/nova' ? 'text-white font-bold' : ''}`}>
                  <PlusCircle className="h-4 w-4" /> Publicar Vaga
                </Link>
              </>
            )}

            {/* Default links for guest users */}
            {!isAuthenticated && (
              <>
                <Link href="/#diferenciais" className="hover:text-white transition-colors duration-200">
                  Diferenciais
                </Link>
                <Link href="/vagas" className="hover:text-white transition-colors duration-200">
                  Buscar Vagas
                </Link>
              </>
            )}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                {/* Greeting / Avatar preview */}
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs text-slate-400 font-semibold">Olá,</span>
                  <span className="text-sm text-white font-bold">{user.name}</span>
                </div>
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-900/60 transition-all flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer"
                  title="Sair da conta"
                >
                  <LogOut className="h-4 w-4 text-rose-400" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors duration-200">
                  Entrar
                </Link>
                <Link href="/register" className="px-4 py-2 text-sm font-semibold text-white rounded-xl accent-glow-gradient hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 glass-card-hover">
                  Criar Conta
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
