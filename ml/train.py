"""
Treina, COMPARA e seleciona os modelos do JobMatch AI a partir de ml/dataset.csv.

  1) Classificacao (Fit x No Fit)
     Candidatos: LogisticRegression, RandomForestClassifier, GradientBoostingClassifier
     Selecao por F1 (validacao cruzada 5-fold). Metricas: Acuracia, Precisao, Recall, F1, ROC-AUC.
  2) Regressao (Salario)
     Candidatos: LinearRegression, RandomForestRegressor, GradientBoostingRegressor
     Selecao por R2 (CV 5-fold). Metricas: MAE, RMSE, R2, MAPE.

Salva: modelos campeoes (.joblib), graficos (ml/plots/*.png) e ml/metrics.json
"""

import json
import os
import numpy as np
import pandas as pd
import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import (
    RandomForestClassifier, GradientBoostingClassifier,
    RandomForestRegressor, GradientBoostingRegressor,
)
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
    confusion_matrix, ConfusionMatrixDisplay, RocCurveDisplay,
    mean_absolute_error, root_mean_squared_error, r2_score,
    mean_absolute_percentage_error,
)

os.makedirs("plots", exist_ok=True)
df = pd.read_csv("dataset.csv")
metrics = {}

# ============================================================
# 1) CLASSIFICACAO  -  Fit x No Fit
# ============================================================
CLASS_FEATURES = [
    "match_ratio", "n_matched", "n_missing", "exp_gap",
    "salary_gap_ratio", "workplace_match", "n_extra_skills",
]
Xc, yc = df[CLASS_FEATURES], df["fit"]
Xc_tr, Xc_te, yc_tr, yc_te = train_test_split(Xc, yc, test_size=0.2, random_state=42, stratify=yc)

clf_candidates = {
    "LogisticRegression": make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)),
    "RandomForestClassifier": RandomForestClassifier(n_estimators=300, max_depth=12, random_state=42, n_jobs=-1),
    "GradientBoostingClassifier": GradientBoostingClassifier(n_estimators=300, max_depth=3, learning_rate=0.05, random_state=42),
}

clf_compare = {}
best_clf_name, best_clf, best_cv = None, None, -1.0
for name, model in clf_candidates.items():
    cv = cross_val_score(model, Xc_tr, yc_tr, cv=5, scoring="f1").mean()
    model.fit(Xc_tr, yc_tr)
    pred = model.predict(Xc_te)
    proba = model.predict_proba(Xc_te)[:, 1]
    clf_compare[name] = {
        "f1_cv5": round(float(cv), 4),
        "f1_teste": round(float(f1_score(yc_te, pred)), 4),
        "acuracia": round(float(accuracy_score(yc_te, pred)), 4),
        "roc_auc": round(float(roc_auc_score(yc_te, proba)), 4),
    }
    if cv > best_cv:
        best_cv, best_clf_name, best_clf = cv, name, model

yc_pred = best_clf.predict(Xc_te)
yc_proba = best_clf.predict_proba(Xc_te)[:, 1]
metrics["classificacao"] = {
    "modelo_escolhido": best_clf_name,
    "criterio_selecao": "maior F1 em validacao cruzada (5-fold)",
    "acuracia": round(float(accuracy_score(yc_te, yc_pred)), 4),
    "precisao": round(float(precision_score(yc_te, yc_pred)), 4),
    "recall": round(float(recall_score(yc_te, yc_pred)), 4),
    "f1_score": round(float(f1_score(yc_te, yc_pred)), 4),
    "roc_auc": round(float(roc_auc_score(yc_te, yc_proba)), 4),
    "f1_cv5_media": round(float(best_cv), 4),
    "matriz_confusao": confusion_matrix(yc_te, yc_pred).tolist(),
    "comparacao_modelos": clf_compare,
    "n_treino": int(len(Xc_tr)), "n_teste": int(len(Xc_te)),
}

ConfusionMatrixDisplay(confusion_matrix(yc_te, yc_pred), display_labels=["No Fit", "Fit"]).plot(cmap="Purples", colorbar=False)
plt.title(f"Matriz de Confusao - {best_clf_name}")
plt.tight_layout(); plt.savefig("plots/confusion_matrix.png", dpi=130); plt.close()

RocCurveDisplay.from_predictions(yc_te, yc_proba)
plt.title(f"Curva ROC - {best_clf_name}")
plt.tight_layout(); plt.savefig("plots/roc_curve.png", dpi=130); plt.close()

joblib.dump({"model": best_clf, "features": CLASS_FEATURES}, "model_fit_classifier.joblib")

# ============================================================
# 2) REGRESSAO  -  Salario da vaga
# ============================================================
REG_FEATURES = ["seniority_level", "required_exp", "n_required", "avg_skill_demand", "loc_factor"]
Xr, yr = df[REG_FEATURES], df["job_salary"]
Xr_tr, Xr_te, yr_tr, yr_te = train_test_split(Xr, yr, test_size=0.2, random_state=42)

