'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/lib/authStore'

type Cta = { label: string; href: string }

type Diff = {
  icon: string
  title: string
  desc: string
  badge: string
  detail: string
  cta: Cta // CTA para visitante (não logado)
  authCta?: Cta // CTA quando o usuário já está logado (cai no cta se ausente)
  soon?: boolean
}

const DIFFERENTIATORS: Diff[] = [
  {
    icon: '🎯',
    title: 'Match Score Transparente',
    desc: 'Visualize exatamente a porcentagem de adequação do seu perfil a cada vaga antes mesmo de enviar sua candidatura.',
    badge: 'IA Bidirecional',
    detail:
      'Cada vaga exibe um Match Score de 0 a 100% calculado pela nossa IA comparando suas competências, experiência e perfil com os requisitos da vaga. Ao se candidatar, você recebe ainda a classificação Fit / No Fit, a lista de habilidades compatíveis e as que faltam — total transparência, sem caixa-preta.',
    cta: { label: 'Ver vagas e meu match', href: '/vagas' },
  },
  {
    icon: '⚡',
    title: 'Candidatura em 1-Clique',
    desc: 'Salve suas informações e portfólio. Nunca mais preencha formulários de 5 páginas repetidamente para cada vaga.',
    badge: 'Foco em UX',
    detail:
      'Você preenche o perfil uma única vez (skills, experiência, links e pretensão salarial). A partir daí, candidatar-se a qualquer vaga é um clique — sem refazer formulários. A carta de apresentação é opcional.',
    cta: { label: 'Criar meu perfil grátis', href: '/register?role=CANDIDATE' },
    authCta: { label: 'Buscar vagas e me candidatar', href: '/vagas' },
  },
  {
    icon: '📡',
    title: 'Status em Tempo Real',
    desc: 'Acompanhe cada movimentação no seu processo seletivo em tempo real via notificações automáticas. Sem vácuos.',
    badge: 'Comunicação',
    detail:
      'A tela "Minhas Candidaturas" mostra uma linha do tempo visual do seu processo: Enviada → Triagem → Visualizada → Selecionada → Entrevista → Proposta → Contratado. Você sempre sabe em que etapa está, sem ficar no vácuo.',
    cta: { label: 'Acompanhar candidaturas', href: '/candidaturas' },
  },
  {
    icon: '💡',
    title: 'Feedback de IA no Currículo',
    desc: 'Faça o upload do seu currículo e receba dicas de melhoria automáticas baseadas em vagas reais da sua área.',
    badge: 'Gratuito',
    detail:
      'Nossa IA analisa o seu perfil e gera feedback construtivo: pontos fortes, competências que faltam e sugestões de desenvolvimento personalizadas com base nas vagas reais da plataforma.',
    cta: { label: 'Completar meu perfil', href: '/perfil' },
  },
  {
    icon: '🔍',
    title: 'Busca por Linguagem Natural',
    desc: "Pesquise por vagas escrevendo: 'quero trabalhar com IA em startup remota de FinTech' e encontre correspondências exatas por vetor.",
    badge: 'pgvector',
    detail:
      'Esqueça filtros engessados. Escreva o que você quer em linguagem natural e a busca semântica (embeddings + pgvector) encontra as vagas mais próximas por significado — não por palavra-chave exata.',
    cta: { label: 'Buscar por linguagem natural', href: '/vagas' },
  },
  {
    icon: '📋',
    title: 'Pipeline Kanban Visual',
    desc: 'Para as empresas: gerencie candidatos arrastando e soltando cartões em etapas customizadas de forma fluida.',
    badge: 'Para Recrutadores',
    detail:
      'Empresas recebem os candidatos já ranqueados por Match Score e movem cada um pelas etapas do funil de forma visual. A visão Kanban com arrastar-e-soltar está no nosso roadmap de evolução.',
    cta: { label: 'Sou empresa, quero contratar', href: '/register?role=COMPANY' },
    authCta: { label: 'Ir ao painel de vagas', href: '/empresa/vagas' },
    soon: true,
  },
  {
    icon: '🎥',
    title: 'Entrevistas Assíncronas',
    desc: 'Grave suas respostas em vídeo quando e de onde preferir. Sem conflitos de agenda na primeira triagem.',
    badge: 'Praticidade',
    detail:
      'A triagem por vídeo assíncrono permite que você responda às perguntas no seu tempo, sem conflito de agenda. Esta funcionalidade está em desenvolvimento — crie sua conta para ser avisado no lançamento.',
    cta: { label: 'Criar conta e ser avisado', href: '/register?role=CANDIDATE' },
    authCta: { label: 'Explorar vagas', href: '/vagas' },
    soon: true,
  },
  {
    icon: '🛡️',
    title: 'Sem SPAM de Recrutador',
    desc: 'Nenhum recrutador te aborda do nada: a empresa só vê seu perfil e contato depois que VOCÊ se candidata a uma vaga dela.',
    badge: 'Privacidade',
    detail:
      'No JobSpark não existe disparo de mensagens não solicitadas nem busca ativa de recrutador no seu contato. A empresa só passa a ter acesso ao seu nome e e-mail a partir do momento em que você decide se candidatar a uma vaga dela — a iniciativa é sempre sua. Enquanto você não se candidata, seu contato não é exposto.',
    cta: { label: 'Proteger meus dados', href: '/register?role=CANDIDATE' },
    authCta: { label: 'Ver meu perfil', href: '/perfil' },
  },
  {
    icon: '💰',
    title: 'Transparência Salarial',
    desc: 'Todas as vagas da plataforma exigem a divulgação da faixa salarial mínima e máxima. Chega de surpresas.',
    badge: 'Obrigatório',
    detail:
      'É regra da plataforma: nenhuma vaga é publicada sem faixa salarial mínima e máxima. O próprio sistema bloqueia a criação de vagas sem salário. Você sempre sabe quanto a vaga paga antes de se candidatar.',
    cta: { label: 'Ver vagas com salário', href: '/vagas' },
  },
  {
    icon: '📈',
    title: 'Analytics do Candidato',
    desc: 'Veja estatísticas de quantas vezes seu perfil apareceu em buscas, quantas visitas recebeu e quais competências estão em alta.',
    badge: 'Estatísticas',
    detail:
      'Um painel com métricas do seu perfil: aparições em buscas, visualizações e competências em alta no mercado. Estamos finalizando este painel de analytics — em breve disponível na sua conta.',
    cta: { label: 'Criar conta e ser avisado', href: '/register?role=CANDIDATE' },
    authCta: { label: 'Ir ao meu perfil', href: '/perfil' },
    soon: true,
  },
]

