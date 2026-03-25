import type { HTMLAttributes } from "react";

import { cn } from "../../lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-[28px] border border-[#c9ab67]/45 bg-white/95 p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)] sm:p-6", className)}
      {...props}
    />
  );
}
