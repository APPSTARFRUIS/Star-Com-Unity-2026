
import { createClient } from '@supabase/supabase-js';

// Vite remplace ces valeurs au moment du build sur Vercel. 
// Assurez-vous que les noms dans Vercel sont exactement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
// Fix: Accessing Vite environment variables using type assertion to bypass TS 'Property env does not exist on type ImportMeta' error
const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || 'https://akavrfcxnffhxclalvcw.supabase.co';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || 'sb_publishable_XVBf9w_ZULwrbX10maIr6Q_PrKCdPKS';

export const supabase = (supabaseUrl && supabaseUrl.startsWith('http')) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));
