import { createClient } from "@supabase/supabase-js";

const supabaseURL = process.env["NEXT_PUBLIC_SUPABASE_URL"] || "";
const supabaseAnonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] || "";

// ビルド時に環境変数がない場合の処理を改善
const isBuildTime =
  typeof window === "undefined" && !supabaseURL && !supabaseAnonKey;

if (!supabaseURL || !supabaseAnonKey) {
  if (isBuildTime) {
    console.warn(
      "Building with dummy Supabase credentials. Environment variables should be set at runtime.",
    );
  } else {
    throw new Error(
      "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
    );
  }
}

// ダミー値を使用する場合
const finalURL = supabaseURL || "https://dummy.supabase.co";
const finalKey = supabaseAnonKey || "dummy-anon-key";

export const supabase = createClient(finalURL, finalKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    debug: false,
  },
});

export { supabaseURL, supabaseAnonKey };
