import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createClient() {
  const projectUrl = import.meta.env.VITE_PROJECT_URL;
  const publicKey = import.meta.env.VITE_SUPABASE_PUBLIC_ANON_KEY;

  return createSupabaseClient(projectUrl, publicKey);
}
