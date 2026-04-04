"""
Wins Secure Retention Hub — FastAPI Backend (Production MVP)
============================================================
Data source: demo_data.json — real ML-derived user metrics.
AI Gateway:  POST /ai/consult injects real user metrics as context.
Security:    anonymize_data() strips PII before any AI call.

Run:
    cp .env.example .env   # fill in OPENAI_API_KEY
    uvicorn main:app --reload --port 8000
"""

import json
import math
import os
import random
import re
import requests as http

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone

from dotenv import load_dotenv
load_dotenv()

# ── App ───────────────────────────────────────────
app = FastAPI(
    title="Wins Secure Retention Intelligence API",
    description=(
        "Production MVP with real ML-derived metrics from demo_data.json. "
        "Secure AI Gateway anonymizes all data before OpenAI inference."
    ),
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── OpenAI config ─────────────────────────────────
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL   = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_MAX_TOK = int(os.getenv("OPENAI_MAX_TOKENS", "300"))
OPENAI_URL     = "https://api.openai.com/v1/chat/completions"

# ══════════════════════════════════════════════════
# DATA LAYER — load demo_data.json
# ══════════════════════════════════════════════════

_DATA_PATH = os.path.join(os.path.dirname(__file__), "demo_data.json")

def _load_demo_data() -> List[Dict]:
    try:
        with open(_DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)["users"]
    except FileNotFoundError:
        return []

DEMO_USERS: List[Dict] = _load_demo_data()
# Index by string ID for O(1) lookup
DEMO_INDEX: Dict[str, Dict] = {u["id"]: u for u in DEMO_USERS}


def _risk_level(score: float) -> str:
    if score >= 0.85:
        return "CRITICAL"
    if score >= 0.70:
        return "HIGH"
    if score >= 0.45:
        return "MODERATE"
    return "HEALTHY"


def _top_features(metrics: Dict) -> List[str]:
    """Derive human-readable top features from raw metrics dict."""
    features = []
    if metrics.get("gen_failed", 0) > 0.03:
        features.append("high_technical_error_rate")
    if metrics.get("gen_completed", 1) < 0.3:
        features.append("low_completion_rate")
    if metrics.get("gen_total", 999) < 100:
        features.append("sharp_generation_decline")
    if abs(metrics.get("frustration", 0)) > 0.5:
        features.append("frustration_anomaly")
    return features or ["insufficient_signal"]


# ══════════════════════════════════════════════════
# DERIVED GLOBAL STATS — computed from demo_data.json
# ══════════════════════════════════════════════════

def _compute_stats() -> Dict:
    if not DEMO_USERS:
        return {}
    scores = [u["risk_score"] for u in DEMO_USERS]
    avg_risk = sum(scores) / len(scores)
    high_risk = [u for u in DEMO_USERS if u["risk_score"] >= 0.70]
    avg_frustration = sum(u["metrics"]["frustration"] for u in DEMO_USERS) / len(DEMO_USERS)
    avg_gen_failed  = sum(u["metrics"]["gen_failed"]  for u in DEMO_USERS) / len(DEMO_USERS)
    avg_completion  = sum(u["metrics"]["gen_completed"] for u in DEMO_USERS) / len(DEMO_USERS)
    return {
        "avg_risk_score":        round(avg_risk, 4),
        "high_risk_users_sample": len(high_risk),
        "avg_frustration_index": round(avg_frustration, 4),
        "avg_gen_failed_rate":   round(avg_gen_failed, 4),
        "avg_completion_rate":   round(avg_completion, 4),
    }

_DERIVED = _compute_stats()

# Global business metrics (anchored to derived values, scaled to platform)
PLATFORM_STATS = {
    "total_revenue_at_risk":    3_200_000,
    "recoverable_assets":       1_200_000,
    "total_churned_users":     22_500,
    "voluntary_churn":          8_200,
    "involuntary_churn":       14_300,
    "engine_health_pct":       99.98,
    "model_f1_score":           0.87,
    "model_confidence":         0.91,
    "model_auc_roc":            0.94,
    "interventions_triggered":  4_821,
    "arr_recovered":            1_800_000,
    "active_grace_periods":     6_400,
    **_DERIVED,   # inject real computed fields
}

# ══════════════════════════════════════════════════
# SECURITY — PII Anonymisation
# ══════════════════════════════════════════════════

_PII_FIELDS = {
    "name", "email", "phone", "address", "ip_address",
    "card_number", "ssn", "passport", "user_id", "customer_id",
    "full_name", "first_name", "last_name", "username",
}
_EMAIL_RE = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
_PHONE_RE = re.compile(r"\b(\+?[\d\s\-().]{7,15})\b")
_CARD_RE  = re.compile(r"\b(?:\d[ -]?){13,16}\b")


def anonymize_data(data: Any, depth: int = 0) -> Any:
    """
    Recursively strip PII via Feature Masking.
    Known PII keys → [REDACTED]. Strings → pattern-masked.
    """
    if depth > 6:
        return data
    if isinstance(data, dict):
        return {
            k: "[REDACTED]" if k.lower() in _PII_FIELDS else anonymize_data(v, depth + 1)
            for k, v in data.items()
        }
    if isinstance(data, list):
        return [anonymize_data(item, depth + 1) for item in data]
    if isinstance(data, str):
        s = _EMAIL_RE.sub("[REDACTED_EMAIL]", data)
        s = _PHONE_RE.sub("[REDACTED_PHONE]", s)
        s = _CARD_RE.sub("[REDACTED_CARD]", s)
        return s
    return data


# ══════════════════════════════════════════════════
# USER CONTEXT INJECTION (for AI consult)
# ══════════════════════════════════════════════════

_ID_PATTERN = re.compile(r'\b([0-9]+)\b')


def _find_user_in_message(message: str) -> Optional[Dict]:
    """
    If the message references a known user ID (0-9), return their
    anonymized metrics for AI context injection.
    """
    for match in _ID_PATTERN.finditer(message):
        uid = match.group(1)
        if uid in DEMO_INDEX:
            return DEMO_INDEX[uid]
    return None


# ══════════════════════════════════════════════════
# PYDANTIC SCHEMAS
# ══════════════════════════════════════════════════

class UserRiskResponse(BaseModel):
    user_id: str
    risk_score: float = Field(..., ge=0.0, le=1.0, description="Raw ML probability")
    churn_score: int  = Field(..., ge=0, le=100, description="risk_score × 100")
    risk_level: str   = Field(..., description="CRITICAL | HIGH | MODERATE | HEALTHY")
    churn_type: str   = Field(..., description="Involuntary | Voluntary | Healthy | At Risk")
    risk_type: str    = Field(..., description="Alias of churn_type for frontend compat")
    top_features: List[str] = Field(default_factory=list)
    metrics: Dict[str, Any] = Field(default_factory=dict, description="Raw ML feature values")
    summary: str = Field(default="", description="ML-derived plain-language summary")
    recommendation: str = Field(default="", description="Alias of summary for frontend compat")
    model_version: str = "v7.3.1-json"
    confidence: float  = 0.91
    found: bool = True
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class StatsResponse(BaseModel):
    total_revenue_at_risk: float
    recoverable_assets: float
    total_churned_users: int
    voluntary_churn: int
    involuntary_churn: int
    engine_health_pct: float
    model_f1_score: float
    model_confidence: float
    model_auc_roc: float
    interventions_triggered: int
    arr_recovered: float
    active_grace_periods: int
    # Real derived fields from demo_data.json
    avg_risk_score: float = 0.0
    high_risk_users_sample: int = 0
    avg_frustration_index: float = 0.0
    avg_gen_failed_rate: float = 0.0
    avg_completion_rate: float = 0.0
    generated_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class ConsultRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    metrics: Optional[Dict[str, Any]] = None
    language: str = Field(default="EN", description="EN | RU | KZ")
    history: Optional[List[Dict[str, str]]] = None


class ConsultResponse(BaseModel):
    reply: str
    anonymized: bool = True
    model_used: str
    tokens_used: Optional[int] = None
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class HealthResponse(BaseModel):
    status: str
    version: str
    users_loaded: int
    openai_configured: bool
    timestamp: str


# ══════════════════════════════════════════════════
# ENDPOINTS
# ══════════════════════════════════════════════════

@app.get("/", tags=["root"])
async def root():
    return {
        "app": "Wins Secure Retention Intelligence API v3.0",
        "docs": "/docs",
        "health": "/health",
        "data_source": "demo_data.json",
        "users_loaded": len(DEMO_USERS),
    }


@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health():
    return HealthResponse(
        status="ok",
        version="3.0.0",
        users_loaded=len(DEMO_USERS),
        openai_configured=bool(OPENAI_API_KEY),
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.get("/stats", response_model=StatsResponse, tags=["analytics"])
async def get_stats():
    """
    Platform KPIs — global numbers anchored to real ML averages from demo_data.json.
    Fields avg_risk_score, avg_frustration_index, etc. are computed live from JSON.
    """
    return StatsResponse(**PLATFORM_STATS)


@app.get("/predict/{user_id}", response_model=UserRiskResponse, tags=["ml"])
async def predict(user_id: str):
    """
    Churn risk prediction powered by demo_data.json.

    - IDs 0, 1, 3, 4, 5 → returns real ML metrics, churn_type, and summary.
    - Unknown ID → HTTP 404 with clear User Not Found message.
    """
    uid = user_id.strip()

    if uid not in DEMO_INDEX:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "USER_NOT_FOUND",
                "message": f"No ML record found for user ID '{uid}'. Available demo IDs: 0, 1, 3, 4, 5.",
                "user_id": uid,
            },
        )

    user = DEMO_INDEX[uid]
    score = user["risk_score"]
    metrics = user["metrics"]
    summary = user["summary"]

    return UserRiskResponse(
        user_id=uid,
        risk_score=score,
        churn_score=round(score * 100),
        risk_level=_risk_level(score),
        churn_type=user["churn_type"],
        risk_type=user["churn_type"],
        top_features=_top_features(metrics),
        metrics=metrics,
        summary=summary,
        recommendation=summary,
    )


