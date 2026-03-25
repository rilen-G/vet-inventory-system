import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import { primaryNavItems } from "../../lib/constants";
import { cn } from "../../lib/utils";
import { MenuIcon } from "./topbar-menu";

export function Topbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

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
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 bg-white text-slate-700 transition hover:border-stone-300 hover:text-slate-950 md:hidden"
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            >
              <MenuIcon />
            </button>

            <div className="hidden min-w-0 md:block">
              <div className="truncate text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Cared Veterinary Products Trading
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 flex-col items-center text-center leading-tight text-slate-600 md:hidden">
            <span className="whitespace-nowrap text-[0.72rem] font-semibold uppercase tracking-[0.16em]">Cared Veterinary</span>
            <span className="whitespace-nowrap text-[0.66rem] font-medium uppercase tracking-[0.14em]">Products Trading</span>
          </div>

          <nav className="hidden min-w-0 items-center gap-2 md:ml-auto md:flex">
            {primaryNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition",
                    isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-stone-100 hover:text-slate-950",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
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
                    isActive ? "border-slate-900 bg-slate-900 text-white" : "border-stone-200 bg-white text-slate-700 hover:border-stone-300 hover:bg-stone-50",
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
