import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import { primaryNavItems } from "../../lib/constants";
import { cn } from "../../lib/utils";
import { MenuIcon } from "./topbar-menu";
import { useRouteDisplay } from "./use-route-display";

export function Topbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const routeDisplay = useRouteDisplay();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/88 backdrop-blur-xl">
      <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[72px] items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 bg-white text-slate-700 shadow-sm transition hover:border-stone-300 hover:text-slate-950 md:hidden"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          >
            <MenuIcon />
          </button>

          <div className="min-w-0 md:hidden">
            <div className="truncate text-base font-semibold text-slate-950">{routeDisplay.title}</div>
            <div className="truncate text-sm text-slate-500">{routeDisplay.subtitle}</div>
          </div>

          <nav className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
            {primaryNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-stone-100 hover:text-slate-950",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden min-w-0 items-center rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-slate-600 xl:flex">
            <span className="truncate">{routeDisplay.subtitle}</span>
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
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                      : "border-stone-200 bg-white text-slate-700 hover:border-stone-300 hover:bg-stone-50",
                  )
                }
              >
                <div className="text-sm font-semibold">{item.label}</div>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
