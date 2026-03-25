import type { ButtonHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[#b89443] text-white hover:bg-[#a58335]",
  secondary: "border border-[#c9ab67]/55 bg-white text-slate-800 hover:border-[#b89443] hover:bg-[#fcfaf4]",
  ghost: "bg-transparent text-slate-700 hover:bg-stone-100",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
};

export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#e5d19d] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
