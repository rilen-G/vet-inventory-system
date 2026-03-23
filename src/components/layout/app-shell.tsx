import { Outlet } from "react-router-dom";

import { Topbar } from "./topbar";

export function AppShell() {
  return (
    <div className="min-h-screen bg-stone-100 text-ink">
      <Topbar />
      <main className="mx-auto w-full max-w-[1720px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
