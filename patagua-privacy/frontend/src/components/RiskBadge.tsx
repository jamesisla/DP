type RiskBadgeProps = {
  level: string;
};

const riskStyles: Record<string, string> = {
  alto: "bg-red-50 text-red-700 ring-red-200",
  alta: "bg-red-50 text-red-700 ring-red-200",
  medio: "bg-amber-50 text-amber-700 ring-amber-200",
  media: "bg-amber-50 text-amber-700 ring-amber-200",
  bajo: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  baja: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export function RiskBadge({ level }: RiskBadgeProps) {
  const className = riskStyles[level.toLowerCase()] ?? "bg-slate-50 text-slate-700 ring-slate-200";

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${className}`}>{level}</span>;
}
