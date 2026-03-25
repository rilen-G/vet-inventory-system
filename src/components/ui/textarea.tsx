import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full rounded-2xl border border-[#c9ab67]/45 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-stone-400 focus:border-[#b89443] focus:ring-4 focus:ring-[#efe2bc]",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
