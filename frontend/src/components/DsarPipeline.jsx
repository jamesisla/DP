import React from "react";
import { CheckCircle2, Clock, FileCheck, Search, ShieldCheck, UserCheck, Send } from "lucide-react";

export function DsarPipeline({ activeStep = 3, totalRequests = 0, pendingCount = 0 }) {
  const steps = [
    { num: 1, label: "Ingesta & Folio", icon: UserCheck, desc: "Canal ClaveÚnica / Presencial" },
    { num: 2, label: "Validación Identidad", icon: ShieldCheck, desc: "Verificación de Titularidad" },
    { num: 3, label: "Discovery PII", icon: Search, desc: "Cruce con Matriz RAT" },
    { num: 4, label: "Dictamen DPO", icon: FileCheck, desc: "Fundamento Legal Art. 10" },
    { num: 5, label: "Notificación & Cierre", icon: Send, desc: "Resolución con Sello SHA-256" }
  ];

  return (
    <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50/90 via-slate-50 to-teal-50/50 p-5 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-teal-200/60 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded border border-teal-300">
            DSAR AUTOMATION PIPELINE (ARCO+)
          </span>
          <span className="text-xs font-bold text-slate-800">
            Flujo Operativo de Atención Ciudadana (Art. 8 al 12 Ley N° 21.719)
          </span>
        </div>
        <div className="text-xs text-slate-600 font-medium flex items-center gap-3">
          <span><strong>{totalRequests}</strong> Solicitudes Totales</span>
          <span>•</span>
          <span className="text-amber-700 font-bold flex items-center gap-1">
            <Clock size={12} />
            {pendingCount} en Proceso SLA &lt;15d
          </span>
        </div>
      </div>

      {/* Pipeline Steps Tracker */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 pt-1">
        {steps.map((s, idx) => {
          const isDone = idx < activeStep;
          const isCurrent = idx === activeStep - 1;
          const Icon = s.icon;

          return (
            <div
              key={s.num}
              className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                isCurrent
                  ? "bg-white border-teal-600 shadow-md ring-2 ring-teal-500/20"
                  : isDone
                  ? "bg-teal-50/70 border-teal-300 text-teal-900"
                  : "bg-white/60 border-slate-200 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-black ${
                  isCurrent ? "bg-teal-700 text-white" : isDone ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"
                }`}>
                  {isDone ? <CheckCircle2 size={14} /> : s.num}
                </span>
                <Icon size={16} className={isCurrent ? "text-teal-700" : isDone ? "text-teal-600" : "text-slate-400"} />
              </div>
              <div className="mt-2 min-w-0">
                <p className={`text-xs font-bold truncate ${isCurrent ? "text-teal-950" : isDone ? "text-teal-900" : "text-slate-700"}`}>
                  {s.label}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug truncate">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
