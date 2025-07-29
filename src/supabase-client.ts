import { createClient } from "@supabase/supabase-js";

const supabaseURL = process.env["NEXT_PUBLIC_SUPABASE_URL"] as string;
const supabaseAnonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] as string;

export const supabase = createClient(supabaseURL, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    debug: false,
  },
});

export { supabaseURL, supabaseAnonKey };
