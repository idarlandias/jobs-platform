"""
JobSpark ML Service — serve os modelos treinados (scikit-learn) via HTTP.
Endpoints:
  GET  /health
  POST /predict/fit      -> classificação Fit x No Fit
  POST /predict/salary   -> regressão de salário (R$)
"""
import os
import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel

BASE = os.path.dirname(__file__)
clf = joblib.load(os.path.join(BASE, "model_fit_classifier.joblib"))
reg = joblib.load(os.path.join(BASE, "model_salary_regressor.joblib"))

app = FastAPI(title="JobSpark ML Service", version="1.0.0")


class FitInput(BaseModel):
    match_ratio: float
    n_matched: int
    n_missing: int
    exp_gap: int
    salary_gap_ratio: float
    workplace_match: int
    n_extra_skills: int


class SalaryInput(BaseModel):
    seniority_level: int
    required_exp: int
    n_required: int
    avg_skill_demand: float
    loc_factor: float


@app.get("/health")
def health():
    return {
        "status": "ok",
        "classifier": type(clf["model"]).__name__,
        "regressor": type(reg["model"]).__name__,
    }


@app.post("/predict/fit")
def predict_fit(inp: FitInput):
    X = pd.DataFrame([inp.model_dump()])[clf["features"]]
    proba = float(clf["model"].predict_proba(X)[0, 1])
    pred = int(proba >= 0.5)
    return {
        "fit": bool(pred),
        "classification": "Fit" if pred else "No Fit",
        "score": round(proba * 100, 1),
        "model": type(clf["model"]).__name__,
    }


@app.post("/predict/salary")
def predict_salary(inp: SalaryInput):
    X = pd.DataFrame([inp.model_dump()])[reg["features"]]
    value = float(reg["model"].predict(X)[0])
    return {
        "salary": round(value, 2),
        "model": type(reg["model"]).__name__,
    }