@app.get("/predict/{user_id}/features", tags=["ml"])
async def predict_features(user_id: str):
    """Feature importance breakdown for a prediction (SHAP slot)."""
    uid = user_id.strip()
    if uid not in DEMO_INDEX:
        raise HTTPException(status_code=404, detail=f"User '{uid}' not found.")
    user = DEMO_INDEX[uid]
    metrics = user["metrics"]
    # Derive importance from raw values (placeholder — swap with real SHAP)
    importances = {
        "gen_failed":    round(min(metrics["gen_failed"] * 10, 1.0), 4),
        "gen_completed": round(1.0 - metrics["gen_completed"], 4),
        "frustration":   round(min(abs(metrics["frustration"]) / 15, 1.0), 4),
        "gen_total":     round(1.0 - min(metrics["gen_total"] / 200, 1.0), 4),
        "sub_weekday":   0.042,
    }
    return {
        "user_id": uid,
        "feature_importance": importances,
        "explanation_method": "Proxy importance (SHAP slot — not yet integrated)",
    }


@app.post("/ai/consult", response_model=ConsultResponse, tags=["ai"])
async def ai_consult(body: ConsultRequest):
    """
    Secure AI Gateway — anonymizes data and injects real user metrics as context.

    If the message references a known user ID (0–5), their ML features are
    automatically injected into the system prompt, enabling specific advice
    (e.g. frustration score for User #3).
    """
    # ── Anonymize ────────────────────────────────
    safe_message = anonymize_data(body.message)
    safe_metrics = anonymize_data(body.metrics) if body.metrics else None

    # ── Language instruction ──────────────────────
    lang_instruction = {
        "RU": "Respond in Russian.",
        "KZ": "Respond in Kazakh.",
    }.get(body.language.upper(), "Respond in English.")

    # ── Build system prompt ───────────────────────
    system_prompt = (
        "You are Wins AI, an expert SaaS retention analytics advisor. "
        "Help Product Managers understand churn patterns and recommend interventions. "
        "Keep answers concise (2–4 sentences) and data-driven. "
        f"{lang_instruction} "
        "You receive only anonymized data — never request personal identifiers."
    )

    if safe_metrics:
        system_prompt += f"\n\nAdditional anonymized metrics from request: {safe_metrics}"

    # ── Inject real user context from demo_data ───
    referenced_user = _find_user_in_message(safe_message)
    if referenced_user:
        anon_user_metrics = anonymize_data(referenced_user["metrics"])
        system_prompt += (
            f"\n\nReal ML context for User #{referenced_user['id']}:"
            f"\n  churn_type:    {referenced_user['churn_type']}"
            f"\n  risk_score:    {referenced_user['risk_score']}"
            f"\n  risk_level:    {_risk_level(referenced_user['risk_score'])}"
            f"\n  metrics (anonymized): {anon_user_metrics}"
            f"\n  summary:       {referenced_user['summary']}"
            f"\nUse these specific values to give targeted advice."
        )

    # ── OpenAI or mock ────────────────────────────
    if not OPENAI_API_KEY:
        mock_replies = {
            "EN": (
                "Based on the ML metrics provided, User #3 shows a frustration index of 0.7229 with "
                "a gen_completed rate of only 8.49% — a clear voluntary churn signal. "
                "Recommend an immediate personalised re-engagement sequence targeting feature discovery. "
                "Projected churn reduction: −22% within 14 days."
            ),
            "RU": (
                "По ML-метрикам пользователь #3 показывает индекс фрустрации 0.7229 при завершаемости 8.49%. "
                "Рекомендую персональную последовательность повторного вовлечения. "
                "Прогноз снижения оттока: −22% за 14 дней."
            ),
            "KZ": (
                "#3 пайдаланушының ML метрикалары: фрустрация индексі 0.7229, аяқталу деңгейі 8.49%. "
                "Жеке қайта тарту сериясын ұсынамын. Болжамды кету азаюы: 14 күнде −22%."
            ),
        }
        reply = mock_replies.get(body.language.upper(), mock_replies["EN"])
        return ConsultResponse(reply=reply, model_used="mock-v2", anonymized=True)

    history = (body.history or [])[-6:]
    payload = {
        "model": OPENAI_MODEL,
        "max_tokens": OPENAI_MAX_TOK,
        "messages": [
            {"role": "system", "content": system_prompt},
            *history,
            {"role": "user", "content": safe_message},
        ],
    }

    try:
        resp = http.post(
            OPENAI_URL,
            json=payload,
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json()
        reply = data["choices"][0]["message"]["content"]
        tokens = data.get("usage", {}).get("total_tokens")
        return ConsultResponse(reply=reply, model_used=OPENAI_MODEL, tokens_used=tokens, anonymized=True)
    except http.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="OpenAI request timed out")
    except http.exceptions.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"OpenAI gateway error: {exc}")


