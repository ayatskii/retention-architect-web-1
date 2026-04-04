/**
 * Wins Retention Architect — API Service
 * =======================================
 * Connects to the FastAPI backend (default: http://localhost:8000).
 * Falls back to mock data gracefully when the backend is unavailable.
 *
 * Env vars (set in .env):
 *   VITE_API_URL=http://localhost:8000
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ── Timeout helper ────────────────────────────────────────────────
function fetchWithTimeout(url, options = {}, timeoutMs = 4000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(id))
}

// ── MOCK FALLBACKS ────────────────────────────────────────────────
const MOCK_STATS = {
  total_revenue_at_risk:   3_200_000,
  recoverable_assets:      1_200_000,
  total_churned_users:    22_500,
  voluntary_churn:         8_200,
  involuntary_churn:      14_300,
  engine_health_pct:      99.98,
  model_f1_score:          0.87,
  model_confidence:        0.91,
  model_auc_roc:           0.94,
  interventions_triggered: 4_821,
  arr_recovered:           1_800_000,
  active_grace_periods:    6_400,
  _mock: true,
}

const MOCK_USERS = {
  'USR-001': {
    user_id: 'USR-001',
    name: 'Aisha Bekova',
    plan: 'Professional',
    risk_probability: 0.87,
    churn_score: 87,
    risk_level: 'CRITICAL',
    risk_type: 'Involuntary',
    top_features: ['payment_failures', 'session_drop', 'support_ticket'],
    grace_period_eligible: true,
    ltv_score: 72,
    last_active_hours_ago: 2,
    recommendation: 'Immediate payment retry + CSM outreach within 24h. Offer 2-month discount to neutralise billing friction.',
    _mock: true,
  },
  'USR-002': {
    user_id: 'USR-002',
    name: 'Damir Seitkali',
    plan: 'Starter',
    risk_probability: 0.41,
    churn_score: 41,
    risk_level: 'MODERATE',
    risk_type: 'Voluntary',
    top_features: ['low_engagement', 'no_premium_features', 'competitor_signal'],
    grace_period_eligible: false,
    ltv_score: 28,
    last_active_hours_ago: 72,
    recommendation: 'Trigger educational email sequence + personalised demo of advanced features.',
    _mock: true,
  },
  'USR-003': {
    user_id: 'USR-003',
    name: 'Zarina Mukhanova',
    plan: 'Enterprise',
    risk_probability: 0.12,
    churn_score: 12,
    risk_level: 'HEALTHY',
    risk_type: 'None',
    top_features: ['high_engagement', 'seat_expansion', 'nps_9'],
    grace_period_eligible: false,
    ltv_score: 95,
    last_active_hours_ago: 0,
    recommendation: 'Candidate for Enterprise Plus upsell and referral programme enrollment.',
    _mock: true,
  },
}

// ── fetchStats ────────────────────────────────────────────────────
/**
 * Fetch platform-wide retention KPIs from the backend.
 * Returns mock data (with _mock: true) if backend is unreachable.
 */
export async function fetchStats() {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/stats`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch {
    console.warn('[api] Backend unavailable — using mock stats')
    return MOCK_STATS
  }
}

// ── fetchPredict ──────────────────────────────────────────────────
/**
 * Fetch churn prediction for a single subscriber.
 * Falls back to local mock if backend is unreachable.
 *
 * @param {string} userId  e.g. "USR-001" or "damir"
 * @returns {Promise<Object>} PredictionResponse schema
 */
export async function fetchPredict(userId) {
  const uid = userId.trim().toUpperCase()
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/predict/${encodeURIComponent(uid)}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch {
    console.warn('[api] Backend unavailable — using mock predict for', uid)
    return (
      MOCK_USERS[uid] ?? {
        user_id: uid,
        risk_probability: 0.55,
        churn_score: 55,
        risk_level: 'MODERATE',
        risk_type: 'Unknown',
        top_features: ['insufficient_data'],
        recommendation: 'Insufficient history. Schedule a 30-day monitoring window.',
        _mock: true,
      }
    )
  }
}

// ── checkHealth ───────────────────────────────────────────────────
/**
 * Ping the backend health endpoint.
 * @returns {Promise<boolean>} true if backend is online
 */
export async function checkHealth() {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/health`, {}, 2000)
    return res.ok
  } catch {
    return false
  }
}
