/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Só inicializa o cliente se as variáveis estiverem configuradas.
// O cast para SupabaseClient preserva a tipagem em db.ts mesmo sem as envs.
export const supabase: SupabaseClient = (
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null
) as SupabaseClient;

// ── Helpers ──────────────────────────────────────────────────────────────────
export const isSupabaseConfigured = (): boolean =>
  supabaseUrl !== '' && supabaseAnonKey !== '';
