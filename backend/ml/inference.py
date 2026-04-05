"""
ML inference module for the churn prediction ensemble.
Loads the pickled XGBoost + LightGBM models, the category_encoders TargetEncoder
for high-cardinality categoricals, the sklearn LabelEncoder for target classes,
and the 97-feature column list — all once at import time.

On any loading failure the module stays importable with MODEL_READY = False, so
the FastAPI app still boots and the endpoints can fall back to demo_data.json.
"""

from __future__ import annotations

import logging
import os
import pickle
from typing import Any, Dict, List, Optional

import joblib

log = logging.getLogger("ml.inference")

# ── Resolve models directory ──────────────────────────────────────
# Priority: MODELS_DIR env var → <repo_root>/models (relative to this file).
_DEFAULT_MODELS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "models")
)
MODELS_DIR: str = os.environ.get("MODELS_DIR", _DEFAULT_MODELS_DIR)

# ── Module-level artifacts (populated on successful load) ─────────
FEATURE_COLUMNS: List[str] = []
LABEL_ENCODER = None
HIGH_CARD_ENCODER = None
HIGH_CARD_COLS: List[str] = []
XGB_MODEL = None
LGBM_MODEL = None
SHAP_EXPLAINER = None
MODEL_READY: bool = False
LOAD_ERROR: Optional[str] = None

# Map the label-encoder's internal class names to the display strings used
# throughout the frontend and existing /predict/{user_id} responses.
CLASS_DISPLAY: Dict[str, str] = {
    "not_churned": "Healthy",
    "vol_churn":   "Voluntary",
    "invol_churn": "Involuntary",
}

# Risk-level thresholds match backend/main.py::_risk_level
def risk_level(score: float) -> str:
    if score >= 0.85: return "CRITICAL"
    if score >= 0.70: return "HIGH"
    if score >= 0.45: return "MODERATE"
    return "HEALTHY"


def _load_pickle(name: str) -> Any:
    """
    Load an artifact written with either ``pickle`` or ``joblib``. joblib's
    loader transparently handles both formats and is required here because
    the sklearn/xgboost pickles in this repo were saved with joblib.
    """
    path = os.path.join(MODELS_DIR, name)
    try:
        return joblib.load(path)
    except Exception:
        with open(path, "rb") as f:
            return pickle.load(f)


def _load_all() -> None:
    """Load every artifact and build the SHAP explainer. Sets MODEL_READY."""
    global FEATURE_COLUMNS, LABEL_ENCODER, HIGH_CARD_ENCODER, HIGH_CARD_COLS
    global XGB_MODEL, LGBM_MODEL, SHAP_EXPLAINER, MODEL_READY, LOAD_ERROR

    try:
        FEATURE_COLUMNS   = _load_pickle("feature_columns.pkl")
        LABEL_ENCODER     = _load_pickle("target_label_encoder.pkl")
        HIGH_CARD_ENCODER = _load_pickle("target_high_card_encoder.pkl")
        XGB_MODEL         = _load_pickle("xgb_churn_model.pkl")
        LGBM_MODEL        = _load_pickle("lgbm_churn_model.pkl")

        HIGH_CARD_COLS = list(getattr(HIGH_CARD_ENCODER, "cols", []) or [])

        # Build SHAP explainer once — TreeExplainer on XGBoost is cheap.
        import shap  # local import so missing lib doesn't kill module load
        SHAP_EXPLAINER = shap.TreeExplainer(XGB_MODEL)

        MODEL_READY = True
        log.info(
            "[ml.inference] models loaded from %s — features=%d, classes=%s, high_card_cols=%s",
            MODELS_DIR,
            len(FEATURE_COLUMNS),
            list(LABEL_ENCODER.classes_),
            HIGH_CARD_COLS,
        )
    except Exception as exc:  # pragma: no cover — defensive
        MODEL_READY = False
        LOAD_ERROR = f"{type(exc).__name__}: {exc}"
        log.warning(
            "[ml.inference] model load failed (%s) — falling back to demo_data.json. "
            "MODELS_DIR=%s",
            LOAD_ERROR,
            MODELS_DIR,
        )


_load_all()


# ══════════════════════════════════════════════════
# Feature frame builder
# ══════════════════════════════════════════════════

def build_feature_frame(raw: Optional[Dict[str, Any]]):
    """
    Produce a 1-row pandas DataFrame matching the exact 97-feature training
    schema. Any key missing from ``raw`` is filled with a neutral default:
      - high-cardinality categorical columns → "unknown"
        (the TargetEncoder maps unseen values to the global training mean)
      - everything else → 0
    After filling, the 3 high-card columns are target-encoded in place and
    the whole frame is cast to float so xgboost/lightgbm see pure numerics.
    """
    if not MODEL_READY:
        raise RuntimeError("ML models are not loaded")

    import pandas as pd  # local import keeps module importable without pandas

    raw = raw or {}
    row: Dict[str, Any] = {}
    for col in FEATURE_COLUMNS:
        if col in HIGH_CARD_COLS:
            row[col] = raw.get(col, "unknown")
        else:
            val = raw.get(col, 0)
            # Booleans → 0/1; None → 0.
            if val is None:
                val = 0
            elif isinstance(val, bool):
                val = int(val)
            row[col] = val

    df = pd.DataFrame([row], columns=FEATURE_COLUMNS)
    # TargetEncoder was fit on the 3-column subset — apply only to those cols.
    if HIGH_CARD_COLS:
        df[HIGH_CARD_COLS] = HIGH_CARD_ENCODER.transform(df[HIGH_CARD_COLS])
    # XGBoost/LightGBM need pure numeric input.
    df = df.astype(float)
    return df


