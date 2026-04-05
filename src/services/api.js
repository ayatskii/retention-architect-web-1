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

// ── fetchClusters ─────────────────────────────────────────────────
/**
 * Fetch 150 scatter-plot cluster points from /clusters.
 * Falls back to a minimal mock when backend is unreachable.
 *
 * @param {string} period  '7d' | '30d' | '90d'
 * @returns {Promise<Object>}  { points, period, total, axes, clusters }
 */
export async function fetchClusters(period = '30d') {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/clusters?period=${period}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch {
    console.warn('[api] Backend unavailable — using mock clusters')
    // Minimal mock: 5 anchor points only
    const anchors = [
      { x: 198, y: 0.1962, gen_failed: 0.0558, risk_score: 0.85, cluster: 'Technical',  anchor: true,  user_id: '0' },
      { x: 198, y: 13.49,  gen_failed: 0.0039, risk_score: 0.15, cluster: 'Healthy',    anchor: true,  user_id: '1' },
      { x: 199, y: 0.7229, gen_failed: 0.0021, risk_score: 0.92, cluster: 'Voluntary',  anchor: true,  user_id: '3' },
      { x: 199, y: 0.9910, gen_failed: 0.0043, risk_score: 0.45, cluster: 'Voluntary',  anchor: true,  user_id: '4' },
      { x: 67,  y: -0.41,  gen_failed: 0.0045, risk_score: 0.78, cluster: 'Voluntary',  anchor: true,  user_id: '5' },
    ]
    return {
      points: anchors,
      period,
      total: anchors.length,
      axes: { x: { field: 'gen_total', label: 'Total Activity' }, y: { field: 'frustration', label: 'User Frustration Index' } },
      clusters: {
        Healthy:   { color: '#ccff00' },
        Voluntary: { color: '#ff0055' },
        Technical: { color: '#ffcc00' },
      },
      _mock: true,
    }
  }
}

// ── fetchShap ─────────────────────────────────────────────────────
/**
 * Fetch SHAP feature contributions for a single user.
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
export async function fetchShap(userId) {
  const uid = userId.trim()
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/predict/${encodeURIComponent(uid)}/shap`)
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch {
    console.warn('[api] Backend unavailable — using mock SHAP for', uid)
    // Minimal mock fallback
    return {
      user_id:     uid,
      base_value:  0.35,
      output_value: 0.87,
      features: [
        { name: 'gen_completed_rate',  value: 0.08,  contribution:  0.22 },
        { name: 'gen_failed_rate',     value: 0.056, contribution:  0.15 },
        { name: 'frustration_index',   value: 0.72,  contribution:  0.11 },
        { name: 'days_since_last_gen', value: 5,     contribution:  0.05 },
        { name: 'sub_weekday',         value: 2,     contribution:  0.03 },
        { name: 'gen_total',           value: 198,   contribution: -0.04 },
      ],
      explanation_method: 'SHAP TreeExplainer (mock)',
      _mock: true,
    }
  }
}

// ── fetchSegments ─────────────────────────────────────────────────
/**
 * Fetch K-Means cluster segmentation summary.
 * @returns {Promise<Object>}  { clusters, method, silhouette_score }
 */
export async function fetchSegments() {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/segments`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch {
    console.warn('[api] Backend unavailable — using mock segments')
    return {
      clusters: [
        { name: 'High-Risk',   churn_rate: 0.42, user_count: 2478, avg_tenure_days: 3.2,  avg_spend: 14.99, dominant_churn_type: 'voluntary',   color: '#ff0055' },
        { name: 'Medium-Risk', churn_rate: 0.21, user_count: 2586, avg_tenure_days: 8.1,  avg_spend: 14.99, dominant_churn_type: 'mixed',        color: '#ff8800' },
        { name: 'Low-Risk',    churn_rate: 0.15, user_count: 1979, avg_tenure_days: 13.4, avg_spend: 29.99, dominant_churn_type: 'involuntary',  color: '#ccff00' },
      ],
      method: 'Autoencoder + K-Means (k=3)',
      silhouette_score: 0.35,
      _mock: true,
    }
  }
}

// ── fetchModelMetrics ─────────────────────────────────────────────
/**
 * Fetch full model performance metrics.
 * @returns {Promise<Object>}
 */
export async function fetchModelMetrics() {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/model/metrics`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch {
    console.warn('[api] Backend unavailable — using mock model metrics')
    return {
      accuracy:           0.84,
      precision:          0.84,
      recall:             0.84,
      f1_score:           0.84,
      auc_roc:            0.932,
      optimal_threshold:  0.528,
      model_type:         'XGBoost + LightGBM + GradientBoosting (Soft Voting)',
      smote_applied:      true,
      calibration_method: 'isotonic',
      brier_score:        0.142,
      training_samples:   5634,
      test_samples:       1409,
      _mock: true,
    }
  }
}

