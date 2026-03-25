import { Navigate, Outlet, useLocation } from "react-router-dom";

import { Card } from "../../components/ui/card";
import { useAuth } from "./use-auth";

export function ProtectedRoute() {
  const { isApproved, isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
        <Card className="w-full max-w-md">
          <p className="text-sm text-slate-600">Checking your session...</p>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isApproved) {
    return <Navigate to="/access-blocked" replace />;
  }

  return <Outlet />;
}
