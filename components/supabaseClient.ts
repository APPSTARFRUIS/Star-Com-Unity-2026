import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env;

const supabaseUrl = metaEnv.VITE_SUPABASE_URL;
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Variables Supabase manquantes : VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY'
  );
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey
);