import React from 'react';
import Differentiators from '@/components/Differentiators';
import LandingCtas from '@/components/LandingCtas';

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

        <LandingCtas size="lg" />
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

        <Differentiators />
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
          <LandingCtas size="md" />
        </div>
      </div>
    </div>
  );
}
