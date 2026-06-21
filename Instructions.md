# Famba Fleet — Setup, Deploy & Walkthrough

This is the operator manual + deployment runbook. The app runs in two modes:

- **Demo mode** (default) — no setup. The bundled synthetic Harare fleet loads
  and the vehicles move on the map. Perfect for a shareable link / pitch.
- **Live mode** — add a Supabase project and the data becomes real and
  persistent. Add the FastAPI backend for live phone tracking + AI insights.

---

## 1. Run locally

```bash
npm install
npm run dev
```

Open **http://localhost:5182**, sign in with PIN **1975**.

The driver app is at **/driver**, and any delivery's public tracking page is at
**/track/FMB-2041** (try that reference).

---

## 2. Feature walkthrough (use this on the call)

1. **Dashboard** — vehicles move live around Harare; the right column shows
   compliance and fuel alerts pulled straight from the data.
2. **Dispatch** — assign a vehicle to the *Pending* job, hit **Advance** to move
   it through to delivery, then **Notify** to open WhatsApp with a pre-filled
   status + tracking link.
3. **Compliance** — note the **expired** (red) and **≤14-day** documents. Hit the
   WhatsApp icon to send a renewal reminder to the driver.
4. **Fuel** — vehicle **ACD 9087** has a flagged fill (≈55% of normal km/litre).
   Add a new refuel and watch it get analysed instantly.
5. **Reports** → **Generate insight** — turns the fleet status into a
   plain-English cost-benefit case (AI when the backend key is set).
6. **Driver app** (`/driver`) — open on a phone, tap **Start trip**, allow
   location: that vehicle now shows the real phone position on the office map.

---

## 3. Go live with Supabase (10 min)

1. Create a Supabase project (or reuse one — tables are namespaced `famba_`).
2. **SQL Editor → paste `supabase/install.sql` → Run.** Idempotent; safe to
   re-run. It creates the tables and the demo seed.
3. Copy `.env.example` → `.env` and fill:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON=eyJ...           # Settings → API → anon public
   ```
4. `npm run dev` again — the header badge flips from **Demo data** to **Live data**.

> The RLS policies in `install.sql` are intentionally open so the PIN-gated demo
> (anon key) can read/write. Tighten to authenticated-only before a real client
> goes live with their own data.

---

## 4. Deploy

### Frontend → Netlify
- Import the repo (or drag the `dist/` folder).
- Build command `npm run build`, publish dir `dist` (already in `netlify.toml`).
- Set env vars `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON`, and `VITE_API_BASE`
  (your Render URL) → redeploy.

### Backend → Render
- New **Blueprint** from the repo → Render reads `render.yaml`.
- Optional: paste `GEMINI_API_KEY` (free at https://aistudio.google.com/apikey)
  to enable AI-written insights. Without it, insights still work (computed).
- After deploy, set the frontend's `VITE_API_BASE` to the Render URL.

Run the backend locally instead:
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env          # optionally add GEMINI_API_KEY
uvicorn main:app --reload --port 8000
# docs at http://localhost:8000/docs
```

---

## 5. What's real vs. simulated

- **Real:** all dashboards, dispatch flow, fuel analysis, compliance alerts,
  WhatsApp messages, CSV export, the driver app's phone GPS, the AI insights API.
- **Simulated for the demo:** the fleet's continuous movement on the map (so the
  link looks alive without needing six phones streaming). The moment a real
  driver opens `/driver` and starts a trip, that vehicle switches to true GPS.

---

Built by [Noby Tebulo](https://nobie.netlify.app) · nobytechy@gmail.com
