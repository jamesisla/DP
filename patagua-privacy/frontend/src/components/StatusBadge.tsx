type StatusBadgeProps = {
  status: string;
};

const statusStyles: Record<string, string> = {
  vigente: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  publicado: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  completado: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ok: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  estable: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  activo: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "en progreso": "bg-blue-50 text-blue-700 ring-blue-200",
  programada: "bg-blue-50 text-blue-700 ring-blue-200",
  listo: "bg-blue-50 text-blue-700 ring-blue-200",
  abierto: "bg-amber-50 text-amber-700 ring-amber-200",
  pendiente: "bg-amber-50 text-amber-700 ring-amber-200",
  nuevo: "bg-amber-50 text-amber-700 ring-amber-200",
  critico: "bg-red-50 text-red-700 ring-red-200",
  "requiere revision": "bg-red-50 text-red-700 ring-red-200",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase();
  const className = statusStyles[normalized] ?? "bg-slate-50 text-slate-700 ring-slate-200";

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${className}`}>{status}</span>;
}
