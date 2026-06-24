import React from 'react'
import Link from 'next/link'

export const metadata = { title: 'Política de Privacidade — JobSpark' }

export default function PrivacidadePage() {
  return (
    <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="p-8 sm:p-10 rounded-3xl glass-card">
        <h1 className="text-3xl font-extrabold text-white mb-2">Política de Privacidade</h1>
        <p className="text-xs text-slate-500 mb-8">Última atualização: junho de 2026 · Em conformidade com a LGPD (Lei nº 13.709/2018)</p>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Dados que Coletamos</h2>
            <p>Coletamos os dados fornecidos por você no cadastro e no perfil (nome, e-mail, competências, experiência, pretensão salarial e links), além de dados de uso necessários ao funcionamento da plataforma.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Como Usamos seus Dados</h2>
            <p>Seus dados são usados para calcular o match com vagas, gerar análises por IA, exibir oportunidades compatíveis e permitir candidaturas. Não vendemos seus dados a terceiros.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Compartilhamento</h2>
            <p>Seus dados de contato só são compartilhados com uma empresa a partir do momento em que você se candidata a uma vaga dela. Não há envio de mensagens não solicitadas por recrutadores.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Segurança</h2>
            <p>Adotamos medidas técnicas de proteção, incluindo criptografia de senhas e armazenamento seguro de credenciais. Nenhum sistema é 100% infalível, mas trabalhamos para minimizar riscos.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Seus Direitos (LGPD)</h2>
            <p>Você pode acessar, corrigir, exportar ou solicitar a exclusão dos seus dados a qualquer momento, além de revogar consentimentos. Para exercer esses direitos, utilize a página de <Link href="/contato" className="text-purple-400 hover:text-purple-300">Contato</Link>.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white mb-2">6. Cookies</h2>
            <p>Utilizamos armazenamento local apenas para manter sua sessão autenticada. Não utilizamos cookies de rastreamento publicitário.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white mb-2">7. Retenção e Exclusão</h2>
            <p>Mantemos seus dados enquanto sua conta estiver ativa. Ao solicitar a exclusão, removemos seus dados pessoais dos nossos sistemas, salvo obrigações legais de retenção.</p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800">
          <Link href="/" className="text-sm font-semibold text-purple-400 hover:text-purple-300">← Voltar ao início</Link>
        </div>
      </div>
    </div>
  )
}
