import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const cleanEnvValue = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/^["']+|["']+$/g, '');
};

const supabaseUrl = cleanEnvValue(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = cleanEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabaseConfigErrorMessage = !isSupabaseConfigured
  ? 'Supabase 환경변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)가 설정되지 않았습니다.'
  : null;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
