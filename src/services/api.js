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
  avg_risk_score:          0.63,
  high_risk_users_sample:  4,
  avg_frustration_index:   2.999,
  avg_gen_failed_rate:     0.0141,
  avg_completion_rate:     0.4284,
  _mock: true,
}

// Mirror of demo_data.json for offline fallback
const MOCK_USERS = {
  '0': {
    user_id: '0', risk_score: 0.85, churn_score: 85,
    risk_level: 'CRITICAL', churn_type: 'Involuntary', risk_type: 'Involuntary',
    metrics: { gen_failed: 0.0558, gen_total: 198, frustration: 0.1962, sub_weekday: 2, gen_completed: 0.8889 },
    top_features: ['high_technical_error_rate'],
    summary: 'Technical churn due to high gen_failed rate.',
    recommendation: 'Technical churn due to high gen_failed rate.',
    _mock: true,
  },
  '1': {
    user_id: '1', risk_score: 0.15, churn_score: 15,
    risk_level: 'HEALTHY', churn_type: 'Healthy', risk_type: 'Healthy',
    metrics: { gen_failed: 0.0039, gen_total: 198, frustration: 13.4858, sub_weekday: 4, gen_completed: 0.5389 },
    top_features: ['high_engagement'],
    summary: 'Loyal power user with high activity.',
    recommendation: 'Loyal power user with high activity.',
    _mock: true,
  },
  '3': {
    user_id: '3', risk_score: 0.92, churn_score: 92,
    risk_level: 'CRITICAL', churn_type: 'Voluntary', risk_type: 'Voluntary',
    metrics: { gen_failed: 0.0021, gen_total: 199, frustration: 0.7229, sub_weekday: 3, gen_completed: 0.0849 },
    top_features: ['low_completion_rate', 'frustration_anomaly'],
    summary: 'Critical churn risk. High frustration index detected.',
    recommendation: 'Critical churn risk. High frustration index detected.',
    _mock: true,
  },
  '4': {
    user_id: '4', risk_score: 0.45, churn_score: 45,
    risk_level: 'MODERATE', churn_type: 'At Risk', risk_type: 'At Risk',
    metrics: { gen_failed: 0.0043, gen_total: 199, frustration: 0.9910, sub_weekday: 6, gen_completed: 0.1883 },
    top_features: ['low_completion_rate'],
    summary: 'Medium risk. Engagement dropping.',
    recommendation: 'Medium risk. Engagement dropping.',
    _mock: true,
  },
  '5': {
    user_id: '5', risk_score: 0.78, churn_score: 78,
    risk_level: 'HIGH', churn_type: 'Voluntary', risk_type: 'Voluntary',
    metrics: { gen_failed: 0.0045, gen_total: 67, frustration: -0.4074, sub_weekday: 5, gen_completed: 0.4308 },
    top_features: ['sharp_generation_decline'],
    summary: 'High risk. Sharp decline in total generations.',
    recommendation: 'High risk. Sharp decline in total generations.',
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
/**
 * Fetch churn prediction for a user.
 * - Returns null on HTTP 404 (user not found in demo_data.json).
 * - Falls back to local mock on network error.
 * - IDs are NOT uppercased — numeric IDs like "0","1","3","4","5" are matched exactly.
 *
 * @param {string} userId
 * @returns {Promise<Object|null>}  null means user not found
 */
export async function fetchPredict(userId) {
  const uid = userId.trim()
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/predict/${encodeURIComponent(uid)}`)
    if (res.status === 404) return null           // explicit "user not found"
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    if (err.message?.includes('404')) return null
    console.warn('[api] Backend unavailable — using mock predict for', uid)
    return MOCK_USERS[uid] ?? null
  }
}

// ── consultAI ─────────────────────────────────────────────────────
/**
 * Call the Secure AI Gateway (POST /ai/consult).
 * All data is anonymized server-side before reaching OpenAI.
 *
 * @param {string}   message   User's question
 * @param {object}   [metrics] Optional structured metrics context
 * @param {string}   [lang]    'EN' | 'RU' | 'KZ'
 * @param {Array}    [history] Previous chat turns [{role, content}]
 * @returns {Promise<{reply: string, anonymized: boolean, model_used: string}>}
 */
export async function consultAI({ message, metrics = null, lang = 'EN', history = [] }) {
  try {
    const res = await fetchWithTimeout(
      `${BASE_URL}/ai/consult`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, metrics, language: lang, history }),
      },
      12000, // 12 s — AI calls can be slow
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch {
    console.warn('[api] AI consult backend unavailable — using frontend mock')
    return null // caller falls back to local mock responses
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
