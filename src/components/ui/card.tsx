import type { HTMLAttributes } from "react";

import { cn } from "../../lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-[28px] border border-stone-200/90 bg-white/95 p-5 shadow-panel sm:p-6", className)}
      {...props}
    />
  );
}
