import { createContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import type { Session } from "@supabase/supabase-js";

import { queryClient } from "../../lib/queryClient";
import { getSupabaseClient } from "../../lib/supabase";
import { isSupabaseConfigured } from "../../lib/env";
import { fetchAppUser } from "./api";
import type { AppUser, AuthContextValue } from "./types";

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsInitializing(false);
      return undefined;
    }

    const supabase = getSupabaseClient();
    let isMounted = true;

    const syncAuthState = async (nextSession: Session | null) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);

      if (!nextSession) {
        setAppUser(null);
        setIsInitializing(false);
        return;
      }

      setIsInitializing(true);

      try {
        const nextAppUser = await fetchAppUser(nextSession.user.id);

        if (isMounted) {
          setAppUser(nextAppUser);
        }
      } catch (error) {
        if (isMounted) {
          setAppUser(null);
        }
        console.error(error);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    void supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (error) {
          throw error;
        }

        await syncAuthState(data.session);
      })
      .catch((error) => {
        if (isMounted) {
          setSession(null);
          setAppUser(null);
          setIsInitializing(false);
        }
        console.error(error);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncAuthState(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      authUser: session?.user ?? null,
      appUser,
      isInitializing,
      isAuthenticated: Boolean(session),
      isApproved: Boolean(session && appUser?.is_active),
      signIn: async (email, password) => {
        const supabase = getSupabaseClient();
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw new Error(error.message);
        }
      },
      signOut: async () => {
        const supabase = getSupabaseClient();
        const { error } = await supabase.auth.signOut();

        if (error) {
          throw new Error(error.message);
        }

        queryClient.clear();
      },
      refreshAppUser: async () => {
        if (!session) {
          setAppUser(null);
          return;
        }

        const nextAppUser = await fetchAppUser(session.user.id);
        setAppUser(nextAppUser);
      },
    }),
    [appUser, isInitializing, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