reg_candidates = {
    "LinearRegression": LinearRegression(),
    "RandomForestRegressor": RandomForestRegressor(n_estimators=400, max_depth=10, random_state=42, n_jobs=-1),
    "GradientBoostingRegressor": GradientBoostingRegressor(n_estimators=400, max_depth=3, learning_rate=0.05, random_state=42),
}

reg_compare = {}
best_reg_name, best_reg, best_r2 = None, None, -1e9
for name, model in reg_candidates.items():
    cv = cross_val_score(model, Xr_tr, yr_tr, cv=5, scoring="r2").mean()
    model.fit(Xr_tr, yr_tr)
    pred = model.predict(Xr_te)
    reg_compare[name] = {
        "r2_cv5": round(float(cv), 4),
        "r2_teste": round(float(r2_score(yr_te, pred)), 4),
        "mae_reais": round(float(mean_absolute_error(yr_te, pred)), 2),
        "rmse_reais": round(float(root_mean_squared_error(yr_te, pred)), 2),
    }
    if cv > best_r2:
        best_r2, best_reg_name, best_reg = cv, name, model

yr_pred = best_reg.predict(Xr_te)
metrics["regressao"] = {
    "modelo_escolhido": best_reg_name,
    "criterio_selecao": "maior R2 em validacao cruzada (5-fold)",
    "mae_reais": round(float(mean_absolute_error(yr_te, yr_pred)), 2),
    "rmse_reais": round(float(root_mean_squared_error(yr_te, yr_pred)), 2),
    "r2": round(float(r2_score(yr_te, yr_pred)), 4),
    "mape_pct": round(float(mean_absolute_percentage_error(yr_te, yr_pred) * 100), 2),
    "r2_cv5_media": round(float(best_r2), 4),
    "comparacao_modelos": reg_compare,
    "n_treino": int(len(Xr_tr)), "n_teste": int(len(Xr_te)),
}

plt.figure(figsize=(6, 6))
plt.scatter(yr_te, yr_pred, alpha=0.3, s=12, color="#7c3aed")
lims = [min(yr_te.min(), yr_pred.min()), max(yr_te.max(), yr_pred.max())]
plt.plot(lims, lims, "--", color="#06b6d4")
plt.xlabel("Salario real (R$)"); plt.ylabel("Salario previsto (R$)")
plt.title(f"Previsto vs Real - {best_reg_name}")
plt.tight_layout(); plt.savefig("plots/pred_vs_real.png", dpi=130); plt.close()

resid = yr_te - yr_pred
plt.figure(figsize=(7, 4))
plt.scatter(yr_pred, resid, alpha=0.3, s=12, color="#7c3aed")
plt.axhline(0, color="#06b6d4", ls="--")
plt.xlabel("Salario previsto (R$)"); plt.ylabel("Residuo (R$)")
plt.title("Residuos da Regressao")
plt.tight_layout(); plt.savefig("plots/residuals.png", dpi=130); plt.close()

joblib.dump({"model": best_reg, "features": REG_FEATURES}, "model_salary_regressor.joblib")

# ============================================================
# Relatorio
# ============================================================
with open("metrics.json", "w", encoding="utf-8") as f:
    json.dump(metrics, f, indent=2, ensure_ascii=False)

c, r = metrics["classificacao"], metrics["regressao"]
print("\n============ CLASSIFICACAO (Fit x No Fit) ============")
print(f"  Modelo escolhido : {c['modelo_escolhido']}")
for n, m in c["comparacao_modelos"].items():
    print(f"    - {n:<28} F1cv={m['f1_cv5']:.4f}  F1teste={m['f1_teste']:.4f}  AUC={m['roc_auc']:.4f}")
print(f"  Acuracia={c['acuracia']:.4f}  Precisao={c['precisao']:.4f}  Recall={c['recall']:.4f}  F1={c['f1_score']:.4f}  ROC-AUC={c['roc_auc']:.4f}")
print(f"  Matriz de confusao: {c['matriz_confusao']}")

print("\n============ REGRESSAO (Salario) ============")
print(f"  Modelo escolhido : {r['modelo_escolhido']}")
for n, m in r["comparacao_modelos"].items():
    print(f"    - {n:<28} R2cv={m['r2_cv5']:.4f}  R2teste={m['r2_teste']:.4f}  MAE=R${m['mae_reais']:.0f}")
print(f"  MAE=R${r['mae_reais']:.2f}  RMSE=R${r['rmse_reais']:.2f}  R2={r['r2']:.4f}  MAPE={r['mape_pct']:.2f}%")
print("\nArtefatos: model_fit_classifier.joblib, model_salary_regressor.joblib, metrics.json, plots/*.png")
