import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-[2rem] font-semibold tracking-tight text-slate-950 sm:text-[2.2rem]">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 sm:text-[0.95rem]">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