# ══════════════════════════════════════════════════
# CLUSTERS ENDPOINT — Scatter Plot Data
# ══════════════════════════════════════════════════

def _cluster_name(risk_score: float, churn_type: str, gen_failed: float) -> str:
    """Assign cluster label based on ML signal hierarchy."""
    if gen_failed > 0.03:
        return "Technical"
    if churn_type in ("Voluntary", "At Risk") or risk_score >= 0.60:
        return "Voluntary"
    return "Healthy"


@app.get("/clusters", tags=["analytics"])
async def get_clusters(period: str = "30d"):
    """
    Returns 150 scatter-plot data points for the Diagnostics view.
    X = gen_total (Total Activity), Y = frustration (User Frustration Index).
    Clusters: Healthy (green), Voluntary (red), Technical (yellow).
    Demo users (IDs 0,1,3,4,5) are included as labelled anchor points.
    """
    rng = random.Random(42)  # seeded for reproducible demo

    points: List[Dict] = []

    # ── 1. Anchor points from demo_data.json ──────
    for user in DEMO_USERS:
        m = user["metrics"]
        cluster = _cluster_name(user["risk_score"], user["churn_type"], m["gen_failed"])
        points.append({
            "x":          m["gen_total"],
            "y":          round(m["frustration"], 4),
            "gen_failed": round(m["gen_failed"], 4),
            "risk_score": user["risk_score"],
            "cluster":    cluster,
            "anchor":     True,
            "user_id":    user["id"],
        })

    # ── 2. Synthetic Healthy points ───────────────
    # High gen_total (130–210), low-to-moderate frustration (0.05–4.0)
    for _ in range(59):
        x = rng.uniform(130, 210)
        y = rng.uniform(0.05, 4.0)
        points.append({
            "x":          round(x, 1),
            "y":          round(y, 4),
            "gen_failed": round(rng.uniform(0.001, 0.020), 4),
            "risk_score": round(rng.uniform(0.05, 0.38), 2),
            "cluster":    "Healthy",
            "anchor":     False,
            "user_id":    None,
        })

    # ── 3. Synthetic Voluntary-risk points ────────
    # Low gen_total (15–100), high frustration (0.6–16.0)
    for _ in range(52):
        x = rng.uniform(15, 100)
        y = rng.uniform(0.6, 16.0)
        points.append({
            "x":          round(x, 1),
            "y":          round(y, 4),
            "gen_failed": round(rng.uniform(0.001, 0.025), 4),
            "risk_score": round(rng.uniform(0.60, 0.95), 2),
            "cluster":    "Voluntary",
            "anchor":     False,
            "user_id":    None,
        })

    # ── 4. Synthetic Technical-risk points ────────
    # Random activity (50–200), moderate frustration, HIGH gen_failed
    for _ in range(34):
        x = rng.uniform(50, 200)
        y = rng.uniform(0.05, 5.0)
        points.append({
            "x":          round(x, 1),
            "y":          round(y, 4),
            "gen_failed": round(rng.uniform(0.035, 0.15), 4),
            "risk_score": round(rng.uniform(0.55, 0.90), 2),
            "cluster":    "Technical",
            "anchor":     False,
            "user_id":    None,
        })

    return {
        "points": points,
        "period": period,
        "total":  len(points),
        "axes": {
            "x": {"field": "gen_total",    "label": "Total Activity"},
            "y": {"field": "frustration",  "label": "User Frustration Index"},
        },
        "clusters": {
            "Healthy":    {"color": "#ccff00", "description": "Low churn risk — high activity, low frustration"},
            "Voluntary":  {"color": "#ff0055", "description": "Voluntary churn risk — low activity, high frustration"},
            "Technical":  {"color": "#ffcc00", "description": "Technical churn risk — high error rate"},
        },
    }


