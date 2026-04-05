// PDF export helper — builds a print-ready HTML document in a hidden iframe
// and triggers the browser's print dialog (user saves as PDF).
// Dependency-free: uses only browser APIs.

import { TASK_DATA, SEVERITY_COLORS } from '../data/taskData'

const escape = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function buildHtml(taskId, t) {
  const task = TASK_DATA[taskId]
  if (!task) return '<html><body>Task not found</body></html>'

  const td = t?.taskDetail || {}
  const tasksT = t?.tasks || {}
  const sevColor = SEVERITY_COLORS[task.severity] || '#666'

  const title = tasksT[`task${taskId}Title`] || `Task #${taskId}`
  const tag = tasksT[`task${taskId}Tag`] || task.severity.toUpperCase()
  const subtitle = tasksT[`task${taskId}Sub`] || ''

  const rootCausesHtml = task.rootCauses
    .map(
      (c) => `
      <div class="cause">
        <div class="cause-header">
          <span class="cause-factor">${escape(c.factor)}</span>
          <span class="cause-pct" style="color:${sevColor}">${(c.contribution * 100).toFixed(0)}% ${escape(td.contribution || 'contribution')}</span>
        </div>
        <p class="cause-explanation">${escape(td[c.explanationKey] || c.factor)}</p>
        <div class="bar">
          <div class="bar-fill" style="width:${(c.contribution * 100).toFixed(0)}%;background:${sevColor}"></div>
        </div>
      </div>`
    )
    .join('')

  const timelineHtml = task.timeline
    .map(
      (ev) => `
      <div class="timeline-item">
        <div class="timeline-meta">
          <span class="timeline-type timeline-type-${escape(ev.type)}">${escape(td[ev.type] || ev.type)}</span>
          <span class="timeline-date">${escape(formatDate(ev.date))}</span>
        </div>
        <p class="timeline-event">${escape(td[ev.eventKey] || ev.eventKey)}</p>
        ${ev.outcome ? `<p class="timeline-outcome"><strong>${escape(td.outcome || 'Outcome')}:</strong> ${escape(ev.outcome)}</p>` : ''}
      </div>`
    )
    .join('')

  const generatedAt = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escape(title)} — WINS Retention Architect</title>
