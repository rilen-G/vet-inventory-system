import type { HTMLAttributes } from "react";

import { cn } from "../../lib/utils";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-stone-100 text-stone-700 ring-1 ring-inset ring-stone-200",
  success: "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200",
  warning: "bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-200",
  danger: "bg-rose-100 text-rose-900 ring-1 ring-inset ring-rose-200",
  info: "bg-sky-100 text-sky-800 ring-1 ring-inset ring-sky-200",
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide", toneClasses[tone], className)}
      {...props}
    />
  );
}
