import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../types/database";
import { env, isSupabaseConfigured } from "./env";

let client: SupabaseClient<Database> | null = null;

if (isSupabaseConfigured) {
  client = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export const supabase = client;

export function getSupabaseClient() {
  if (!client) {
    throw new Error("Supabase environment variables are missing. Check your .env file.");
  }

  return client;
}
