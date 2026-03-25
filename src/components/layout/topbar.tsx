import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import { useAuth } from "../../features/auth/use-auth";
import { primaryNavItems } from "../../lib/constants";
import { cn } from "../../lib/utils";
import { MenuIcon } from "./topbar-menu";

export function Topbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const location = useLocation();
  const { appUser, authUser, signOut } = useAuth();
  const rawUserLabel = appUser?.full_name?.trim() || appUser?.email || authUser?.email || "Staff user";
  const userLabel = rawUserLabel.replace(/^Demo\s+/i, "");

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/88 backdrop-blur-xl">
      <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-8">
        <div className="relative flex min-h-[72px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#c9ab67]/45 bg-[#fcfaf4] text-[#b89443] transition hover:border-[#b89443] hover:text-[#8f6a1d] md:hidden"
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            >
              <MenuIcon />
            </button>

            <div className="hidden min-w-0 md:block">
              <div className="truncate text-sm font-semibold uppercase tracking-[0.18em] text-[#b89443]">
                L.B. Veterinary Products Trading
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 flex-col items-center text-center leading-tight text-[#b89443] md:hidden">
            <span className="whitespace-nowrap text-[0.72rem] font-semibold uppercase tracking-[0.16em]">L.B. Veterinary</span>
            <span className="whitespace-nowrap text-[0.66rem] font-medium uppercase tracking-[0.14em]">Products Trading</span>
          </div>

          <div className="hidden min-w-0 items-center gap-3 md:ml-auto md:flex">
            <div className="max-w-[220px] truncate text-sm text-slate-500">{userLabel}</div>
            <nav className="min-w-0 items-center gap-2 md:flex">
              {primaryNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition",
                      isActive ? "bg-[#b89443] text-white" : "text-[#b89443] hover:bg-[#fcfaf4] hover:text-[#8f6a1d]",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <button
              type="button"
              onClick={async () => {
                setIsSigningOut(true);

                try {
                  await signOut();
                } finally {
                  setIsSigningOut(false);
                }
              }}
              className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium text-[#b89443] transition hover:bg-[#fcfaf4] hover:text-[#8f6a1d] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSigningOut}
            >
              {isSigningOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>

        <div
          className={cn(
            "overflow-hidden transition-[max-height,opacity,padding] duration-200 md:hidden",
            mobileOpen ? "max-h-96 opacity-100 pb-4" : "max-h-0 opacity-0",
          )}
        >
          <nav className="grid gap-2 border-t border-stone-200 pt-4">
            {primaryNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-2xl border px-4 py-3 transition",
                    isActive
                      ? "border-[#b89443] bg-[#b89443] text-white"
                      : "border-[#c9ab67]/45 bg-white text-[#b89443] hover:border-[#b89443] hover:bg-[#fcfaf4]",
                  )
                }
              >
                <div className="text-sm font-semibold">{item.label}</div>
              </NavLink>
            ))}
            <div className="rounded-2xl border border-[#c9ab67]/35 bg-[#fcfaf4] px-4 py-3 text-sm text-slate-600">{userLabel}</div>
            <button
              type="button"
              onClick={async () => {
                setIsSigningOut(true);

                try {
                  await signOut();
                } finally {
                  setIsSigningOut(false);
                }
              }}
              className="rounded-2xl border border-[#c9ab67]/45 bg-white px-4 py-3 text-left text-sm font-semibold text-[#b89443] transition hover:border-[#b89443] hover:bg-[#fcfaf4] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSigningOut}
            >
              {isSigningOut ? "Logging out..." : "Logout"}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
