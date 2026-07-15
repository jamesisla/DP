import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  hint: string;
  status: "high" | "medium" | "low";
  icon: LucideIcon;
};

const dotStyles = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
};

export function StatCard({ label, value, hint, status, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-700">
          <Icon size={19} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
        <span className={`h-2.5 w-2.5 rounded-full ${dotStyles[status]}`} />
        {hint}
      </div>
    </div>
  );
}
