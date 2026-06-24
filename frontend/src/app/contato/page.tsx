import React from 'react'
import Link from 'next/link'
import { Mail, Github, Linkedin, MapPin } from 'lucide-react'

export const metadata = { title: 'Contato — JobSpark' }

export default function ContatoPage() {
  return (
    <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="p-8 sm:p-10 rounded-3xl glass-card">
        <h1 className="text-3xl font-extrabold text-white mb-2">Fale Conosco</h1>
        <p className="text-sm text-slate-400 mb-8">
          Dúvidas, sugestões ou suporte? Entre em contato pelos canais abaixo — respondemos o mais rápido possível.
        </p>

        <div className="space-y-4">
          <a href="mailto:contato@jobspark.com.br" className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/40 border border-slate-800 hover:border-purple-500/30 transition-colors group">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">E-mail</span>
              <span className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">contato@jobspark.com.br</span>
            </div>
          </a>

          <a href="https://github.com/idarlandias" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/40 border border-slate-800 hover:border-purple-500/30 transition-colors group">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Github className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">GitHub</span>
              <span className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">github.com/idarlandias</span>
            </div>
          </a>

          <a href="https://www.linkedin.com/in/idarlandias/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/40 border border-slate-800 hover:border-purple-500/30 transition-colors group">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Linkedin className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">LinkedIn</span>
              <span className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">linkedin.com/in/idarlandias</span>
            </div>
          </a>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/40 border border-slate-800">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Atendimento</span>
              <span className="text-sm font-semibold text-white">Brasil · Seg a Sex, 9h às 18h</span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800">
          <Link href="/" className="text-sm font-semibold text-purple-400 hover:text-purple-300">← Voltar ao início</Link>
        </div>
      </div>
    </div>
  )
}
