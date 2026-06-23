import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const shouldInit = supabaseUrl && supabaseAnonKey
  && supabaseUrl.startsWith('http')
  && supabaseUrl.length > 10
  && supabaseAnonKey.length > 10;

export const supabase = shouldInit
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