// ── Dashboard content endpoints ───────────────────────────────────
// These back the formerly-hardcoded constants in Overview, Diagnostics,
// Segments and StrategyLab. Each has a local mock fallback that mirrors
// the legacy hardcoded values so the UI stays usable offline.

const MOCK_CHURN_DRIVERS = {
  drivers: [
    { key: 'factor_failed',       label: 'Failed Generations', score: 5.6, color: '#ff0055' },
    { key: 'factor_frustration',  label: 'Frustration Index',  score: 4.2, color: '#ff8800' },
    { key: 'factor_active_span',  label: 'Active Span',        score: 6.1, color: '#ccff00' },
  ],
  scale_max: 7,
  _mock: true,
}

export async function fetchChurnDrivers() {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/analytics/churn-drivers`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch {
    console.warn('[api] Backend unavailable — using mock churn drivers')
    return MOCK_CHURN_DRIVERS
  }
}

const MOCK_TECH_FAILURES = {
  slices: [
    { key: 'paymentFailed',  label: 'Payment Failed',  count: 8200, color: '#ccff00' },
    { key: 'sessionTimeout', label: 'Session Timeout', count: 4100, color: '#00ccff' },
    { key: 'apiError',       label: 'API Error',       count: 3300, color: '#ff8800' },
    { key: 'authFailure',    label: 'Auth Failure',    count: 2400, color: '#ff0055' },
    { key: 'networkDrop',    label: 'Network Drop',    count: 1500, color: '#8800ff' },
  ],
  total: 19500,
  _mock: true,
}

export async function fetchTechFailures() {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/analytics/tech-failures`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch {
    console.warn('[api] Backend unavailable — using mock tech failures')
    return MOCK_TECH_FAILURES
  }
}

const MOCK_ANOMALIES = {
  anomalies: [
    { id: 'A-001', severity: 'critical', color: '#ff0055', ts_num: '2',  ts_unit: 'm',
      message: 'User #0 — gen_failed rate 5.58% (threshold: 3%) · Involuntary churn imminent' },
    { id: 'A-002', severity: 'critical', color: '#ff0055', ts_num: '7',  ts_unit: 'm',
      message: 'User #3 — gen_completed 8.49% · Frustration index 0.72 · Critical voluntary churn risk' },
    { id: 'A-003', severity: 'high',     color: '#ff8800', ts_num: '19', ts_unit: 'm',
      message: 'User #5 — gen_total dropped to 67 (avg: 198) · Sharp generation decline detected' },
    { id: 'A-004', severity: 'warning',  color: '#ffcc00', ts_num: '31', ts_unit: 'm',
      message: 'User #4 — gen_completed 18.83% · At-risk cohort engagement dropping' },
    { id: 'A-005', severity: 'info',     color: '#00e5ff', ts_num: '1',  ts_unit: 'h',
      message: 'Model drift on frustration feature — retraining queued (User #1 outlier: 13.49)' },
  ],
  _mock: true,
}

export async function fetchAnomalies() {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/anomalies`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch {
    console.warn('[api] Backend unavailable — using mock anomalies')
    return MOCK_ANOMALIES
  }
}

/**
 * Fetch every demo user with a live ML-ensemble prediction attached.
 * Used by StrategyLab CSV export.
 */
export async function fetchUsers() {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/users`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch {
    console.warn('[api] Backend unavailable — using mock users roster')
    return { users: Object.values(MOCK_USERS).map(u => ({
      id: u.user_id, risk_score: u.risk_score, churn_score: u.churn_score,
      risk_level: u.risk_level, churn_type: u.churn_type, metrics: u.metrics,
      summary: u.summary, model_source: 'mock',
    })), count: 5, _mock: true }
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