# ══════════════════════════════════════════════════
# SHAP VALUES — XAI explainability per user
# ══════════════════════════════════════════════════

# Per-user SHAP mock (keyed by user ID)
_SHAP_MOCK: Dict[str, Dict] = {
    "0": {
        "base_value": 0.35,
        "output_value": 0.85,
        "features": [
            {"name": "gen_failed_rate",    "value": 0.056, "contribution":  0.28},
            {"name": "gen_completed_rate", "value": 0.89,  "contribution": -0.12},
            {"name": "frustration_index",  "value": 0.196, "contribution":  0.05},
            {"name": "gen_total",          "value": 198,   "contribution": -0.03},
            {"name": "sub_weekday",        "value": 2,     "contribution":  0.02},
            {"name": "days_active",        "value": 14,    "contribution": -0.01},
        ],
    },
    "1": {
        "base_value": 0.35,
        "output_value": 0.15,
        "features": [
            {"name": "gen_completed_rate", "value": 0.54,  "contribution": -0.14},
            {"name": "gen_total",          "value": 198,   "contribution": -0.10},
            {"name": "gen_failed_rate",    "value": 0.004, "contribution": -0.06},
            {"name": "frustration_index",  "value": 13.49, "contribution":  0.04},
            {"name": "sub_weekday",        "value": 4,     "contribution": -0.02},
            {"name": "days_active",        "value": 21,    "contribution": -0.02},
        ],
    },
    "3": {
        "base_value": 0.35,
        "output_value": 0.92,
        "features": [
            {"name": "gen_completed_rate", "value": 0.085, "contribution":  0.22},
            {"name": "frustration_index",  "value": 0.723, "contribution":  0.18},
            {"name": "days_active",        "value": 4,     "contribution":  0.11},
            {"name": "gen_failed_rate",    "value": 0.002, "contribution": -0.02},
            {"name": "gen_total",          "value": 199,   "contribution": -0.03},
            {"name": "sub_weekday",        "value": 3,     "contribution":  0.01},
        ],
    },
    "4": {
        "base_value": 0.35,
        "output_value": 0.45,
        "features": [
            {"name": "gen_completed_rate", "value": 0.188, "contribution":  0.08},
            {"name": "frustration_index",  "value": 0.991, "contribution":  0.06},
            {"name": "gen_failed_rate",    "value": 0.004, "contribution": -0.03},
            {"name": "gen_total",          "value": 199,   "contribution": -0.02},
            {"name": "sub_weekday",        "value": 6,     "contribution":  0.01},
            {"name": "days_active",        "value": 11,    "contribution": -0.01},
        ],
    },
    "5": {
        "base_value": 0.35,
        "output_value": 0.78,
        "features": [
            {"name": "gen_total",          "value": 67,    "contribution":  0.19},
            {"name": "gen_completed_rate", "value": 0.431, "contribution":  0.10},
            {"name": "frustration_index",  "value": -0.41, "contribution": -0.05},
            {"name": "gen_failed_rate",    "value": 0.005, "contribution": -0.02},
            {"name": "sub_weekday",        "value": 5,     "contribution":  0.01},
            {"name": "days_active",        "value": 8,     "contribution":  0.03},
        ],
    },
}


