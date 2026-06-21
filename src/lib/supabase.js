import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON

// Configured only when real keys are present. Otherwise the app runs entirely
// on the bundled synthetic seed so the shared link is never blank.
export const SUPABASE_READY = Boolean(url && anon)

export const supabase = SUPABASE_READY ? createClient(url, anon) : null

export const API_BASE = import.meta.env.VITE_API_BASE || ''
