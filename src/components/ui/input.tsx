import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-2xl border border-[#c9ab67]/45 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-stone-400 focus:border-[#b89443] focus:ring-4 focus:ring-[#efe2bc]",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
