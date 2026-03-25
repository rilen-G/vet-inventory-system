import { Navigate, useLocation } from "react-router-dom";
import { useState } from "react";

import { SupabaseRequired } from "../components/feedback/supabase-required";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { isSupabaseConfigured } from "../lib/env";
import { useZodForm } from "../lib/forms";
import { loginSchema, type LoginValues } from "../features/auth/schemas";
import { useAuth } from "../features/auth/use-auth";

function fieldError(message?: string) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-rose-700">{message}</p>;
}

export function LoginPage() {
  const location = useLocation();
  const { isApproved, isAuthenticated, isInitializing, signIn } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useZodForm(loginSchema, {
    email: "",
    password: "",
  });
  const redirectTo = typeof location.state === "object" && location.state && "from" in location.state
    ? (location.state.from as { pathname?: string })?.pathname ?? "/dashboard"
    : "/dashboard";

  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
        <div className="w-full max-w-xl">
          <SupabaseRequired />
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
        <Card className="w-full max-w-md">
          <p className="text-sm text-slate-600">Checking your session...</p>
        </Card>
      </div>
    );
  }

  if (isAuthenticated && isApproved) {
    return <Navigate to={redirectTo} replace />;
  }

  if (isAuthenticated && !isApproved) {
    return <Navigate to="/access-blocked" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-8">
      <Card className="w-full max-w-md border-[#c9ab67]/55">
        <div className="text-center">
          <img
            src="/company_logo.png"
            alt="L.B. Veterinary Products Trading"
            className="mx-auto h-40 w-40 object-contain"
          />
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">Staff sign in</h1>
        </div>

        <form
          className="mt-6 space-y-5"
          onSubmit={form.handleSubmit(async (values: LoginValues) => {
            setSubmitError(null);

            try {
              await signIn(values.email, values.password);
            } catch (error) {
              setSubmitError(error instanceof Error ? error.message : "Unable to sign in.");
            }
          })}
        >
          {submitError ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{submitError}</div> : null}

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              className="border-[#c9ab67]/55 focus:border-[#b89443] focus:ring-[#efe2bc]"
              {...form.register("email")}
            />
            {fieldError(form.formState.errors.email?.message)}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              className="border-[#c9ab67]/55 focus:border-[#b89443] focus:ring-[#efe2bc]"
              {...form.register("password")}
            />
            {fieldError(form.formState.errors.password?.message)}
          </div>

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
