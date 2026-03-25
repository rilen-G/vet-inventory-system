import { ButtonHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
};

function PaginationArrowButton({
  disabled,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#c9ab67]/45 bg-[#fcfaf4] text-[#b89443] transition",
        disabled ? "cursor-not-allowed opacity-40" : "hover:border-[#b89443] hover:text-[#8f6a1d]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  onPrevious,
  onNext,
  className,
}: PaginationProps) {
  if (totalItems === 0) {
    return null;
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={cn("mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="text-sm text-slate-600">
        Showing {start}-{end} of {totalItems}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <PaginationArrowButton disabled={currentPage === 1} onClick={onPrevious} aria-label="Previous page">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </PaginationArrowButton>
          <PaginationArrowButton disabled={currentPage === totalPages} onClick={onNext} aria-label="Next page">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </PaginationArrowButton>
        </div>
      </div>
    </div>
  );
}
