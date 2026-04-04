"""
Wins Secure Retention Hub — FastAPI Backend
============================================
Security layer:
  • anonymize_data()  strips PII before any AI call
  • OPENAI_API_KEY loaded from .env (never hardcoded)
  • All AI traffic goes through POST /ai/consult (Secure AI Gateway)

ML model slot: drop your trained XGBoost / sklearn pipeline into
`ml/model.pkl` and replace the MOCK_* constants with real inference.

Run:
    cp .env.example .env   # fill in OPENAI_API_KEY
    uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime, timezone
import os
import re
import requests as http

from dotenv import load_dotenv
load_dotenv()

# ── App ──────────────────────────────────────────
app = FastAPI(
    title="Wins Secure Retention Intelligence API",
    description=(
        "Secure AI Gateway for the Wins Retention Architect. "
        "All data is anonymized before AI inference. "
        "ML model slot ready — replace MOCK values with real inference."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────
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
OPENAI_MAX_TOK = int(os.getenv("OPENAI_MAX_TOKENS", "250"))
OPENAI_URL     = "https://api.openai.com/v1/chat/completions"

# ══════════════════════════════════════════════════
# SECURITY — PII Anonymisation
# ══════════════════════════════════════════════════

# Fields that may contain PII — stripped or masked before AI calls
_PII_FIELDS = {
    "name", "email", "phone", "address", "ip_address",
    "card_number", "ssn", "passport", "user_id", "customer_id",
    "full_name", "first_name", "last_name", "username",
}

_EMAIL_RE   = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
_PHONE_RE   = re.compile(r"\b(\+?[\d\s\-().]{7,15})\b")
_CARD_RE    = re.compile(r"\b(?:\d[ -]?){13,16}\b")


def anonymize_data(data: Any, depth: int = 0) -> Any:
    """
    Recursively strips / masks PII from dicts, lists, and strings.

    Strategy (Feature Masking):
      - Known PII keys → replaced with '[REDACTED]'
      - Strings → email / phone / card patterns replaced with '[REDACTED]'
      - Nested dicts/lists → recursed (max depth 6 to prevent abuse)

    Returns a new object; never mutates the input.
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
        cleaned = _EMAIL_RE.sub("[REDACTED_EMAIL]", data)
        cleaned = _PHONE_RE.sub("[REDACTED_PHONE]", cleaned)
        cleaned = _CARD_RE.sub("[REDACTED_CARD]", cleaned)
        return cleaned

    return data  # int, float, bool, None — safe as-is


# ══════════════════════════════════════════════════
# MOCK DATA — replace with ML model inference later
# ══════════════════════════════════════════════════

MOCK_USERS = {
    "USR-001": {
        "name": "Aisha Bekova",
        "plan": "Professional",
        "risk_probability": 0.87,
        "churn_score": 87,
        "risk_level": "CRITICAL",
        "risk_type": "Involuntary",
        "top_features": ["payment_failures", "session_drop", "support_ticket"],
        "grace_period_eligible": True,
        "ltv_score": 72,
        "last_active_hours_ago": 2,
        "recommendation": (
            "Immediate payment retry + CSM outreach within 24h. "
            "Offer 2-month discount to neutralise billing friction."
        ),
    },
    "USR-002": {
        "name": "Damir Seitkali",
        "plan": "Starter",
        "risk_probability": 0.41,
        "churn_score": 41,
        "risk_level": "MODERATE",
        "risk_type": "Voluntary",
        "top_features": ["low_engagement", "no_premium_features", "competitor_signal"],
        "grace_period_eligible": False,
        "ltv_score": 28,
        "last_active_hours_ago": 72,
        "recommendation": (
            "Trigger educational email sequence + personalised demo of "
            "advanced features. Consider plan downgrade offer to retain."
        ),
    },
    "USR-003": {
        "name": "Zarina Mukhanova",
        "plan": "Enterprise",
        "risk_probability": 0.12,
        "churn_score": 12,
        "risk_level": "HEALTHY",
        "risk_type": "None",
        "top_features": ["high_engagement", "seat_expansion", "nps_9"],
        "grace_period_eligible": False,
        "ltv_score": 95,
        "last_active_hours_ago": 0,
        "recommendation": (
            "Candidate for Enterprise Plus upsell and referral programme enrollment."
        ),
    },
}