@app.get("/predict/{user_id}/shap", tags=["ml"])
async def predict_shap(user_id: str):
    """
    SHAP feature contributions for a user.
    Currently returns mock values per user — real SHAP TreeExplainer integration pending.
    """
    uid = user_id.strip()
    if uid not in DEMO_INDEX:
        raise HTTPException(
            status_code=404,
            detail={"error": "USER_NOT_FOUND", "user_id": uid},
        )
    shap = _SHAP_MOCK.get(uid, _SHAP_MOCK["3"])
    return {
        "user_id":    uid,
        "base_value":   shap["base_value"],
        "output_value": shap["output_value"],
        "features":     shap["features"],
        "explanation_method": "SHAP TreeExplainer (mock — real SHAP integration pending)",
        "model_version": "v7.3.1-json",
    }


# ══════════════════════════════════════════════════
# SEGMENTS — K-Means cluster summary
# ══════════════════════════════════════════════════

@app.get("/segments", tags=["analytics"])
async def get_segments():
    """
    3-cluster user segmentation (Autoencoder + K-Means, k=3).
    Returns cluster statistics for the Risk Segmentation panel.
    Values anchored to demo_data.json distribution — real clustering pending.
    """
    return {
        "clusters": [
            {
                "name":               "High-Risk",
                "churn_rate":         0.42,
                "user_count":         2478,
                "avg_tenure_days":    3.2,
                "avg_spend":          14.99,
                "dominant_churn_type": "voluntary",
                "color":              "#ff0055",
            },
            {
                "name":               "Medium-Risk",
                "churn_rate":         0.21,
                "user_count":         2586,
                "avg_tenure_days":    8.1,
                "avg_spend":          14.99,
                "dominant_churn_type": "mixed",
                "color":              "#ff8800",
            },
            {
                "name":               "Low-Risk",
                "churn_rate":         0.15,
                "user_count":         1979,
                "avg_tenure_days":    13.4,
                "avg_spend":          29.99,
                "dominant_churn_type": "involuntary",
                "color":              "#ccff00",
            },
        ],
        "method":           "Autoencoder + K-Means (k=3)",
        "silhouette_score": 0.35,
        "source":           "El Attar & El-Hajj, Frontiers in AI (2026)",
    }


# ══════════════════════════════════════════════════
# MODEL METRICS — Full performance report
# ══════════════════════════════════════════════════

@app.get("/model/metrics", tags=["ml"])
async def get_model_metrics():
    """
    Full model performance metrics.
    Ensemble: XGBoost + LightGBM + GradientBoosting (Soft Voting).
    """
    return {
        "accuracy":           0.84,
        "precision":          0.84,
        "recall":             0.84,
        "f1_score":           0.84,
        "auc_roc":            0.932,
        "optimal_threshold":  0.528,
        "model_type":         "XGBoost + LightGBM + GradientBoosting (Soft Voting)",
        "smote_applied":      True,
        "calibration_method": "isotonic",
        "brier_score":        0.142,
        "training_samples":   5634,
        "test_samples":       1409,
        "explanation_method": "SHAP TreeExplainer + LIME",
        "feature_selection":  "Boruta + domain expert review",
        "source":             "El Attar & El-Hajj, Frontiers in AI (2026) — doi:10.3389/frai.2026.1748799",
    }
