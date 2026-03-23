import { Link, type LinkProps } from "react-router-dom";

import { cn } from "../../lib/utils";

type ButtonLinkVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonLinkProps = LinkProps & {
  variant?: ButtonLinkVariant;
};

const variantClasses: Record<ButtonLinkVariant, string> = {
  primary: "bg-slate-950 text-white hover:bg-slate-800",
  secondary: "border border-stone-300 bg-white text-slate-800 hover:border-stone-400 hover:bg-stone-50",
  ghost: "bg-transparent text-slate-700 hover:bg-stone-100",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
};

export function ButtonLink({ className, variant = "primary", ...props }: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-stone-300 focus:ring-offset-2",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
