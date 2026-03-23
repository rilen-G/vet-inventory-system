import { forwardRef, type SelectHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "h-11 w-full appearance-none rounded-2xl border border-stone-300 bg-white px-4 pr-12 text-sm text-slate-900 outline-none transition focus:border-stone-500 focus:ring-4 focus:ring-stone-200",
          className,
        )}
        {...props}
      />
      <span className="pointer-events-none absolute inset-y-0 right-4 inline-flex items-center text-stone-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-5"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </span>
    </div>
  ),
);

Select.displayName = "Select";
