"""
Famba Fleet — backend services (FastAPI).

The robust / AI layer that sits alongside the React app:
  • POST /api/ingest          live GPS pings from the driver phone app
  • GET  /api/positions       latest known position per vehicle
  • POST /api/analytics/fuel  server-side fuel km/litre anomaly detection
  • POST /api/insights        AI-written (Gemini) cost-benefit narrative, with
                              a deterministic fallback when no key is set
  • GET  /api/health          liveness + config flags

The frontend works without this service (it talks to Supabase directly); the
backend adds heavier analytics and the LLM insights endpoint.
"""
from __future__ import annotations

import os
import time
from typing import Optional

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
CORS = os.getenv("ALLOW_CORS_ORIGINS", "*")

app = FastAPI(title="Famba Fleet API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in CORS.split(",")] if CORS != "*" else ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory latest position per vehicle (a Redis/Postgres store in production).
_positions: dict[str, dict] = {}
# Recent driver/trip alerts (background, closed). Ring-buffered.
_alerts: list[dict] = []


# ---------------------------------------------------------------- models -----
class Ping(BaseModel):
    vehicle_id: str
    lat: float
    lng: float
    speed_kmh: float = 0.0


class FuelLog(BaseModel):
    vehicle_id: str
    vehicle_type: str = "Truck"
    litres: float
    kmpl: float
    date: Optional[str] = None


class FuelBatch(BaseModel):
    logs: list[FuelLog]


class FleetSummary(BaseModel):
    vehicles: int = 0
    active_jobs: int = 0
    delivered: int = 0
    fuel_spend_usd: int = 0
    fuel_flags: int = 0
    compliance_expired: int = 0
    compliance_critical: int = 0
    service_due: int = 0


# ---------------------------------------------------------------- routes -----
@app.get("/api/health")
def health():
    return {"ok": True, "ai": bool(GEMINI_KEY), "tracked_vehicles": len(_positions)}


@app.post("/api/ingest")
def ingest(p: Ping):
    _positions[p.vehicle_id] = {
        "vehicle_id": p.vehicle_id, "lat": p.lat, "lng": p.lng,
        "speed_kmh": p.speed_kmh, "ts": time.time(),
    }
    return {"ok": True, "stored": p.vehicle_id}


@app.get("/api/positions")
def positions():
    return {"positions": list(_positions.values())}


class TripEvent(BaseModel):
    kind: str = "driver_event"          # driver_background | driver_closed
    driver_id: Optional[str] = None
    driver_name: Optional[str] = None
    vehicle_id: Optional[str] = None
    vehicle_reg: Optional[str] = None
    severity: str = "warning"
    message: str = ""
    ts: Optional[float] = None


@app.post("/api/trip-event")
async def trip_event(ev: TripEvent):
    """Receives sendBeacon alerts when a driver backgrounds/closes a live trip."""
    rec = ev.model_dump()
    rec["received_at"] = time.time()
    _alerts.append(rec)
    del _alerts[:-200]                   # keep last 200
    return {"ok": True}


@app.get("/api/alerts")
def alerts(since: float = 0.0):
    """Admin console polls this to surface driver alerts cross-device."""
    return {"alerts": [a for a in _alerts if a.get("received_at", 0) > since]}


BASELINE = {"Truck": 2.6, "Van": 8.2, "Pickup": 9.1}


@app.post("/api/analytics/fuel")
def analyse_fuel(batch: FuelBatch):
    """Flag fills whose km/litre falls below 70% of the type's healthy baseline."""
    out = []
    for log in batch.logs:
        expected = BASELINE.get(log.vehicle_type, 6.0)
        ratio = (log.kmpl / expected) if expected else 1.0
        if ratio < 0.7:
            out.append({
                "vehicle_id": log.vehicle_id, "date": log.date,
                "kmpl": round(log.kmpl, 2), "expected": expected,
                "ratio": round(ratio, 2),
                "estimated_loss_usd": round((expected - log.kmpl) / expected * 90, 2),
            })
    out.sort(key=lambda x: x["ratio"])
    return {"anomalies": out, "count": len(out)}


def _fallback_insight(s: FleetSummary) -> dict:
    fines = s.compliance_expired * 700 + s.compliance_critical * 200
    fuel_leak_month = s.fuel_flags * 90
    return {
        "narrative": (
            f"Across {s.vehicles} vehicles, the fleet currently shows {s.compliance_expired} expired and "
            f"{s.compliance_critical} near-expiry documents, {s.fuel_flags} fuel anomalies and {s.service_due} "
            f"services due. Acting now avoids roughly ${fines:,} in ZINARA/ZIMRA fines and about "
            f"${fuel_leak_month:,}/month of fuel leakage, while overdue servicing is the leading cause of "
            f"unplanned breakdowns."
        ),
        "savings_usd": int(fines + fuel_leak_month * 12),
        "actions": [
            f"Renew {s.compliance_expired} expired document(s) before those vehicles run again."
            if s.compliance_expired else "All documents valid — keep the alert window at 30 days.",
            f"Investigate {s.fuel_flags} flagged refuel(s) for siphoning or faults."
            if s.fuel_flags else "Fuel efficiency within normal range.",
            f"Schedule {s.service_due} service(s) now to prevent roadside breakdowns."
            if s.service_due else "No services overdue.",
        ],
    }


async def _gemini_insight(s: FleetSummary) -> Optional[dict]:
    prompt = (
        "You are a fleet-operations analyst in Zimbabwe. Given this fleet status JSON, write a concise "
        "cost-benefit insight for a transport manager. Return STRICT JSON with keys: narrative (string, "
        "2-3 sentences referencing ZINARA/ZIMRA fines, fuel leakage and breakdown risk), savings_usd "
        "(integer, estimated annual value protected) and actions (array of 3 short imperative strings). "
        f"Fleet status: {s.model_dump_json()}"
    )
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
        f"?key={GEMINI_KEY}"
    )
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.4, "responseMimeType": "application/json"},
    }
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(url, json=body)
            r.raise_for_status()
            text = r.json()["candidates"][0]["content"]["parts"][0]["text"]
            import json
            data = json.loads(text)
            data["source"] = "ai"
            return data
    except Exception:
        return None