# ══════════════════════════════════════════════════
# Prediction
# ══════════════════════════════════════════════════

def predict(raw: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Run the XGB + LGBM soft-voting ensemble on a single user's raw feature dict
    and return a normalized result with a display-ready churn type and risk
    score. See CLASS_DISPLAY for the class → display mapping.
    """
    if not MODEL_READY:
        raise RuntimeError("ML models are not loaded")

    import numpy as np

    df = build_feature_frame(raw)

    p_xgb  = XGB_MODEL.predict_proba(df)[0]
    p_lgbm = LGBM_MODEL.predict_proba(df)[0]
    p_ens  = (p_xgb + p_lgbm) / 2.0

    classes = list(LABEL_ENCODER.classes_)
    pred_idx  = int(np.argmax(p_ens))
    pred_name = classes[pred_idx]

    # Churn risk = probability of any churn class = 1 - P(not_churned).
    try:
        not_churn_idx = classes.index("not_churned")
        risk_score = float(1.0 - p_ens[not_churn_idx])
    except ValueError:
        # Safety net if the label set ever changes.
        risk_score = float(1.0 - p_ens.max())

    class_probs = {
        CLASS_DISPLAY.get(cls, cls): float(p_ens[i])
        for i, cls in enumerate(classes)
    }

    return {
        "risk_score":          max(0.0, min(1.0, risk_score)),
        "churn_class_raw":     pred_name,
        "churn_class":         CLASS_DISPLAY.get(pred_name, pred_name),
        "risk_level":          risk_level(risk_score),
        "confidence":          float(max(p_ens)),
        "class_probabilities": class_probs,
        "xgb_probabilities":   [float(x) for x in p_xgb],
        "lgbm_probabilities":  [float(x) for x in p_lgbm],
    }


# ══════════════════════════════════════════════════
# SHAP explainability
# ══════════════════════════════════════════════════

def feature_importances() -> Dict[str, float]:
    """
    Return a dict of ``{feature_name: importance}`` for every column in
    ``FEATURE_COLUMNS``, taken straight from the trained XGBoost model.
    Importances come from gain-based splits — they reflect what the model
    actually learned during training, not anything we hardcode at runtime.
    """
    if not MODEL_READY:
        return {}
    imps = XGB_MODEL.feature_importances_
    return {name: float(imps[i]) for i, name in enumerate(FEATURE_COLUMNS)}


def shap_contributions(
    raw: Optional[Dict[str, Any]], top_k: int = 6
) -> Dict[str, Any]:
    """
    Compute real SHAP contributions for the predicted class and return the
    top_k features by |contribution|. Shape matches what the frontend's
    fetchShap() already reads.
    """
    if not MODEL_READY or SHAP_EXPLAINER is None:
        raise RuntimeError("SHAP explainer not available")

    import numpy as np

    df = build_feature_frame(raw)

    # Pick the predicted class from the ensemble, but explain the XGB model.
    p_xgb  = XGB_MODEL.predict_proba(df)[0]
    p_lgbm = LGBM_MODEL.predict_proba(df)[0]
    p_ens  = (p_xgb + p_lgbm) / 2.0
    pred_idx = int(np.argmax(p_ens))

    sv = SHAP_EXPLAINER.shap_values(df)
    # SHAP multi-class returns either list[ndarray] (older) or ndarray of
    # shape (n_samples, n_features, n_classes) (newer). Handle both.
    if isinstance(sv, list):
        contributions = sv[pred_idx][0]          # 1-D, length n_features
        class_sv_row  = sv[pred_idx][0]
    else:
        # ndarray (1, n_features, n_classes)
        contributions = sv[0, :, pred_idx]
        class_sv_row  = sv[0, :, pred_idx]

    bv = SHAP_EXPLAINER.expected_value
    if hasattr(bv, "__len__"):
        base_value = float(bv[pred_idx])
    else:
        base_value = float(bv)
    output_value = float(base_value + class_sv_row.sum())

    features_sorted = sorted(
        (
            {
                "name":         col,
                "value":        float(df[col].iloc[0]),
                "contribution": float(contributions[i]),
            }
            for i, col in enumerate(FEATURE_COLUMNS)
        ),
        key=lambda d: abs(d["contribution"]),
        reverse=True,
    )

    classes = list(LABEL_ENCODER.classes_)
    return {
        "base_value":         base_value,
        "output_value":       output_value,
        "features":           features_sorted[:top_k],
        "predicted_class":    CLASS_DISPLAY.get(classes[pred_idx], classes[pred_idx]),
        "explanation_method": "SHAP TreeExplainer (XGBoost)",
    }
