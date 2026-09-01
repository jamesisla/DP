import React from "react";
import { Lightbulb, X, HelpCircle, ArrowRight, ShieldCheck, Scale } from "lucide-react";

export function GuidanceBanner({
  title,
  subtitle,
  objective,
  legalBasis,
  steps = [],
  tip,
  onClose,
  isCyber = false
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 ${
      isCyber 
        ? "border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-slate-50 to-indigo-50/60 text-slate-800"
        : "border-amber-200 bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-teal-50/40 text-slate-800"
    }`}>
      {/* Background Decorative Accent */}
      <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-10 pointer-events-none bg-current" />

      <div className="flex items-start justify-between gap-4">
        
        {/* Left Icon & Title */}
        <div className="flex items-start gap-3.5">
          <div className={`grid h-10 w-10 place-items-center rounded-xl shadow-2xs shrink-0 border ${
            isCyber
              ? "bg-indigo-600 text-white border-indigo-700"
              : "bg-amber-500 text-white border-amber-600"
          }`}>
            <Lightbulb size={20} className="fill-white/20" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                isCyber
                  ? "bg-indigo-100/80 text-indigo-900 border-indigo-300"
                  : "bg-amber-100/80 text-amber-900 border-amber-300"
              }`}>
                💡 Modo Guía Asistido
              </span>

              {legalBasis && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/90 text-slate-700 border border-slate-200 shadow-2xs flex items-center gap-1">
                  <Scale size={11} className={isCyber ? "text-indigo-600" : "text-teal-600"} />
                  {legalBasis}
                </span>
              )}
            </div>

            <h3 className="font-extrabold text-sm text-slate-900">
              {title || "¿Qué debes hacer en este módulo?"}
            </h3>

            {objective && (
              <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                {objective}
              </p>
            )}
          </div>
        </div>

        {/* Close / Deactivate Guidance Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-white/80 p-1.5 rounded-lg border border-transparent hover:border-slate-200 transition-all shrink-0 text-xs font-semibold flex items-center gap-1"
            title="Ocultar guía contextual (Puedes reactivarla en el botón 'Modo Guía' de la barra superior)"
          >
            <span className="hidden md:inline text-[11px]">Ocultar Guía</span>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Steps Flow (1 -> 2 -> 3) */}
      {steps && steps.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-200/60 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2.5 bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-black text-white shrink-0 ${
                isCyber ? "bg-indigo-600" : "bg-teal-700"
              }`}>
                {idx + 1}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 leading-snug">{step.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Optional Pro-Tip */}
      {tip && (
        <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-slate-600 bg-white/60 px-3 py-1.5 rounded-lg border border-slate-200/50">
          <HelpCircle size={13} className={isCyber ? "text-indigo-600" : "text-amber-600"} />
          <span><strong className="font-semibold text-slate-800">Consejo DPO/CISO:</strong> {tip}</span>
        </div>
      )}
    </div>
  );
}
