# Famba Fleet

**Transport operations, run from one screen — built for Zimbabwean fleets, with no tracking hardware to buy.**

Famba Fleet turns each driver's own phone into a live tracker and gives the
operations office a single place to dispatch vehicles, watch them move in real
time, control fuel, and stay ahead of ZINARA / ZIMRA compliance — the exact
work a transport operator does every day.

---

## Why it's different

- **No hardware.** The driver opens a page on their phone and taps *Start trip* —
  their GPS streams to the office live. No trackers to import, fit or maintain.
- **Built for the local context.** ZINARA licences, ZIMRA route permits,
  insurance and fitness tracked with automatic expiry alerts — so a lapsed
  document never turns into a roadside fine. Updates go out on **WhatsApp**, the
  channel operators and clients already use.
- **Catches money leaks.** Every fuel fill is checked against the vehicle's
  healthy km/litre; abnormal fills are flagged as possible theft or faults — no
  fuel sensor required.
- **Speaks to managers.** One tap turns the fleet's status into a plain-English
  **cost-benefit insight** — fines avoided, fuel leakage, the actions that matter
  this week.

## What it covers

| Module | What it does |
|---|---|
| **Dashboard** | Live fleet map + every open alert at a glance |
| **Dispatch** | Assign vehicle & driver, move jobs to delivery, notify clients on WhatsApp |
| **Vehicles** | Fuel level, mileage and service health per vehicle |
| **Skips** | Waste / skip-hire asset lifecycle — yard → site → landfill, with automatic demurrage (over-rental) flags + AI revenue insight |
| **Fuel** | km/litre analysis with automatic anomaly flags |
| **Compliance** | ZINARA / ZIMRA / insurance / fitness expiry alerts + WhatsApp reminders |
| **Drivers** | Roster, performance scores, licence status |
| **Reports** | Exportable summaries + AI cost-benefit insight |
| **Driver app** | Phone-as-tracker: live GPS from the driver's own phone |
| **Client tracking** | A public link clients open to watch their delivery move |

## Tech

React 18 · Vite · Tailwind v4 · Leaflet · Supabase (Postgres + RLS) ·
**FastAPI** (Python) for analytics & AI insights · Gemini 2.5 Flash · Docker.

Deploys to **Netlify** (frontend) + **Render** (backend). Works on the bundled
demo data with zero configuration, or against a real Supabase project.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5182  — opens on demo data
```

Operator PIN: **1975**. See **Instructions.md** for setup, deploy and a full
feature walkthrough.

---

Built by [Noby Tebulo](https://nobie.netlify.app) · nobytechy@gmail.com
