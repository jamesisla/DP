import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Database,
  FileWarning,
  MessageSquareText,
  ShieldCheck,
  Target,
  TimerReset,
} from "lucide-react";

import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import { RiskBadge } from "../components/RiskBadge";
import { SectionCard } from "../components/SectionCard";
import { StatusBadge } from "../components/StatusBadge";
import { dashboardStats, instrumentStatus, pendingActions, priorityFindings, topRisks } from "../data/mock";

const statIcons = [ShieldCheck, ClipboardList, Database, FileWarning, AlertTriangle, MessageSquareText, CheckCircle2, CalendarDays];

const signalStyles = {
  high: {
    dot: "bg-red-500",
    border: "border-red-200",
    bg: "bg-red-50",
    text: "text-red-700",
  },
  medium: {
    dot: "bg-amber-500",
    border: "border-amber-200",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  low: {
    dot: "bg-emerald-500",
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
};

const focusMetrics = [
  { label: "Brechas criticas", value: "5", hint: "2 vencidas", status: "high" as const, icon: FileWarning },
  { label: "Riesgos altos", value: "9", hint: "requieren control", status: "high" as const, icon: AlertTriangle },
  { label: "Art. 14 ter", value: "6%", hint: "score actual", status: "high" as const, icon: Target },
];

const operationalMetrics = dashboardStats.filter((stat) => !["Score cumplimiento", "Brechas criticas", "Riesgos altos"].includes(stat.label));

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Panel ejecutivo"
        title="Dashboard de cumplimiento"
        description="Vista consolidada del estado de implementacion, riesgos, brechas y acciones prioritarias para Ley 21.719."
      />

      <section className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-soft">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <div className="border-b border-black/10 p-6 md:p-7 xl:border-b-0 xl:border-r">
            <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
              <div className="flex items-center justify-center lg:justify-start">
                <div
                  className="grid h-52 w-52 place-items-center rounded-full"
                  style={{ background: "conic-gradient(#10b981 0deg 245deg, #f59e0b 245deg 305deg, #fee2e2 305deg 360deg)" }}
                >
                  <div className="grid h-40 w-40 place-items-center rounded-full bg-white shadow-inner">
                    <div className="text-center">
                      <p className="text-5xl font-semibold tracking-tight text-slate-950">68%</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">Cumplimiento</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700 ring-1 ring-amber-200">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Riesgo global medio-alto
                </div>
                <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
                  Prioridad de la semana: cerrar brechas criticas y completar evidencias Articulo 14 ter.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  El programa avanza, pero la exposicion se concentra en politica, procedimientos y controles de transferencia. El siguiente comite deberia revisar decisiones y responsables.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {focusMetrics.map((metric) => (
                    <SignalMetric key={metric.label} {...metric} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#f7f7f4] p-6 md:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Siguiente decision</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-950">Comite Ejecutivo</h3>
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-white text-slate-700 ring-1 ring-slate-200">
                <CalendarDays size={20} />
              </div>
            </div>
            <div className="mt-5 rounded-xl border border-black/10 bg-white p-4">
              <p className="text-3xl font-semibold text-slate-950">28 Jun</p>
              <p className="mt-1 text-sm text-slate-500">10:00 AM / Revision ejecutiva de brechas</p>
              <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <ArrowUpRight size={16} />
                Llevar informe de hallazgos actualizado
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <DecisionLine icon={TimerReset} label="Vencimientos" value="2 brechas criticas vencidas" tone="red" />
              <DecisionLine icon={CheckCircle2} label="Evidencia" value="1/18 controles 14 ter cumple" tone="amber" />
              <DecisionLine icon={ShieldCheck} label="Gobierno" value="DPO vigente y responsable asignado" tone="emerald" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {operationalMetrics.map((stat, index) => (
          <CompactMetric icon={statIcons[index + 1]} key={stat.label} label={stat.label} value={stat.value} hint={stat.hint} status={stat.status} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Avance por instrumento">
          <div className="space-y-4">
            {instrumentStatus.map((item) => (
              <InstrumentProgress key={item.name} name={item.name} progress={item.progress} status={item.status} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Top riesgos">
          <div className="space-y-3">
            {topRisks.map((risk, index) => (
              <div className="rounded-xl border border-black/10 bg-white p-4" key={risk.name}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{index + 1}</span>
                      <p className="font-semibold text-slate-900">{risk.name}</p>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">Responsable: {risk.owner}</p>
                  </div>
                  <RiskBadge level={risk.level} />
                </div>
                <div className="mt-3">
                  <StatusBadge status={risk.status} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Brechas prioritarias">
          <DataTable columns={["Hallazgo", "Impacto", "Vencimiento", "Estado"]} rows={priorityFindings.map((item) => [item.finding, item.impact, item.dueDate, item.status])} riskColumns={[1]} statusColumns={[3]} />
        </SectionCard>

        <SectionCard title="Acciones pendientes">
          <DataTable columns={["Accion", "Responsable", "Vencimiento", "Estado"]} rows={pendingActions.map((item) => [item.action, item.owner, item.dueDate, item.status])} statusColumns={[3]} />
        </SectionCard>
      </div>
    </div>
  );
}

function SignalMetric({ label, value, hint, status, icon: Icon }: { label: string; value: string; hint: string; status: keyof typeof signalStyles; icon: typeof AlertTriangle }) {
  const styles = signalStyles[status];
  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} p-4`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${styles.text}`}>{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
        </div>
        <Icon className={styles.text} size={19} />
      </div>
      <p className="mt-2 text-sm text-slate-600">{hint}</p>
    </div>
  );
}

function CompactMetric({ label, value, hint, status, icon: Icon }: { label: string; value: string; hint: string; status: keyof typeof signalStyles; icon: typeof AlertTriangle }) {
  const styles = signalStyles[status];
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f7f7f4] text-slate-700">
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
        <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} />
        {hint}
      </div>
    </div>
  );
}

function InstrumentProgress({ name, progress, status }: { name: string; progress: number; status: string }) {
  const color = progress < 50 ? "#ef4444" : progress < 70 ? "#f59e0b" : "#10b981";
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{name}</p>
          <p className="mt-1 text-sm text-slate-500">{progress}% completado</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="mt-3 h-3 rounded-full bg-slate-100">
        <div className="h-3 rounded-full" style={{ width: `${progress}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function DecisionLine({ icon: Icon, label, value, tone }: { icon: typeof AlertTriangle; label: string; value: string; tone: "red" | "amber" | "emerald" }) {
  const styles = {
    red: "bg-red-50 text-red-700 ring-red-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200">
      <div className={`grid h-9 w-9 place-items-center rounded-xl ring-1 ${styles[tone]}`}>
        <Icon size={17} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
