import { Navigate } from "react-router-dom";

import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useAuth } from "../features/auth/use-auth";

export function AccessBlockedPage() {
  const { appUser, authUser, isApproved, isAuthenticated, isInitializing, signOut } = useAuth();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
        <Card className="w-full max-w-md">
          <p className="text-sm text-slate-600">Checking your access...</p>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isApproved) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-8">
      <Card className="w-full max-w-xl">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Access blocked</div>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">This account is not approved for system access</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {appUser && !appUser.is_active
            ? "Your staff account is currently inactive. Contact an administrator to reactivate it."
            : "Your email is signed in, but it does not have an active staff profile in this system yet. Ask an administrator to add or activate your account."}
        </p>
        <div className="mt-5 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-slate-700">
          Signed in as {appUser?.email ?? authUser?.email ?? "Unknown account"}
        </div>
        <div className="mt-6 flex justify-end">
          <Button
            onClick={async () => {
              await signOut();
            }}
          >
            Logout
          </Button>
        </div>
      </Card>
    </div>
  );
}
