import { Link } from "react-router-dom";

import { EmptyState } from "../components/ui/empty-state";

export function NotFoundPage() {
  return (
    <div className="py-10">
      <EmptyState
        title="Page not found"
        description="The page you requested does not exist."
        action={
          <Link to="/dashboard" className="text-sm font-semibold text-brand-700">
            Return to dashboard
          </Link>
        }
      />
    </div>
  );
}