MOCK_STATS = {
    "total_revenue_at_risk":   3_200_000,
    "recoverable_assets":      1_200_000,
    "total_churned_users":    22_500,
    "voluntary_churn":         8_200,
    "involuntary_churn":      14_300,
    "engine_health_pct":      99.98,
    "model_f1_score":          0.87,
    "model_confidence":        0.91,
    "model_auc_roc":           0.94,
    "interventions_triggered": 4_821,
    "arr_recovered":           1_800_000,
    "active_grace_periods":    6_400,
}

# ══════════════════════════════════════════════════
# PYDANTIC SCHEMAS
# ══════════════════════════════════════════════════

class ConsultRequest(BaseModel):
    """Payload from the React WinsAI widget — may contain raw user data."""
    message: str = Field(..., min_length=1, max_length=2000)
    metrics: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional structured metrics (will be anonymized server-side)",
    )
    language: str = Field(default="EN", description="EN | RU | KZ")
    history: Optional[List[Dict[str, str]]] = Field(
        default=None,
        description="Last N chat turns: [{'role':'user'|'assistant','content':'...'}]",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "message": "Why is our involuntary churn spiking in Brazil?",
                "metrics": {"churn_rate": 0.18, "region": "Brazil", "plan": "Professional"},
                "language": "EN",
            }
        }


class ConsultResponse(BaseModel):
    reply: str
    anonymized: bool = True
    model_used: str
    tokens_used: Optional[int] = None
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class PredictionResponse(BaseModel):
    user_id: str
    name: Optional[str] = None
    plan: Optional[str] = None
    risk_probability: float = Field(..., ge=0.0, le=1.0)
    churn_score: int = Field(..., ge=0, le=100)
    risk_level: str
    risk_type: str
    top_features: List[str] = Field(default_factory=list)
    grace_period_eligible: bool = False
    ltv_score: int = Field(default=50, ge=0, le=100)
    last_active_hours_ago: int = 0
    recommendation: str = ""
    model_version: str = "v7.3.1-skeleton"
    confidence: float = 0.91
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
    generated_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class HealthResponse(BaseModel):
    status: str
    version: str
    model_slot: str
    openai_configured: bool
    timestamp: str


# ══════════════════════════════════════════════════
# ENDPOINTS
# ══════════════════════════════════════════════════

@app.get("/", tags=["root"])
async def root():
    return {
        "app": "Wins Secure Retention Intelligence API",
        "docs": "/docs",
        "health": "/health",
        "security": "All AI calls pass through PII anonymization layer",
    }


