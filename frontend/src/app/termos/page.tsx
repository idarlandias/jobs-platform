import React from 'react'
import Link from 'next/link'

export const metadata = { title: 'Termos de Uso — JobSpark' }

export default function TermosPage() {
  return (
    <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="p-8 sm:p-10 rounded-3xl glass-card">
        <h1 className="text-3xl font-extrabold text-white mb-2">Termos de Uso</h1>
        <p className="text-xs text-slate-500 mb-8">Última atualização: junho de 2026</p>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Aceitação dos Termos</h2>
            <p>Ao acessar e utilizar a plataforma JobSpark, você concorda com estes Termos de Uso. Caso não concorde com qualquer condição aqui descrita, recomendamos que não utilize o serviço.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Descrição do Serviço</h2>
            <p>O JobSpark é uma plataforma de recrutamento e seleção que conecta candidatos e empresas por meio de inteligência artificial, oferecendo match de vagas, análise de perfil e busca semântica de oportunidades.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Contas de Usuário</h2>
            <p>Você é responsável por manter a confidencialidade das suas credenciais e por todas as atividades realizadas em sua conta. As informações fornecidas no cadastro devem ser verdadeiras, completas e atualizadas.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Uso Adequado</h2>
            <p>É proibido utilizar a plataforma para fins ilícitos, publicar conteúdo falso ou ofensivo, ou tentar comprometer a segurança e o funcionamento do serviço. Vagas devem divulgar informações verídicas, incluindo a faixa salarial.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Propriedade Intelectual</h2>
            <p>Todo o conteúdo, marca, design e tecnologia da plataforma pertencem ao JobSpark e são protegidos pela legislação aplicável. O conteúdo enviado pelos usuários permanece de sua titularidade.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white mb-2">6. Limitação de Responsabilidade</h2>
            <p>O JobSpark atua como intermediário entre candidatos e empresas e não garante contratações. As decisões de contratação são de responsabilidade exclusiva das empresas anunciantes.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white mb-2">7. Alterações</h2>
            <p>Estes Termos podem ser atualizados periodicamente. O uso contínuo da plataforma após alterações constitui aceitação da versão vigente.</p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800">
          <Link href="/" className="text-sm font-semibold text-purple-400 hover:text-purple-300">← Voltar ao início</Link>
        </div>
      </div>
    </div>
  )
}
