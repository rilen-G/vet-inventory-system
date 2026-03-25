import type { Session, User } from "@supabase/supabase-js";

import type { Database } from "../../types/database";

export type AppUser = Database["public"]["Tables"]["app_users"]["Row"];

export type AuthContextValue = {
  session: Session | null;
  authUser: User | null;
  appUser: AppUser | null;
  isInitializing: boolean;
  isAuthenticated: boolean;
  isApproved: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAppUser: () => Promise<void>;
};
