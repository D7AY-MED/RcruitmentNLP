import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const shouldInit = supabaseUrl && supabaseAnonKey
  && supabaseUrl.startsWith('http')
  && supabaseUrl.length > 10
  && supabaseAnonKey.length > 10;

export const supabase = shouldInit
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
