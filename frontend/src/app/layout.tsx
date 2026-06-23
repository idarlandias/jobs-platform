import type { Metadata } from "next";
import "../styles/globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "JobSpark — Recrutamento Inteligente e Match de IA",
  description: "A plataforma de recrutamento com IA bidirecional e transparente que conecta candidatos às melhores vagas de forma justa, rápida e inteligente.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {/* Background glowing gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] purple-glow-bg pointer-events-none rounded-full" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] cyan-glow-bg pointer-events-none rounded-full" />
        <div className="absolute bottom-[-10%] left-[20%] w-[55%] h-[55%] purple-glow-bg pointer-events-none rounded-full" />

        {/* Global Navigation Bar */}
        <Header />

        {/* Main Content Area */}
        <main className="relative min-h-screen">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-black/40 py-12 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg accent-glow-gradient flex items-center justify-center font-bold text-xs text-white">
                ✨
              </div>
              <span className="font-bold text-sm tracking-tight text-white">
                JobSpark
              </span>
            </div>
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} JobSpark. Todos os direitos reservados. Feito para revolucionar o recrutamento.
            </p>
            <div className="flex gap-4 text-xs text-slate-400">
              <a href="#" className="hover:text-white transition-colors">Termos</a>
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Contato</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
