import React from 'react';
import Link from 'next/link';

const DIFFERENTIATORS = [
  {
    icon: "🎯",
    title: "Match Score Transparente",
    desc: "Visualize exatamente a porcentagem de adequação do seu perfil a cada vaga antes mesmo de enviar sua candidatura.",
    badge: "IA Bidirecional"
  },
  {
    icon: "⚡",
    title: "Candidatura em 1-Clique",
    desc: "Salve suas informações e portfólio. Nunca mais preencha formulários de 5 páginas repetidamente para cada vaga.",
    badge: "Foco em UX"
  },
  {
    icon: "📡",
    title: "Status em Tempo Real",
    desc: "Acompanhe cada movimentação no seu processo seletivo em tempo real via notificações automáticas. Sem vácuos.",
    badge: "Comunicação"
  },
  {
    icon: "💡",
    title: "Feedback de IA no Currículo",
    desc: "Faça o upload do seu currículo e receba dicas de melhoria automáticas baseadas em vagas reais da sua área.",
    badge: "Gratuito"
  },
  {
    icon: "🔍",
    title: "Busca por Linguagem Natural",
    desc: "Pesquise por vagas escrevendo: 'quero trabalhar com IA em startup remota de FinTech' e encontre correspondências exatas por vetor.",
    badge: "pgvector"
  },
  {
    icon: "📋",
    title: "Pipeline Kanban Visual",
    desc: "Para as empresas: gerencie candidatos arrastando e soltando cartões em etapas customizadas de forma fluida.",
    badge: "Para Recrutadores"
  },
  {
    icon: "🎥",
    title: "Entrevistas Assíncronas",
    desc: "Grave suas respostas em vídeo quando e de onde preferir. Sem conflitos de agenda na primeira triagem.",
    badge: "Praticidade"
  },
  {
    icon: "🛡️",
    title: "Sem SPAM de Recrutador",
    desc: "Mantenha seus dados seguros. Empresas parceiras só podem contatar você após o seu aceite explícito de convite.",
    badge: "Privacidade"
  },
  {
    icon: "💰",
    title: "Transparência Salarial",
    desc: "Todas as vagas da plataforma exigem a divulgação da faixa salarial mínima e máxima. Chega de surpresas.",
    badge: "Obrigatório"
  },
  {
    icon: "📈",
    title: "Analytics do Candidato",
    desc: "Veja estatísticas de quantas vezes seu perfil apareceu em buscas, quantas visitas recebeu e quais competências estão em alta.",
    badge: "Estatísticas"
  }
];

export default function Home() {
  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-xs font-semibold text-purple-300 mb-6 animate-float">
          <span>🚀</span> A nova era do recrutamento chegou
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-8">
          <span className="block text-white">Recrutamento justo e</span>
          <span className="block text-glow-gradient mt-2">IA 100% Transparente</span>
        </h1>
        
        <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Cansado de se candidatar em portais e cair em um buraco negro sem feedback? O JobSpark dá o poder de volta ao candidato com feedback em tempo real e inteligência mútua.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register?role=CANDIDATE" className="px-8 py-4 font-semibold text-white rounded-2xl accent-glow-gradient hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center">
            Quero Me Candidatar
          </Link>
          <Link href="/register?role=COMPANY" className="px-8 py-4 font-semibold text-slate-200 rounded-2xl glass-card hover:bg-slate-900/60 border border-slate-700/50 hover:border-slate-500/50 transition-all duration-300 flex items-center justify-center">
            Anunciar Vaga
          </Link>
        </div>
      </div>

      {/* Stats Counter Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-28 text-center">
        {[
          { num: "94%", label: "Precisão de Match IA" },
          { num: "1-Clique", label: "Candidatura Simples" },
          { num: "0% SPAM", label: "Privacidade Garantida" },
          { num: "100%", label: "Vagas com Salário Visível" }
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl glass-card">
            <div className="text-2xl sm:text-4xl font-extrabold text-white mb-2">{stat.num}</div>
            <div className="text-xs sm:text-sm text-slate-400 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Differentiators Grid */}
      <div id="diferenciais" className="mb-24 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            10 Razões para Escolher o JobSpark
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Esqueça os processos engessados e opacos. Redesenhamos a experiência de buscar emprego e contratar do zero.
          </p>
        </div>

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
                <h3 className="text-xl font-bold text-white mb-3">
                  {diff.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  {diff.desc}
                </p>
              </div>
              
              <div className="pt-2 border-t border-slate-900/60 flex items-center text-xs text-purple-400 font-semibold group cursor-pointer hover:text-purple-300">
                Saber mais <span className="ml-1 transform transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action Container */}
      <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-950/20 via-slate-950 to-cyan-950/20 p-8 sm:p-12 md:p-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.08),transparent_50%)] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-6">
            Pronto para transformar sua carreira ou sua empresa?
          </h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Seja você um desenvolvedor buscando um ambiente ágil ou uma empresa procurando o match ideal sem burocracia, o JobSpark é o seu lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?role=CANDIDATE" className="px-6 py-3 font-semibold text-white rounded-xl accent-glow-gradient hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 flex items-center justify-center">
              Registrar Perfil Grátis
            </Link>
            <Link href="/register?role=COMPANY" className="px-6 py-3 font-semibold text-slate-300 rounded-xl bg-slate-900 border border-slate-800 hover:text-white transition-all duration-300 flex items-center justify-center">
              Ver Planos de Contratação
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
