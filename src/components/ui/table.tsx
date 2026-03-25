import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

export function TableContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("overflow-x-auto rounded-[28px] border border-[#c9ab67]/45 bg-white", className)} {...props} />;
}

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("min-w-full divide-y divide-[#c9ab67]/40", className)} {...props} />;
}

export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-b border-[#c9ab67]/40 bg-[#fcfaf4]", className)} {...props} />;
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-[#c9ab67]/35 bg-white", className)} {...props} />;
}

export function TableHeaderCell({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-500", className)}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-4 text-sm text-slate-700", className)} {...props} />;
}
