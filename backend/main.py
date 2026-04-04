"""
Wins Retention Architect — FastAPI Backend Skeleton
====================================================
ML model slot: drop your trained XGBoost / sklearn pipeline into
`ml/model.pkl` and replace the MOCK_* constants with real inference.

Run:
    uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import os

# ── App ──────────────────────────────────────────
app = FastAPI(
    title="Wins Retention Intelligence API",
    description="Backend skeleton for the Wins Retention Architect. "
                "ML model slot ready — replace MOCK values with real inference.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS (allow Vite dev server) ─────────────────
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
    "total_revenue_at_risk":  3_200_000,
    "recoverable_assets":     1_200_000,
    "total_churned_users":   22_500,
    "voluntary_churn":        8_200,
    "involuntary_churn":     14_300,
    "engine_health_pct":     99.98,
    "model_f1_score":         0.87,
    "model_confidence":       0.91,
    "model_auc_roc":          0.94,
    "interventions_triggered": 4_821,
    "arr_recovered":          1_800_000,
    "active_grace_periods":   6_400,
}

# ══════════════════════════════════════════════════
# PYDANTIC SCHEMAS
# ══════════════════════════════════════════════════

class PredictionResponse(BaseModel):
    user_id: str
    name: Optional[str] = None
    plan: Optional[str] = None
    risk_probability: float = Field(..., ge=0.0, le=1.0, description="Churn probability [0-1]")
    churn_score: int = Field(..., ge=0, le=100, description="0-100 risk index")
    risk_level: str = Field(..., description="HEALTHY | MODERATE | CRITICAL")
    risk_type: str = Field(..., description="None | Voluntary | Involuntary")
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

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "USR-001",
                "risk_probability": 0.87,
                "churn_score": 87,
                "risk_level": "CRITICAL",
                "risk_type": "Involuntary",
                "top_features": ["payment_failures", "session_drop"],
                "recommendation": "Immediate payment retry required.",
            }
        }


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
    timestamp: str


# ══════════════════════════════════════════════════
# ENDPOINTS
# ══════════════════════════════════════════════════

@app.get("/", tags=["root"])
async def root():
    return {
        "app": "Wins Retention Intelligence API",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health():
    """Liveness probe — useful for Docker / k8s health checks."""
    return HealthResponse(
        status="ok",
        version="1.0.0",
        model_slot="MOCK — replace ml/model.pkl with trained model",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.get("/stats", response_model=StatsResponse, tags=["analytics"])
async def get_stats():
    """
    Platform-wide retention metrics.

    MOCK DATA — in production, compute from your data warehouse / feature store.
    Replace the MOCK_STATS dict with a database query (e.g. SQLAlchemy + Postgres).
    """
    return StatsResponse(**MOCK_STATS)


@app.get("/predict/{user_id}", response_model=PredictionResponse, tags=["ml"])
async def predict(user_id: str):
    """
    Churn risk prediction for a single subscriber.

    MOCK DATA SLOT:
    ────────────────
    When your ML team delivers the trained model, replace the MOCK_USERS lookup
    with something like:

        features = await feature_store.get(user_id)   # pull from Redis/Feast
        prob = model.predict_proba([features])[0][1]   # sklearn / XGBoost
        level = "CRITICAL" if prob > 0.7 else "MODERATE" if prob > 0.4 else "HEALTHY"

    The PredictionResponse schema is already aligned with the React frontend.
    """
    uid = user_id.upper().strip()

    if uid in MOCK_USERS:
        data = MOCK_USERS[uid]
        return PredictionResponse(
            user_id=uid,
            model_version="v7.3.1-skeleton",
            confidence=0.91,
            **data,
        )

    # Unknown user — return a generic medium-risk prediction
    # (In production: raise HTTPException(404) if user truly doesn't exist)
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


@app.get("/predict/{user_id}/features", tags=["ml"])
async def predict_features(user_id: str):
    """
    SHAP / feature-importance breakdown for a prediction.
    Slot ready — plug in your SHAP explainer here.
    """
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
