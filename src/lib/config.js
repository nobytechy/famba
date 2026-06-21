// App-level config. Company/branding is the multi-tenant foundation — when you
// resell Famba Fleet, each deployment (or org row) overrides these.
const KEY = 'famba_company'

const DEFAULT_COMPANY = {
  name: 'Famba Logistics',
  email: 'ops@fambafleet.co.zw',
  phone: '263772110571',
  currency: 'USD',
}

export function getCompany() {
  try { return { ...DEFAULT_COMPANY, ...JSON.parse(localStorage.getItem(KEY) || '{}') } }
  catch { return DEFAULT_COMPANY }
}
export function saveCompany(patch) {
  const next = { ...getCompany(), ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* noop */ }
  return next
}

// Operating area for geofence / route-deviation checks (Harare metro).
export const OPERATING_ZONE = { center: [-17.8252, 31.0335], radiusKm: 45 }

// Driver pay model used by the Payroll page.
export const PAY = { perKmUsd: 0.25, perTripUsd: 3 }
