import { getSupabaseClient } from "../../lib/supabase";
import type { AppUser } from "./types";

export async function fetchAppUser(userId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("app_users").select("*").eq("id", userId).maybeSingle<AppUser>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}
