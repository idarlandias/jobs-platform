# JobMatch AI — Modelos de Machine Learning

Módulo de ML do JobSpark com **dois modelos treinados e avaliados** que sustentam o JobMatch AI:

| Tarefa | Tipo | Alvo | Modelo escolhido |
|--------|------|------|------------------|
| **Fit x No Fit** | Classificação binária | `fit` (0/1) | **Regressão Logística** |
| **Salário da vaga** | Regressão | `job_salary` (R$) | **Gradient Boosting Regressor** |

Os modelos são selecionados por **validação cruzada (5-fold)** comparando 3 algoritmos candidatos em cada tarefa — o melhor é salvo em `.joblib`.

---

## Pipeline

```
generate_dataset.py  →  dataset.csv  →  train.py  →  modelos .joblib + metrics.json + plots/
```

### 1. Dataset (`generate_dataset.py`)
Gera **3.000 pares (candidato × vaga)** sintéticos, porém realistas e reproduzíveis (seed fixa). A partir de 6 arquétipos de vaga, 21 skills com peso de mercado, 3 níveis de senioridade e 3 modalidades:

- **Alvo de classificação `fit`**: combinação ponderada de aderência de skills (`match_ratio`), adequação de experiência, alinhamento salarial e skills extras + ruído gaussiano (fronteira não trivial).
- **Alvo de regressão `job_salary`**: função de senioridade, base do cargo, demanda média das skills e fator de localização + ruído.

### 2. Treino e avaliação (`train.py`)
- Split **treino/teste 80/20** (estratificado na classificação).
- Compara 3 modelos por tarefa, escolhe o melhor por CV, avalia no conjunto de teste.
- Salva modelos, `metrics.json` e gráficos em `plots/`.

---

## Features

**Classificação (Fit):** `match_ratio`, `n_matched`, `n_missing`, `exp_gap`, `salary_gap_ratio`, `workplace_match`, `n_extra_skills`

**Regressão (Salário):** `seniority_level`, `required_exp`, `n_required`, `avg_skill_demand`, `loc_factor`

---

## Resultados (conjunto de teste)

### Classificação — Fit x No Fit  (Regressão Logística)
| Métrica | Valor |
|---------|-------|
| Acurácia | **0.918** |
| Precisão | **0.915** |
| Recall | **0.904** |
| **F1-Score** | **0.909** |
| ROC-AUC | **0.978** |
| Matriz de confusão | `[[305, 23], [26, 246]]` |

Comparação (F1 em CV): LogisticRegression **0.906** · GradientBoosting 0.899 · RandomForest 0.886

### Regressão — Salário  (Gradient Boosting)
| Métrica | Valor |
|---------|-------|
| **MAE** | **R$ 969,88** |
| **RMSE** | **R$ 1.284,10** |
| **R²** | **0.949** |
| MAPE | **5,86%** |

Comparação (R² em CV): GradientBoosting **0.949** · RandomForest 0.945 · LinearRegression 0.915

> Os números podem ser reproduzidos exatamente (seed=42).

---

## Como rodar

```bash
cd ml
python -m venv .venv && . .venv/Scripts/activate   # opcional
pip install -r requirements.txt
python generate_dataset.py
python train.py
```

Artefatos gerados: `dataset.csv`, `model_fit_classifier.joblib`, `model_salary_regressor.joblib`, `metrics.json`, `plots/{confusion_matrix,roc_curve,pred_vs_real,residuals}.png`.

---

## Como usar um modelo treinado

```python
import joblib, pandas as pd
clf = joblib.load("model_fit_classifier.joblib")
X = pd.DataFrame([{ "match_ratio":0.8,"n_matched":4,"n_missing":1,"exp_gap":2,
                    "salary_gap_ratio":-0.05,"workplace_match":1,"n_extra_skills":2 }])
print(clf["model"].predict(X[clf["features"]]))         # [1] = Fit
```

---

## Observação de arquitetura
Em produção o JobSpark usa **LLM (Groq) + embeddings (Google)** para gerar Fit, skills e salário em linguagem natural. Estes modelos scikit-learn são a **camada quantitativa treinada e auditável** (métricas reproduzíveis) que valida e pode complementar/substituir o LLM nessas duas tarefas — atendendo ao requisito de modelo treinado com avaliação formal.
