# Vet Inventory System

Phase 1 scaffold for a web-based prototype used by a veterinary product distribution business. This stage sets up the app shell, routing, shared UI primitives, Supabase wiring, and TanStack Query. Inventory, invoices, payments, alerts, and reports are still placeholder modules.

## Stack
- React + Vite + TypeScript
- React Router
- TanStack Query
- Tailwind CSS
- Supabase
- react-hook-form + zod
- xlsx
- jsPDF

## Local setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment template:
   ```bash
   copy .env.example .env
   ```
3. Add your Supabase project values to `.env`:
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

## Supabase setup
Use the SQL files in [`supabase/schema.sql`](/C:/Users/LENOVO/codes/WebStorm/LBYCPD2/vet-inventory-system/supabase/schema.sql) and [`supabase/seed.sql`](/C:/Users/LENOVO/codes/WebStorm/LBYCPD2/vet-inventory-system/supabase/seed.sql) to create the demo schema and seed sample data.

## Current app status
- App shell with responsive sidebar and header
- Route structure for dashboard, inventory, invoices, payments, reports, receipts, and stock movements
- Shared page/layout/UI primitives
- Supabase client setup
- TanStack Query provider setup

## Still placeholder
- Inventory CRUD and stock adjustment logic
- Invoice draft/finalize/void workflow
- Payment recording and receipt generation
- Alerts and reporting queries
- Excel and PDF export actions

## Project structure
- `docs/` business and product context
- `supabase/` SQL schema and seed files
- `src/app/` app router and providers
- `src/components/` layout, shared UI, and placeholders
- `src/lib/` client setup, constants, and utilities
- `src/pages/` route-level pages
- `src/types/` shared types
