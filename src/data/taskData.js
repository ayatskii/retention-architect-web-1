// Shared task detail data used by TaskDetail page and PDF export helper.
// Keyed by task ID (1, 2, 3) matching the PM Priority Tasks on Overview.

export const TASK_DATA = {
  1: {
    severity: 'critical',
    churnType: 'involuntary',
    affectedUsers: 8200,
    revenueAtRisk: 1_200_000,
    iconKey: 'CreditCard',
    rootCauses: [
      {
        iconKey: 'AlertTriangle',
        factor: '3DS Authentication Timeout',
        explanationKey: 'task1Cause1',
        contribution: 0.42,
      },
      {
        iconKey: 'CreditCard',
        factor: 'Card Processor Decline Rate',
        explanationKey: 'task1Cause2',
        contribution: 0.31,
      },
      {
        iconKey: 'Activity',
        factor: 'Retry Exhaustion',
        explanationKey: 'task1Cause3',
        contribution: 0.27,
      },
    ],
    segment: {
      avgLtv: 146,
      avgSessionFreq: 4.2,
      daysSincePayment: 3,
      paymentFailureRate: 0.68,
      points: [
        { x: 4.2, y: 0.32, a: 1 }, { x: 3.8, y: 0.28, a: 1 }, { x: 4.5, y: 0.25, a: 1 },
        { x: 3.6, y: 0.35, a: 1 }, { x: 4.1, y: 0.30, a: 1 }, { x: 3.9, y: 0.22, a: 1 },
        { x: 4.4, y: 0.38, a: 1 }, { x: 3.7, y: 0.27, a: 1 }, { x: 4.0, y: 0.33, a: 1 },
        { x: 4.3, y: 0.29, a: 1 }, { x: 4.6, y: 0.31, a: 1 }, { x: 3.5, y: 0.36, a: 1 },
        { x: 6.2, y: 0.72, a: 0 }, { x: 7.1, y: 0.81, a: 0 }, { x: 5.8, y: 0.65, a: 0 },
        { x: 7.5, y: 0.90, a: 0 }, { x: 2.1, y: 0.55, a: 0 }, { x: 1.8, y: 0.48, a: 0 },
        { x: 6.8, y: 0.78, a: 0 }, { x: 5.5, y: 0.60, a: 0 },
      ],
    },
    strategy: {
      nameKey: 'task1StrategyName',
      descKey: 'task1StrategyDesc',
      expectedRecovery: 0.31,
      projectedRevenue: 372_000,
      source: 'Strategy Lab → Smart Grace Period Protocol',
    },
    timeline: [
      { date: '2026-04-04T14:22Z', eventKey: 'task1Event1', type: 'detection', outcome: null },
      { date: '2026-04-04T15:30Z', eventKey: 'task1Event2', type: 'alert', outcome: null },
      { date: '2026-04-03T09:00Z', eventKey: 'task1Event3', type: 'intervention', outcome: '+22% recovery' },
      { date: '2026-03-28T11:15Z', eventKey: 'task1Event4', type: 'intervention', outcome: '+18% retry success' },
    ],
    model: {
      f1: 0.87, precision: 0.89, recall: 0.85,
      explanationKey: 'task1WhyRank',
    },
  },

  2: {
    severity: 'high',
    churnType: 'voluntary',
    affectedUsers: 14_300,
    revenueAtRisk: 860_000,
    iconKey: 'Eye',
    rootCauses: [
      {
        iconKey: 'TrendingDown',
        factor: 'Feature Adoption Stall',
        explanationKey: 'task2Cause1',
        contribution: 0.45,
      },
      {
        iconKey: 'Clock',
        factor: 'Session Frequency Decline',
        explanationKey: 'task2Cause2',
        contribution: 0.33,
      },
      {
        iconKey: 'Users',
        factor: 'Competitor Comparison Signal',
        explanationKey: 'task2Cause3',
        contribution: 0.22,
      },
    ],
    segment: {
      avgLtv: 89,
      avgSessionFreq: 1.8,
      daysSincePayment: 12,
      paymentFailureRate: 0.04,
      points: [
        { x: 1.8, y: 0.82, a: 1 }, { x: 2.1, y: 0.78, a: 1 }, { x: 1.5, y: 0.85, a: 1 },
        { x: 2.3, y: 0.75, a: 1 }, { x: 1.9, y: 0.80, a: 1 }, { x: 2.0, y: 0.77, a: 1 },
        { x: 1.6, y: 0.88, a: 1 }, { x: 2.2, y: 0.73, a: 1 }, { x: 1.7, y: 0.83, a: 1 },
        { x: 2.4, y: 0.71, a: 1 }, { x: 1.4, y: 0.90, a: 1 }, { x: 2.5, y: 0.69, a: 1 },
        { x: 5.2, y: 0.85, a: 0 }, { x: 6.1, y: 0.92, a: 0 }, { x: 4.8, y: 0.78, a: 0 },
        { x: 7.0, y: 0.95, a: 0 }, { x: 4.2, y: 0.32, a: 0 }, { x: 3.8, y: 0.28, a: 0 },
        { x: 5.8, y: 0.88, a: 0 }, { x: 6.5, y: 0.91, a: 0 },
      ],
    },
    strategy: {
      nameKey: 'task2StrategyName',
      descKey: 'task2StrategyDesc',
      expectedRecovery: 0.18,
      projectedRevenue: 154_800,
      source: 'Strategy Lab → Educational Retention',
    },
    timeline: [
      { date: '2026-04-03T08:00Z', eventKey: 'task2Event1', type: 'detection', outcome: null },
      { date: '2026-04-03T09:45Z', eventKey: 'task2Event2', type: 'alert', outcome: null },
      { date: '2026-03-20T14:00Z', eventKey: 'task2Event3', type: 'intervention', outcome: '−12% churn' },
    ],
    model: {
      f1: 0.87, precision: 0.89, recall: 0.85,
      explanationKey: 'task2WhyRank',
    },
  },

  3: {
    severity: 'review',
    churnType: 'involuntary',
    affectedUsers: 6400,
    revenueAtRisk: 480_000,
    iconKey: 'Clock3',
    rootCauses: [
      {
        iconKey: 'CreditCard',
        factor: 'Recurring Payment Failures',
        explanationKey: 'task3Cause1',
        contribution: 0.52,
      },
      {
        iconKey: 'Shield',
        factor: 'No Grace Period Active',
        explanationKey: 'task3Cause2',
        contribution: 0.30,
      },
      {
        iconKey: 'Activity',
        factor: 'High Engagement Despite Failure',
        explanationKey: 'task3Cause3',
        contribution: 0.18,
      },
    ],
    segment: {
      avgLtv: 178,
      avgSessionFreq: 6.1,
      daysSincePayment: 5,
      paymentFailureRate: 0.34,
      points: [
        { x: 6.1, y: 0.55, a: 1 }, { x: 5.8, y: 0.50, a: 1 }, { x: 6.4, y: 0.58, a: 1 },
        { x: 5.5, y: 0.48, a: 1 }, { x: 6.0, y: 0.52, a: 1 }, { x: 6.3, y: 0.60, a: 1 },
        { x: 5.7, y: 0.45, a: 1 }, { x: 6.2, y: 0.57, a: 1 }, { x: 5.9, y: 0.53, a: 1 },
        { x: 6.5, y: 0.62, a: 1 }, { x: 5.6, y: 0.47, a: 1 }, { x: 6.6, y: 0.59, a: 1 },
        { x: 2.1, y: 0.82, a: 0 }, { x: 1.8, y: 0.78, a: 0 }, { x: 7.2, y: 0.90, a: 0 },
        { x: 7.5, y: 0.92, a: 0 }, { x: 3.2, y: 0.35, a: 0 }, { x: 3.8, y: 0.28, a: 0 },
        { x: 4.5, y: 0.65, a: 0 }, { x: 5.0, y: 0.70, a: 0 },
      ],
    },
    strategy: {
      nameKey: 'task3StrategyName',
      descKey: 'task3StrategyDesc',
      expectedRecovery: 0.31,
      projectedRevenue: 148_800,
      source: 'Strategy Lab → Smart Grace Period Protocol',
    },
    timeline: [
      { date: '2026-04-04T10:00Z', eventKey: 'task3Event1', type: 'detection', outcome: null },
      { date: '2026-04-04T10:30Z', eventKey: 'task3Event2', type: 'alert', outcome: null },
      { date: '2026-04-01T16:00Z', eventKey: 'task3Event3', type: 'intervention', outcome: '+28% recovery' },
      { date: '2026-03-25T09:00Z', eventKey: 'task3Event4', type: 'intervention', outcome: '340 users recovered' },
    ],
    model: {
      f1: 0.87, precision: 0.89, recall: 0.85,
      explanationKey: 'task3WhyRank',
    },
  },
}

export const SEVERITY_COLORS = {
  critical: '#ff0055',
  high:     '#ff8800',
  review:   '#ccff00',
}
