# Famba Fleet — Integrations & advanced features

Everything below is **wired in code with safe fallbacks** — the app works fully
without any of these. Add the keys when a client is ready to go beyond the
free/in-app behaviour.

## What's live with no setup

| Feature | How it works out of the box |
|---|---|
| Proof of delivery | Photo + signature captured on delivery, shown on the client tracking link |
| Reverse geocoding | Street names via OpenStreetMap Nominatim (free, no key) |
| PDF export | Reports / invoices / payroll print to PDF via the browser (no library) |
| Trip replay | Animates the route on a map |
| Geofence / route deviation | Alerts when a vehicle leaves the operating zone (`OPERATING_ZONE` in `src/lib/config.js`) |
| Driver-licence expiry | Folded into the compliance alert pipeline |
| Analytics, Billing, Payroll | Computed from live data |
| Odometer photo | Optional anti-fraud photo on each refuel |
| WhatsApp updates | `wa.me` deep links (no API needed) |

## Optional providers (add keys in Render → backend env)

### SMS fallback — Africa's Talking (great for SOS without data)
```
AT_USERNAME=your_at_username
AT_API_KEY=your_at_api_key
```
Endpoint: `POST /api/sms { to, text }`. Without keys → `{sent:false}` and the
app keeps using in-app alerts.

### WhatsApp Cloud API (automated, beyond wa.me links)
```
WHATSAPP_TOKEN=EAAG...
WHATSAPP_PHONE_ID=1234567890
```
Endpoint: `POST /api/whatsapp { to, text }`.

### Web push (alerts when the tab is closed)
Requires VAPID keys + a subscriptions store + switching the PWA to the
`injectManifest` strategy so the service worker can handle `push` events.
```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```
Backend stub: `POST /api/push`. Wire `pywebpush` once subscriptions are stored.

### AI cost-benefit insights — Gemini (already supported)
```
GEMINI_API_KEY=...          # free tier at https://aistudio.google.com/apikey
```

## Native app — true background GPS (Capacitor)

The PWA cannot track GPS when the app is fully closed (OS limitation). To get
always-on background tracking + background SOS, wrap the same build with
Capacitor:

```bash
npm i @capacitor/core @capacitor/cli @capacitor/geolocation
npm i @capacitor-community/background-geolocation
npx cap init        # config already provided in capacitor.config.json
npm run build && npx cap add android && npx cap sync
npx cap open android
```

Then swap the driver portal's `navigator.geolocation.watchPosition` for the
background-geolocation plugin (same lat/lng/speed shape) so tracking continues
with the app backgrounded or closed.

## White-labelling for each client

Single-tenant by design — per client:
1. Clone the repo.
2. Set company name/contacts in **Settings** (saved to `localStorage`), or edit
   defaults in `src/lib/config.js`.
3. Swap the logo in `src/components/Logo.jsx` and the brand colours in
   `src/index.css` (`--brand`, `--accent`).
4. Point `.env` at that client's Supabase project and deploy.

---
Built by [Noby Tebulo](https://nobie.netlify.app) · nobytechy@gmail.com