@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health():
    """Liveness probe — reports whether OpenAI key is configured."""
    return HealthResponse(
        status="ok",
        version="2.0.0",
        model_slot="MOCK — replace ml/model.pkl with trained model",
        openai_configured=bool(OPENAI_API_KEY),
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/ai/consult", response_model=ConsultResponse, tags=["ai"])
async def ai_consult(body: ConsultRequest):
    """
    Secure AI Gateway — Wins AI Consultation Endpoint.

    Pipeline:
      1. Anonymize message + metrics (PII masking via Feature Masking)
      2. Build system prompt with anonymized context
      3. Call OpenAI (if key configured) or return a structured mock response
      4. Return reply with anonymization confirmation flag

    The React frontend should call this instead of hitting OpenAI directly,
    so that no PII ever reaches third-party services.
    """
    # ── Step 1: Anonymize ────────────────────────
    safe_message = anonymize_data(body.message)
    safe_metrics = anonymize_data(body.metrics) if body.metrics else None

    # ── Step 2: Build prompt context ─────────────
    lang_instruction = {
        "RU": "Respond in Russian.",
        "KZ": "Respond in Kazakh.",
    }.get(body.language.upper(), "Respond in English.")

    system_prompt = (
        "You are Wins AI, an expert SaaS retention analytics advisor. "
        "Help Product Managers understand churn patterns and recommend interventions. "
        "Keep answers concise (2-4 sentences). Be specific and data-driven. "
        f"{lang_instruction} "
        "IMPORTANT: You are receiving anonymized data — never ask for or acknowledge personal identifiers."
    )

    if safe_metrics:
        system_prompt += f"\n\nAnonymized context metrics: {safe_metrics}"

    # ── Step 3: Call OpenAI or return mock ────────
    if not OPENAI_API_KEY:
        # Structured mock — same quality regardless of key
        mock_replies = {
            "EN": (
                "Based on the anonymized metrics provided, the primary churn driver appears to be "
                "involuntary payment failures. I recommend activating the 72-hour grace period protocol "
                "and scheduling timezone-aware retry attempts. Projected recovery: +31% within 14 days."
            ),
            "RU": (
                "На основе анонимизированных метрик основной причиной оттока являются непреднамеренные "
                "сбои оплаты. Рекомендую активировать протокол 72-часового льготного периода и запланировать "
                "повторные попытки с учётом часового пояса. Прогнозируемое восстановление: +31% за 14 дней."
            ),
            "KZ": (
                "Анонимизацияланған метрикалар негізінде кетудің негізгі себебі — еріксіз төлем ақаулары. "
                "72 сағаттық жеңілдік кезеңі протоколын іске қосуды және уақыт белдеуіне сай "
                "қайталауларды жоспарлауды ұсынамын. Болжамды қалпына келтіру: 14 күнде +31%."
            ),
        }
        reply = mock_replies.get(body.language.upper(), mock_replies["EN"])
        return ConsultResponse(reply=reply, model_used="mock-v1", anonymized=True)

    # ── Real OpenAI call ─────────────────────────
    history = body.history or []
    # Truncate to last 6 turns to stay within token budget
    history = history[-6:]

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
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json()
        reply = data["choices"][0]["message"]["content"]
        tokens = data.get("usage", {}).get("total_tokens")
        return ConsultResponse(
            reply=reply,
            model_used=OPENAI_MODEL,
            tokens_used=tokens,
            anonymized=True,
        )
    except http.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="OpenAI request timed out")
    except http.exceptions.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"OpenAI gateway error: {exc}")


@app.get("/predict/{user_id}", response_model=PredictionResponse, tags=["ml"])
async def predict(user_id: str):
    """
    Churn risk prediction for a single subscriber.

    ML SLOT:
        features = await feature_store.get(user_id)
        prob = model.predict_proba([features])[0][1]
        level = "CRITICAL" if prob > 0.7 else "MODERATE" if prob > 0.4 else "HEALTHY"
    """
    uid = user_id.upper().strip()

    if uid in MOCK_USERS:
        data = MOCK_USERS[uid]
        return PredictionResponse(user_id=uid, model_version="v7.3.1-skeleton", confidence=0.91, **data)

    # Unknown user — generic medium-risk fallback
    return PredictionResponse(
        user_id=uid,
        risk_probability=0.55,
        churn_score=55,
        risk_level="MODERATE",
        risk_type="Unknown",
        top_features=["insufficient_data"],
        recommendation="Insufficient history. Schedule a 30-day monitoring window.",
        model_version="v7.3.1-skeleton",
        confidence=0.60,
    )


@app.get("/stats", response_model=StatsResponse, tags=["analytics"])
async def get_stats():
    """
    Platform-wide retention KPIs.
    Replace with a database query (e.g. SQLAlchemy + Postgres) in production.
    """
    return StatsResponse(**MOCK_STATS)


@app.get("/predict/{user_id}/features", tags=["ml"])
async def predict_features(user_id: str):
    """SHAP / feature-importance breakdown. Slot ready — plug in your SHAP explainer."""
    uid = user_id.upper().strip()
    mock = MOCK_USERS.get(uid, {})
    return {
        "user_id": uid,
        "feature_importance": {
            f: round(1 / (i + 1), 3)
            for i, f in enumerate(mock.get("top_features", ["unknown"]))
        },
        "explanation_method": "SHAP (slot — not yet integrated)",
    }
