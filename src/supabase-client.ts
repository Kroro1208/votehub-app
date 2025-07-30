import { createClient } from "@supabase/supabase-js";

const supabaseURL = process.env["NEXT_PUBLIC_SUPABASE_URL"] || "";
const supabaseAnonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] || "";

if (!supabaseURL || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
  );
}

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