export default function Differentiators() {
  const [active, setActive] = useState<number | null>(null)
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const item = active !== null ? DIFFERENTIATORS[active] : null
  // Logado: usa o CTA in-app (evita mandar pra criar conta quem já tem conta)
  const cta = item ? (isAuthenticated && item.authCta ? item.authCta : item.cta) : null

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DIFFERENTIATORS.map((diff, index) => (
          <div
            key={index}
            className="p-8 rounded-3xl glass-card glass-card-hover flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl">
                  {diff.icon}
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {diff.badge}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{diff.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">{diff.desc}</p>
            </div>

            <button
              onClick={() => setActive(index)}
              className="pt-2 border-t border-slate-900/60 flex items-center text-xs text-purple-400 font-semibold group cursor-pointer hover:text-purple-300 w-full text-left"
            >
              Saber mais{' '}
              <span className="ml-1 transform transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {item && cta && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-lg p-8 rounded-3xl glass-card border border-purple-500/20 bg-slate-950/90"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActive(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-3xl">
                {item.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {item.badge}
                  </span>
                  {item.soon && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      Em breve
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white leading-tight">{item.title}</h3>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-8">{item.detail}</p>

            <Link
              href={cta.href}
              className="w-full py-3.5 px-4 font-semibold text-white rounded-xl accent-glow-gradient hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center justify-center gap-2 group"
            >
              {cta.label}
              <ArrowRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
