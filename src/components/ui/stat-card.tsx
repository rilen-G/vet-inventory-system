import type { ReactNode } from "react";

import { Card } from "./card";

type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  icon?: ReactNode;
};

export function StatCard({ label, value, detail, icon }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden bg-white">
      {icon ? <div className="absolute right-5 top-5 rounded-2xl bg-stone-100 p-3 text-brand-700">{icon}</div> : null}
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</div>
      <div className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
      <div className="mt-2 text-sm leading-6 text-slate-600">{detail}</div>
    </Card>
  );
}
