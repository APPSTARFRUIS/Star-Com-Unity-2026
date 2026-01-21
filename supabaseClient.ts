
import { createClient } from '@supabase/supabase-js';

// Utilisation des clés fournies directement pour garantir le fonctionnement immédiat
const supabaseUrl = 'https://akavrfcxnffhxclalvcw.supabase.co';
const supabaseAnonKey = 'sb_publishable_XVBf9w_ZULwrbX10maIr6Q_PrKCdPKS';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = true;
