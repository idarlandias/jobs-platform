'use client'

import React, { useState } from 'react'
import { api } from '@/lib/api'
import { Sparkles, DollarSign, Loader2, Cpu, CheckCircle2, XCircle } from 'lucide-react'

type FitResult = { fit: boolean; classification: string; score: number; model: string }
type SalaryResult = { salary: number; model: string }

const WORKPLACES = [
  { label: 'Remoto', factor: 1.0 },
  { label: 'Híbrido', factor: 1.05 },
  { label: 'Presencial', factor: 1.1 },
]
const SENIORITY = [
  { label: 'Júnior', level: 1 },
  { label: 'Pleno', level: 2 },
  { label: 'Sênior', level: 3 },
]

export default function MlDemoPage() {
  // ---- Classificador Fit ----
  const [nRequired, setNRequired] = useState(5)
  const [nMatched, setNMatched] = useState(4)
  const [candExp, setCandExp] = useState(5)
  const [reqExp, setReqExp] = useState(4)
  const [salaryExpected, setSalaryExpected] = useState(9000)
  const [jobSalary, setJobSalary] = useState(11000)
  const [workplaceMatch, setWorkplaceMatch] = useState(true)
  const [nExtra, setNExtra] = useState(2)
  const [fitRes, setFitRes] = useState<FitResult | null>(null)
  const [fitLoading, setFitLoading] = useState(false)

  // ---- Regressor Salário ----
  const [seniority, setSeniority] = useState(2)
  const [reqExp2, setReqExp2] = useState(4)
  const [nRequired2, setNRequired2] = useState(5)
  const [skillDemand, setSkillDemand] = useState(1.05)
  const [locFactor, setLocFactor] = useState(1.0)
  const [salRes, setSalRes] = useState<SalaryResult | null>(null)
  const [salLoading, setSalLoading] = useState(false)

  const predictFit = async () => {
    setFitLoading(true)
    setFitRes(null)
    try {
      const matched = Math.min(nMatched, nRequired)
      const payload = {
        match_ratio: nRequired > 0 ? matched / nRequired : 0,
        n_matched: matched,
        n_missing: Math.max(0, nRequired - matched),
        exp_gap: candExp - reqExp,
        salary_gap_ratio: jobSalary > 0 ? (salaryExpected - jobSalary) / jobSalary : 0,
        workplace_match: workplaceMatch ? 1 : 0,
        n_extra_skills: nExtra,
      }
      setFitRes(await api.post<FitResult>('/api/v1/ml/predict-fit', payload))
    } catch (e: any) {
      alert('Erro: ' + e.message)
    } finally {
      setFitLoading(false)
    }
  }

  const predictSalary = async () => {
    setSalLoading(true)
    setSalRes(null)
    try {
      const payload = {
        seniority_level: seniority,
        required_exp: reqExp2,
        n_required: nRequired2,
        avg_skill_demand: skillDemand,
        loc_factor: locFactor,
      }
      setSalRes(await api.post<SalaryResult>('/api/v1/ml/predict-salary', payload))
    } catch (e: any) {
      alert('Erro: ' + e.message)
    } finally {
      setSalLoading(false)
    }
  }

  const field =
    'w-full px-3 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all'
  const lbl = 'text-xs font-semibold text-slate-300 block mb-1.5'

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-xs font-semibold text-purple-300 mb-4">
          <Cpu className="h-3.5 w-3.5" /> Modelos treinados (scikit-learn)
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          JobMatch AI — Demonstração dos Modelos
        </h1>
        <p className="text-sm text-slate-400">
          Dois modelos supervisionados servidos em produção: um <strong className="text-purple-300">classificador</strong> (Fit x No Fit) e um{' '}
          <strong className="text-cyan-300">regressor</strong> (salário). Ajuste os parâmetros e veja a predição em tempo real.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ---------- Classificador Fit ---------- */}
        <div className="p-7 rounded-3xl glass-card border-purple-500/20 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Classificação — Fit x No Fit</h2>
          </div>
          <p className="text-[11px] text-slate-500 -mt-2">Modelo: Regressão Logística · F1 0,909 · ROC-AUC 0,978</p>

          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>Skills exigidas</label><input type="number" min={1} className={field} value={nRequired} onChange={(e) => setNRequired(+e.target.value)} /></div>
            <div><label className={lbl}>Skills que você tem</label><input type="number" min={0} className={field} value={nMatched} onChange={(e) => setNMatched(+e.target.value)} /></div>
            <div><label className={lbl}>Sua experiência (anos)</label><input type="number" min={0} className={field} value={candExp} onChange={(e) => setCandExp(+e.target.value)} /></div>
            <div><label className={lbl}>Experiência exigida</label><input type="number" min={0} className={field} value={reqExp} onChange={(e) => setReqExp(+e.target.value)} /></div>
            <div><label className={lbl}>Sua pretensão (R$)</label><input type="number" min={0} step={500} className={field} value={salaryExpected} onChange={(e) => setSalaryExpected(+e.target.value)} /></div>
            <div><label className={lbl}>Salário da vaga (R$)</label><input type="number" min={0} step={500} className={field} value={jobSalary} onChange={(e) => setJobSalary(+e.target.value)} /></div>
            <div><label className={lbl}>Skills extras</label><input type="number" min={0} className={field} value={nExtra} onChange={(e) => setNExtra(+e.target.value)} /></div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input type="checkbox" checked={workplaceMatch} onChange={(e) => setWorkplaceMatch(e.target.checked)} className="accent-purple-500 h-4 w-4" />
                Aceita a modalidade
              </label>
            </div>
          </div>

          <button onClick={predictFit} disabled={fitLoading} className="w-full py-3 font-semibold text-white rounded-xl accent-glow-gradient hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
            {fitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Classificar Fit
          </button>

          {fitRes && (
            <div className={`p-5 rounded-2xl border text-center animate-fadeIn ${fitRes.fit ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                {fitRes.fit ? <CheckCircle2 className="h-6 w-6 text-emerald-400" /> : <XCircle className="h-6 w-6 text-rose-400" />}
                <span className={`text-2xl font-extrabold ${fitRes.fit ? 'text-emerald-400' : 'text-rose-400'}`}>{fitRes.classification}</span>
              </div>
              <p className="text-sm text-slate-300">Probabilidade de Fit: <strong className="text-white">{fitRes.score}%</strong></p>
              <p className="text-[10px] text-slate-500 mt-1">modelo: {fitRes.model}</p>
            </div>
          )}
        </div>

        {/* ---------- Regressor Salário ---------- */}
        <div className="p-7 rounded-3xl glass-card border-cyan-500/20 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
            <DollarSign className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Regressão — Salário da Vaga</h2>
          </div>
          <p className="text-[11px] text-slate-500 -mt-2">Modelo: Gradient Boosting · R² 0,949 · MAE R$ 970</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Senioridade</label>
              <select className={field} value={seniority} onChange={(e) => setSeniority(+e.target.value)}>
                {SENIORITY.map((s) => <option key={s.level} value={s.level}>{s.label}</option>)}
              </select>
            </div>
            <div><label className={lbl}>Experiência exigida (anos)</label><input type="number" min={0} className={field} value={reqExp2} onChange={(e) => setReqExp2(+e.target.value)} /></div>
            <div><label className={lbl}>Nº de skills exigidas</label><input type="number" min={1} className={field} value={nRequired2} onChange={(e) => setNRequired2(+e.target.value)} /></div>
            <div>
              <label className={lbl}>Modalidade</label>
              <select className={field} value={locFactor} onChange={(e) => setLocFactor(+e.target.value)}>
                {WORKPLACES.map((w) => <option key={w.label} value={w.factor}>{w.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className={lbl}>Demanda das skills (mercado): {skillDemand.toFixed(2)}</label>
              <input type="range" min={0.7} max={1.3} step={0.05} value={skillDemand} onChange={(e) => setSkillDemand(+e.target.value)} className="w-full accent-cyan-500" />
              <div className="flex justify-between text-[10px] text-slate-500"><span>Comum</span><span>Muito requisitada</span></div>
            </div>
          </div>

          <button onClick={predictSalary} disabled={salLoading} className="w-full py-3 font-semibold text-white rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
            {salLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />} Estimar Salário
          </button>

          {salRes && (
            <div className="p-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-center animate-fadeIn">
              <p className="text-xs text-slate-400 mb-1">Salário estimado para a vaga</p>
              <span className="text-3xl font-extrabold text-cyan-300">
                R$ {salRes.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <p className="text-[10px] text-slate-500 mt-1">modelo: {salRes.model}</p>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-600 mt-10 max-w-2xl mx-auto">
        Predições servidas por um microserviço Python (FastAPI + scikit-learn) no Google Cloud Run, consumido pelo backend em <code className="text-slate-400">/api/v1/ml</code>. Modelos treinados com validação cruzada 5-fold.
      </p>
    </div>
  )
}
