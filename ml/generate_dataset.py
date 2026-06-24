"""
Gera um dataset sintético, porém realista, de pares (candidato x vaga) para
treinar dois modelos do JobMatch AI:

  - Classificação  -> rótulo `fit` (1 = Fit, 0 = No Fit)
  - Regressão      -> alvo  `job_salary` (salário de mercado da vaga, em R$)

O dataset é determinístico (seed fixa) e reproduzível.
Saída: ml/dataset.csv
"""

import numpy as np
import pandas as pd

RNG = np.random.default_rng(42)
N_SAMPLES = 3000

# Skill -> "demanda de mercado" (peso). Quanto maior, mais valoriza o salário.
SKILLS = {
    "Python": 1.10, "Machine Learning": 1.30, "TensorFlow": 1.25, "PyTorch": 1.25,
    "MLOps": 1.30, "JavaScript": 0.90, "TypeScript": 1.00, "Node.js": 1.05,
    "React": 1.05, "Next.js": 1.10, "PostgreSQL": 0.95, "Docker": 1.05,
    "Kubernetes": 1.20, "AWS": 1.20, "Terraform": 1.15, "Django": 1.00,
    "REST API": 0.90, "Tailwind": 0.80, "CI/CD": 1.00, "Git": 0.70, "Go": 1.15,
}
ALL_SKILLS = list(SKILLS.keys())

# Arquétipos de vaga (usam só skills do pool acima)
ROLES = [
    ("Backend Node.js",         ["Node.js", "TypeScript", "PostgreSQL", "Docker", "REST API"], 7000),
    ("Machine Learning Eng.",   ["Python", "TensorFlow", "Machine Learning", "Docker", "MLOps"], 9000),
    ("Frontend React",          ["React", "Next.js", "TypeScript", "Tailwind", "JavaScript"], 6500),
    ("DevOps / SRE",            ["Docker", "Kubernetes", "CI/CD", "AWS", "Terraform"], 8500),
    ("Fullstack",               ["Node.js", "React", "TypeScript", "PostgreSQL", "REST API"], 7500),
    ("Data / Python",           ["Python", "PostgreSQL", "AWS", "Docker", "Git"], 8000),
]

# Senioridade -> (faixa de experiência exigida, multiplicador salarial, nível numérico)
SENIORITY = {
    "Junior": ((0, 2), 1.00, 1),
    "Pleno":  ((3, 5), 1.55, 2),
    "Senior": ((6, 12), 2.15, 3),
}
SENIORITY_KEYS = list(SENIORITY.keys())

# Modalidade -> fator de localização (impacto no salário)
WORKPLACES = {"REMOTE": 1.00, "HYBRID": 1.05, "ONSITE": 1.10}
WORKPLACE_KEYS = list(WORKPLACES.keys())


def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))


rows = []
for _ in range(N_SAMPLES):
    role_name, req_skills, base = ROLES[RNG.integers(len(ROLES))]
    seniority = SENIORITY_KEYS[RNG.integers(len(SENIORITY_KEYS))]
    (exp_lo, exp_hi), sen_mult, sen_level = SENIORITY[seniority]
    required_exp = int(RNG.integers(exp_lo, exp_hi + 1))

    workplace = WORKPLACE_KEYS[RNG.integers(len(WORKPLACE_KEYS))]
    loc_factor = WORKPLACES[workplace]

    n_required = len(req_skills)
    avg_skill_demand = float(np.mean([SKILLS[s] for s in req_skills]))

    # ---- Salário de mercado da vaga (ALVO da regressão) ----
    noise = RNG.normal(1.0, 0.07)
    job_salary = base * sen_mult * loc_factor * (0.80 + 0.50 * avg_skill_demand) * noise
    job_salary = float(np.clip(round(job_salary, -2), 1800, 45000))

    # ---- Candidato ----
    # quantas skills exigidas ele possui
    n_matched = int(RNG.integers(0, n_required + 1))
    matched = list(RNG.choice(req_skills, size=n_matched, replace=False)) if n_matched else []
    n_missing = n_required - n_matched
    match_ratio = n_matched / n_required

    # skills extras (fora das exigidas)
    pool_extra = [s for s in ALL_SKILLS if s not in req_skills]
    n_extra = int(RNG.integers(0, 5))
    n_extra = min(n_extra, len(pool_extra))

    candidate_exp = int(np.clip(required_exp + RNG.integers(-3, 4), 0, 20))
    exp_gap = candidate_exp - required_exp

    salary_expected = float(np.clip(job_salary * RNG.normal(0.95, 0.18), 1500, 60000))
    salary_expected = round(salary_expected, -2)
    # quanto a pretensão estoura o salário da vaga (positivo = pede mais do que paga)
    salary_gap_ratio = (salary_expected - job_salary) / job_salary

    workplace_match = int(RNG.random() < 0.7)  # candidato aceita a modalidade

    # ---- Rótulo de FIT (ALVO da classificação) ----
    exp_score = sigmoid(exp_gap)                       # 0..1, melhor se experiente
    salary_score = sigmoid(-3.0 * salary_gap_ratio)    # melhor se pede <= que paga
    extra_score = min(n_extra, 3) / 3.0
    fit_score = (
        0.50 * match_ratio
        + 0.22 * exp_score
        + 0.16 * salary_score
        + 0.12 * extra_score
        + RNG.normal(0, 0.06)                          # ruído -> fronteira não trivial
    )
    fit = int(fit_score > 0.55)

    rows.append({
        "role": role_name,
        "seniority": seniority,
        "seniority_level": sen_level,
        "workplace": workplace,
        "loc_factor": loc_factor,
        "required_exp": required_exp,
        "candidate_exp": candidate_exp,
        "exp_gap": exp_gap,
        "n_required": n_required,
        "n_matched": n_matched,
        "n_missing": n_missing,
        "match_ratio": round(match_ratio, 4),
        "n_extra_skills": n_extra,
        "avg_skill_demand": round(avg_skill_demand, 4),
        "salary_expected": salary_expected,
        "salary_gap_ratio": round(salary_gap_ratio, 4),
        "workplace_match": workplace_match,
        "job_salary": job_salary,     # alvo regressão
        "fit": fit,                   # alvo classificação
    })

df = pd.DataFrame(rows)
out = "dataset.csv"
df.to_csv(out, index=False)
print(f"Dataset gerado: {out}  ({len(df)} linhas)")
print(f"Distribuicao Fit/No-Fit: {df['fit'].value_counts().to_dict()}")
print(f"Salario medio das vagas: R$ {df['job_salary'].mean():.2f}")