<style>
  @page { size: A4; margin: 14mm 14mm 18mm 14mm; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    color: #111; background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .doc { max-width: 720px; margin: 0 auto; padding: 16px 0; }

  .brand {
    display: flex; align-items: center; justify-content: space-between;
    padding-bottom: 12px; border-bottom: 2px solid ${sevColor};
    margin-bottom: 20px;
  }
  .brand-name { font-size: 18px; font-weight: 900; letter-spacing: -0.02em; color: #111; }
  .brand-sub { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.15em; }

  h1 { font-size: 26px; font-weight: 900; margin: 0 0 8px 0; line-height: 1.15; }
  h2 {
    font-size: 14px; font-weight: 900; text-transform: uppercase;
    letter-spacing: 0.1em; margin: 24px 0 10px 0;
    padding-bottom: 6px; border-bottom: 1px solid #e5e5e5;
    color: #333;
  }

  .tag {
    display: inline-block; font-size: 9px; font-weight: 900;
    letter-spacing: 0.15em; padding: 3px 8px; border-radius: 4px;
    color: #fff; background: ${sevColor};
  }
  .subtitle { font-size: 12px; color: #555; margin: 6px 0 16px 0; line-height: 1.5; }

  .stats-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
    margin-top: 12px;
  }
  .stat {
    padding: 10px 12px; border: 1px solid #e5e5e5; border-radius: 6px;
    background: #fafafa;
  }
  .stat-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-bottom: 4px; }
  .stat-value { font-size: 18px; font-weight: 900; color: #111; }
  .stat-value.critical { color: #ff0055; }
  .stat-value.accent { color: ${sevColor}; }

  .cause {
    padding: 10px 0; border-bottom: 1px solid #f0f0f0;
  }
  .cause:last-child { border-bottom: none; }
  .cause-header {
    display: flex; justify-content: space-between; align-items: baseline;
    margin-bottom: 4px;
  }
  .cause-factor { font-size: 13px; font-weight: 700; color: #111; }
  .cause-pct { font-size: 11px; font-weight: 900; }
  .cause-explanation { font-size: 11px; color: #555; margin: 4px 0 8px 0; line-height: 1.5; }
  .bar {
    height: 5px; background: #efefef; border-radius: 3px; overflow: hidden;
  }
  .bar-fill { height: 100%; border-radius: 3px; }

  .strategy-box {
    padding: 14px; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 6px;
    border-left: 4px solid ${sevColor};
  }
  .strategy-name { font-size: 15px; font-weight: 900; color: #111; margin-bottom: 6px; }
  .strategy-desc { font-size: 11px; color: #555; line-height: 1.5; margin: 0 0 10px 0; }
  .strategy-source { font-size: 10px; color: #999; font-style: italic; margin-bottom: 12px; }
  .strategy-metrics { display: flex; gap: 24px; padding-top: 10px; border-top: 1px solid #e5e5e5; }
  .strategy-metric-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #888; }
  .strategy-metric-value { font-size: 18px; font-weight: 900; color: ${sevColor}; }

  .segment-stats {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
  }
  .segment-stat {
    padding: 10px; border: 1px solid #e5e5e5; border-radius: 6px; text-align: center;
  }
  .segment-stat-label { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 4px; }
  .segment-stat-value { font-size: 16px; font-weight: 900; color: #111; }

  .timeline-item {
    padding: 10px 0 10px 14px; border-left: 2px solid #e5e5e5;
    margin-left: 4px;
  }
  .timeline-item + .timeline-item { margin-top: 0; }
  .timeline-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
  .timeline-type {
    font-size: 8px; font-weight: 900; letter-spacing: 0.12em;
    text-transform: uppercase; padding: 2px 6px; border-radius: 3px;
  }
  .timeline-type-detection { background: #e0f7ff; color: #0088aa; }
  .timeline-type-alert { background: #fff3e0; color: #c66900; }
  .timeline-type-intervention { background: #f0ffd6; color: #5a7a00; }
  .timeline-date { font-size: 10px; color: #888; }
  .timeline-event { font-size: 12px; color: #111; margin: 0; line-height: 1.45; }
  .timeline-outcome { font-size: 10px; color: #5a7a00; margin: 4px 0 0 0; }

  .model-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 12px;
  }
  .model-tile {
    padding: 12px; border: 1px solid #e5e5e5; border-radius: 6px; text-align: center; background: #fafafa;
  }
  .model-label { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-bottom: 4px; }
  .model-value { font-size: 20px; font-weight: 900; color: #111; }

  .why-box {
    padding: 12px; background: #fafafa; border: 1px solid #e5e5e5;
    border-radius: 6px; font-size: 11px; color: #444; line-height: 1.55;
  }
  .why-title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #555; margin-bottom: 6px; }

  footer {
    margin-top: 28px; padding-top: 12px; border-top: 1px solid #e5e5e5;
    font-size: 9px; color: #999; display: flex; justify-content: space-between;
  }
</style>
</head>
<body>
  <div class="doc">
    <div class="brand">
      <div>
        <div class="brand-name">WINS · Retention Architect</div>
        <div class="brand-sub">PM Priority Task Report</div>
      </div>
      <div style="text-align:right">
        <div class="brand-sub">Generated</div>
        <div style="font-size:11px;font-weight:700;color:#333">${escape(generatedAt)}</div>
      </div>
    </div>

    <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
      <h1 style="margin:0">${escape(title)}</h1>
      <span class="tag">${escape(tag)}</span>
    </div>
    ${subtitle ? `<p class="subtitle">${escape(subtitle)}</p>` : ''}

    <div class="stats-grid">
      <div class="stat">
        <div class="stat-label">${escape(td.churnType || 'Churn Type')}</div>
        <div class="stat-value">${escape(td[task.churnType] || task.churnType)}</div>
      </div>
      <div class="stat">
        <div class="stat-label">${escape(td.affectedUsers || 'Affected Users')}</div>
        <div class="stat-value accent">${task.affectedUsers.toLocaleString()}</div>
      </div>
      <div class="stat">
        <div class="stat-label">${escape(td.revenueAtRisk || 'Revenue at Risk')}</div>
        <div class="stat-value critical">$${(task.revenueAtRisk / 1_000_000).toFixed(1)}M</div>
      </div>
    </div>

    <h2>${escape(td.rootCauseTitle || 'Root Cause Analysis')}</h2>
    ${rootCausesHtml}

    <h2>${escape(td.segmentTitle || 'User Segment Snapshot')}</h2>
    <div class="segment-stats">
      <div class="segment-stat">
        <div class="segment-stat-label">${escape(td.avgLtv || 'Avg LTV')}</div>
        <div class="segment-stat-value">$${task.segment.avgLtv}</div>
      </div>
      <div class="segment-stat">
        <div class="segment-stat-label">${escape(td.avgSessionFreq || 'Avg Sessions/Week')}</div>
        <div class="segment-stat-value">${task.segment.avgSessionFreq.toFixed(1)}</div>
      </div>
      <div class="segment-stat">
        <div class="segment-stat-label">${escape(td.daysSincePayment || 'Days Since Payment')}</div>
        <div class="segment-stat-value">${task.segment.daysSincePayment}</div>
      </div>
      <div class="segment-stat">
        <div class="segment-stat-label">${escape(td.paymentFailureRate || 'Failure Rate')}</div>
        <div class="segment-stat-value">${(task.segment.paymentFailureRate * 100).toFixed(0)}%</div>
      </div>
    </div>

    <h2>${escape(td.strategyTitle || 'Recommended Strategy')}</h2>
    <div class="strategy-box">
      <div class="strategy-name">${escape(td[task.strategy.nameKey] || task.strategy.nameKey)}</div>
      <p class="strategy-desc">${escape(td[task.strategy.descKey] || task.strategy.descKey)}</p>
      <div class="strategy-source">${escape(td.source || 'Source')}: ${escape(task.strategy.source)}</div>
      <div class="strategy-metrics">
        <div>
          <div class="strategy-metric-label">${escape(td.expectedRecovery || 'Expected Recovery')}</div>
          <div class="strategy-metric-value">+${(task.strategy.expectedRecovery * 100).toFixed(0)}%</div>
        </div>
        <div>
          <div class="strategy-metric-label">${escape(td.projectedRevenue || 'Projected Revenue')}</div>
          <div class="strategy-metric-value">$${(task.strategy.projectedRevenue / 1000).toFixed(0)}K</div>
        </div>
      </div>
    </div>

    <h2>${escape(td.timelineTitle || 'Timeline / Audit Log')}</h2>
    ${timelineHtml}

    <h2>${escape(td.confidenceTitle || 'Model Confidence')}</h2>
    <div class="model-grid">
      <div class="model-tile">
        <div class="model-label">${escape(td.f1Score || 'F1 Score')}</div>
        <div class="model-value">${task.model.f1.toFixed(2)}</div>
      </div>
      <div class="model-tile">
        <div class="model-label">${escape(td.precision || 'Precision')}</div>
        <div class="model-value">${task.model.precision.toFixed(2)}</div>
      </div>
      <div class="model-tile">
        <div class="model-label">${escape(td.recall || 'Recall')}</div>
        <div class="model-value">${task.model.recall.toFixed(2)}</div>
      </div>
    </div>
    <div class="why-box">
      <div class="why-title">${escape(td.whyThisRank || 'Why this priority rank?')}</div>
      ${escape(td[task.model.explanationKey] || task.model.explanationKey)}
    </div>

    <footer>
      <span>WINS · Retention Architect Engine</span>
      <span>HackNU 2026</span>
    </footer>
  </div>
</body>
</html>`
}

/**
 * Generates a PDF for the given task by rendering print-ready HTML in a hidden iframe
 * and triggering the browser's print dialog. The user can then choose "Save as PDF".
 *
 * @param {number|string} taskId - ID of the task (1, 2, or 3)
 * @param {object} t - translations object (from useI18n)
 * @returns {Promise<void>} resolves once the print dialog is triggered
 */
export function exportTaskPdf(taskId, t) {
  return new Promise((resolve, reject) => {
    if (!TASK_DATA[taskId]) {
      reject(new Error(`No task data for id ${taskId}`))
      return
    }

    const iframe = document.createElement('iframe')
    iframe.setAttribute('aria-hidden', 'true')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.style.opacity = '0'

    iframe.onload = () => {
      try {
        const win = iframe.contentWindow
        win.focus()
        // Small delay so the document fully styles before print
        setTimeout(() => {
          win.print()
          // Cleanup after print dialog — user may cancel or confirm
          setTimeout(() => {
            if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
            resolve()
          }, 500)
        }, 150)
      } catch (err) {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
        reject(err)
      }
    }

    document.body.appendChild(iframe)

    const doc = iframe.contentDocument || iframe.contentWindow.document
    doc.open()
    doc.write(buildHtml(taskId, t))
    doc.close()
  })
}
