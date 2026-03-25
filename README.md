# Vet Inventory System

Web-based inventory, invoicing, payment, and reporting system for a veterinary product distribution business. The app uses Supabase for database + authentication and is designed for a small internal staff team.

## Stack
- React + Vite + TypeScript
- React Router
- TanStack Query
- Tailwind CSS
- Supabase Auth + Postgres
- react-hook-form + zod
- xlsx
- jsPDF / html2canvas

## Local app setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment template:
   ```bash
   Copy-Item .env.example .env
   ```
3. Set these values in `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Start the app:
   ```bash
   npm run dev
   ```
5. Build for production:
   ```bash
   npm run build
   ```

## Supabase database setup
Run the SQL files in this order:

1. [schema.sql](/C:/Users/LENOVO/codes/WebStorm/LBYCPD2/vet-inventory-system/supabase/schema.sql)
2. [seed.sql](/C:/Users/LENOVO/codes/WebStorm/LBYCPD2/vet-inventory-system/supabase/seed.sql)

The schema file creates:
- inventory, invoices, payments, reports, and stock-movement tables
- auth-linked `app_users` table for internal staff access
- RPC functions for invoice finalization, invoice voiding, and payment recording
- Row Level Security policies that block anonymous access

The seed file loads demo inventory, invoices, stock history, and payments. It does not create Supabase Auth users.

## Authentication setup
This app is now staff-only. Public self-signup should stay off.

### Recommended Supabase Auth settings
In the Supabase dashboard:
- Go to `Authentication > Providers > Email`
- Keep email/password enabled
- Disable public signups for MVP
- Create staff accounts manually from `Authentication > Users`

### Create staff users
1. Create the auth user in `Authentication > Users`
2. Run [staff-users.sql](/C:/Users/LENOVO/codes/WebStorm/LBYCPD2/vet-inventory-system/supabase/staff-users.sql) after replacing the sample emails/names
3. Verify the user now has a matching row in `public.app_users`

You can also add a single staff user manually:

```sql
insert into public.app_users (id, email, full_name, role, is_active)
select
  id,
  email,
  'Jane Doe',
  'admin',
  true
from auth.users
where lower(email) = lower('jane@example.com')
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  is_active = excluded.is_active;
```

### Access states
- No session: redirected to `/login`
- Signed in + active `app_users` row: full app access
- Signed in + missing or inactive `app_users` row: redirected to `/access-blocked`

## Auth test flow
1. Create an auth user in Supabase
2. Insert a matching active row into `public.app_users`
3. Sign in at `/login`
4. Refresh a private page such as `/inventory` or `/dashboard` to confirm the session persists
5. Set `is_active = false` for that user in `public.app_users`
6. Refresh the app and confirm access is blocked
7. Use `Logout` in the top bar and confirm private routes redirect back to `/login`

## Current modules
- Dashboard summaries and recent activity
- Inventory with stock status, edit flow, and archive support
- Sales invoices with draft, finalize, cancel, and void flows
- Payments with receipt view
- Reports and stock movement history

## Project structure
- `docs/` business and workflow context
- `supabase/` schema, seed, and staff-user SQL helpers
- `src/app/` router and providers
- `src/components/` layout and shared UI
- `src/features/` module-specific logic
- `src/pages/` route-level pages
- `src/types/` shared database types
