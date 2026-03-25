/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = supabaseUrl !== '' && supabaseAnonKey !== '';

if (!isSupabaseConfigured) {
  console.error(
    '⚠️ Supabase não configurado!\n' +
    'Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env\n' +
    'O app funcionará sem persistência de dados.'
  );
}

// Só cria o cliente se as variáveis estiverem configuradas.
// Caso contrário, evita crash ao chamar createClient com strings vazias.
export const supabase: SupabaseClient = (
  isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null
) as SupabaseClient;
