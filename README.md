# Retention Architect Engine

> **HackNU 2026** — AI-powered customer churn intelligence platform

A futuristic, high-contrast command center for diagnosing, predicting, and reversing subscriber churn in real time.

---

## Overview

The **Retention Architect Engine** is a full-stack AI diagnostic dashboard that:

- **Classifies churn** into three segments: Healthy, Involuntary (payment/technical), and Voluntary (behavioral)
- **Scores users** in real time using a multi-factor ML risk model
- **Explains decisions** with human-readable factor breakdowns (Explainable AI)
- **Recommends interventions** automatically — from payment retries to CSM outreach

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite (SWC) |
| Styling | Tailwind CSS v3 |
| Animation | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |

---

## Design System

| Token | Value | Usage |
|---|---|---|
| `brand` | `#ccff00` | Primary accent, CTA buttons, healthy state |
| `background` | `#000000` | App background |
| `surface` | `#0a0a0a` | Cards, sidebar |
| `error` | `#ff0055` | Voluntary churn, critical alerts |
| `muted` | `#1a1a1a` | Borders, dividers |

Typography base is set to **20px** (25% larger than standard) with **Inter** for maximum legibility on dark backgrounds.

---

## Features

### Diagnostic Dashboard
- Hero KPI tiles: Recoverable Assets (22,500), Total Ecosystem (90,000), Voluntary Churn (22,500)
- Activity BarChart comparing avg engagement days across segments
- Technical Failure Donut with cause breakdown
- Live risk alert feed with severity classification

### Deep Scan
- User ID lookup with simulated async analysis
- Risk Analysis Card with explainability factors
- Color-coded severity (Critical / Warning / Healthy)
- AI-generated intervention recommendation

### Analytics
- 7-month churn vs recovery area chart
- KPI cards: prediction accuracy, recovery rate, ARR recovered

### Risk Alerts
- Actionable ML-triggered behavioral anomaly feed
- One-click intervention dispatch buttons

---

## Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

---

## Team

Built with precision at **HackNU 2026** — Kazakhstan's premier hackathon.

---

*"Every churned user is a recoverable signal."*
