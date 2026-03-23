import { EmptyState } from "../ui/empty-state";

export function SupabaseRequired() {
  return (
    <EmptyState
      title="Supabase setup required"
      description="Add your Supabase URL and anon key in the local .env file, then run the SQL in supabase/schema.sql and supabase/seed.sql before using this module."
    />
  );
}