@app.post("/api/insights")
async def insights(s: FleetSummary):
    if GEMINI_KEY:
        ai = await _gemini_insight(s)
        if ai:
            return ai
    return {**_fallback_insight(s), "source": "fallback"}


class SkipSummary(BaseModel):
    total_skips: int = 0
    in_yard: int = 0
    on_site: int = 0
    overdue_skips: int = 0
    demurrage_at_risk_usd: int = 0
    idle_ratio: int = 0


def _fallback_skip_insight(s: SkipSummary) -> dict:
    return {
        "narrative": (
            f"Of {s.total_skips} skips, {s.overdue_skips} are past their free rental period — that's "
            f"${s.demurrage_at_risk_usd:,} in demurrage billable today. Meanwhile {s.in_yard} skip(s) sit idle "
            f"in the yard ({s.idle_ratio}% of the fleet) earning nothing; redeploying those lifts utilisation fastest."
        ),
        "savings_usd": int(s.demurrage_at_risk_usd * 4),
        "actions": [
            f"Invoice demurrage on {s.overdue_skips} over-rental skip(s) before collection."
            if s.overdue_skips else "No skips over rental — billing is current.",
            f"Deploy {s.in_yard} idle skip(s) to push utilisation above 80%."
            if s.in_yard else "Yard is empty — every skip is earning.",
            "Cluster collections by area to cut truck fuel and turnaround time.",
        ],
    }


async def _gemini_skip_insight(s: SkipSummary) -> Optional[dict]:
    prompt = (
        "You are a waste / skip-hire operations analyst in Zimbabwe. Given this skip-fleet status JSON, write a "
        "concise revenue-focused insight for the operations manager. Return STRICT JSON with keys: narrative "
        "(string, 2-3 sentences on demurrage recovery and idle-skip utilisation), savings_usd (integer, estimated "
        "annual value protected) and actions (array of 3 short imperative strings). "
        f"Skip status: {s.model_dump_json()}"
    )
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
        f"?key={GEMINI_KEY}"
    )
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.4, "responseMimeType": "application/json"},
    }
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(url, json=body)
            r.raise_for_status()
            text = r.json()["candidates"][0]["content"]["parts"][0]["text"]
            import json
            data = json.loads(text)
            data["source"] = "ai"
            return data
    except Exception:
        return None


@app.post("/api/skips-insight")
async def skips_insight(s: SkipSummary):
    if GEMINI_KEY:
        ai = await _gemini_skip_insight(s)
        if ai:
            return ai
    return {**_fallback_skip_insight(s), "source": "fallback"}


# --------------------------------------------------------------- messaging ---
# All three degrade gracefully: if the provider keys aren't set they return
# {sent: false, reason: "..."} so the app keeps working (e.g. via wa.me links).

class Msg(BaseModel):
    to: str
    text: str


@app.post("/api/sms")
async def send_sms(m: Msg):
    """SMS fallback via Africa's Talking (ideal for SOS where there's no data)."""
    user = os.getenv("AT_USERNAME")
    key = os.getenv("AT_API_KEY")
    if not (user and key):
        return {"sent": False, "reason": "AT_USERNAME / AT_API_KEY not configured"}
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.post(
                "https://api.africastalking.com/version1/messaging",
                headers={"apiKey": key, "Content-Type": "application/x-www-form-urlencoded"},
                data={"username": user, "to": m.to, "message": m.text},
            )
            return {"sent": r.status_code == 201, "status": r.status_code}
    except Exception as e:
        return {"sent": False, "reason": str(e)}


@app.post("/api/whatsapp")
async def send_whatsapp(m: Msg):
    """WhatsApp via Meta Cloud API. Without a token the frontend uses wa.me links."""
    token = os.getenv("WHATSAPP_TOKEN")
    phone_id = os.getenv("WHATSAPP_PHONE_ID")
    if not (token and phone_id):
        return {"sent": False, "reason": "WHATSAPP_TOKEN / WHATSAPP_PHONE_ID not configured"}
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.post(
                f"https://graph.facebook.com/v20.0/{phone_id}/messages",
                headers={"Authorization": f"Bearer {token}"},
                json={"messaging_product": "whatsapp", "to": m.to, "type": "text", "text": {"body": m.text}},
            )
            return {"sent": r.status_code == 200, "status": r.status_code}
    except Exception as e:
        return {"sent": False, "reason": str(e)}


@app.post("/api/push")
def web_push(payload: dict):
    """Web push placeholder. Enable by adding VAPID keys + a subscriptions store."""
    if not os.getenv("VAPID_PRIVATE_KEY"):
        return {"sent": False, "reason": "VAPID_PRIVATE_KEY not configured — see INTEGRATIONS.md"}
    return {"sent": False, "reason": "wire pywebpush with stored subscriptions"}


@app.get("/")
def root():
    return {"service": "Famba Fleet API", "docs": "/docs"}
