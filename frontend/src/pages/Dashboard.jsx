import React, { useState, useEffect } from "react";
import { AlertTriangle, Clock, ListTodo, Briefcase, Activity, UserCheck, ShieldAlert, ChevronRight, Download, FileText, Calendar } from "lucide-react";
import { ComplianceTimeline } from "../components/ComplianceTimeline";
import { API_URL } from "../lib/api";

export function Dashboard({ data, token, onReload, onNavigate }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Dec 1, 2026 Countdown
    const targetDate = new Date("2026-12-01T00:00:00").getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!data) return <div className="p-8 text-slate-500">Cargando dashboard...</div>;

  const progressStr = data.metrics.find(m => m.label.includes("Avance General"))?.value || "0%";
  const progressVal = parseInt(progressStr) || 0;

  function getProgressColor(progress) {
    if (progress === 100) return "bg-emerald-500";
    if (progress > 50) return "bg-teal-600";
    if (progress > 0) return "bg-amber-500";
    return "bg-slate-300";
  }

  function getProgressTextClass(progress) {
    if (progress === 100) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (progress > 50) return "text-teal-700 bg-teal-50 border-teal-200";
    if (progress > 0) return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-slate-500 bg-slate-50 border-slate-200";
  }

  const stats = data.stats || {};

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Top Action Bar */}
      <div className="rounded-xl border border-line bg-white p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-teal-600 tracking-wider">Centro de Mando Integral</span>
          <h2 className="text-lg font-bold text-slate-800">Panel Ejecutivo de Protección de Datos (Ley N° 21.719)</h2>
        </div>

        <a
          href={`${API_URL.replace("/api", "")}/api/documents/annual-privacy-plan?token=${token}`}
          download
          className="inline-flex items-center gap-2 rounded bg-teal-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-800 shadow-sm transition-colors shrink-0"
          title="Descargar Plan Anual Institucional de Protección de Datos Personales (2026-2027)"
        >
          <FileText size={14} />
          Plan Anual de Privacidad (MD)
        </a>
      </div>

      {/* Critical Path Delayed Task Banner */}
      {data.critical_path_alert && (
        <div 
          onClick={() => onNavigate && onNavigate("project")}
          className="flex items-start justify-between gap-4 rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-900 shadow-sm cursor-pointer hover:bg-rose-100/70 transition-all animate-pulse"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 text-rose-600 shrink-0" size={22} />
            <div>
              <h4 className="font-bold text-sm tracking-tight">ALERTA DE CAMINO CRÍTICO DETECTADO</h4>
              <p className="mt-1 text-xs text-rose-800 font-medium">
                {data.critical_path_alert}
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-rose-500 shrink-0 self-center" />
        </div>
      )}

      {/* Unnotified Breaches or Urgent ARCO Alert */}
      {(stats.unnotified_breaches > 0 || stats.urgent_arco > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {stats.unnotified_breaches > 0 && (
            <div 
              onClick={() => onNavigate && onNavigate("breaches")}
              className="flex items-center justify-between p-3.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 shadow-2xs cursor-pointer hover:bg-rose-100/80 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert size={20} className="text-rose-600" />
                <div>
                  <p className="font-bold text-xs">Brechas por Notificar (72h)</p>
                  <p className="text-[11px] text-rose-700 font-medium">{stats.unnotified_breaches} incidente(s) pendiente(s) de reporte a la Agencia</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-rose-500" />
            </div>
          )}

          {stats.urgent_arco > 0 && (
            <div 
              onClick={() => onNavigate && onNavigate("arco")}
              className="flex items-center justify-between p-3.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 shadow-2xs cursor-pointer hover:bg-amber-100/80 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <UserCheck size={20} className="text-amber-600" />
                <div>
                  <p className="font-bold text-xs">Solicitudes ARCO+ Urgentes (&le; 5 días)</p>
                  <p className="text-[11px] text-amber-800 font-medium">{stats.urgent_arco} solicitud(es) próxima(s) al límite legal de 15 días</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-amber-600" />
            </div>
          )}
        </div>
      )}

      {/* Main KPI Grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric, idx) => (
          <div 
            className="rounded-xl border border-line bg-white p-5 shadow-sm hover:shadow-md transition-shadow cursor-default" 
            key={idx}
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{metric.label}</p>
            <div className="mt-3 flex items-baseline justify-between">
              <p className="text-2xl font-black text-slate-800 tracking-tight">{metric.value}</p>
              <span className="rounded-full bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                {metric.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Countdown & Circular Progress Section */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* Compliance Progress (Circular Gauge) */}
        <div className="rounded-xl border border-line bg-white p-6 shadow-sm flex flex-col md:flex-row items-center gap-8 justify-center">
          <div className="relative flex items-center justify-center">
            {/* SVG circular progress */}
            <svg className="h-44 w-44 transform -rotate-90">
              <circle
                className="text-slate-100"
                strokeWidth="14"
                stroke="currentColor"
                fill="transparent"
                r="72"
                cx="88"
                cy="88"
              />
              <circle
                className="text-brand transition-all duration-1000 ease-out"
                strokeWidth="14"
                strokeDasharray={2 * Math.PI * 72}
                strokeDashoffset={2 * Math.PI * 72 * (1 - progressVal / 100)}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="72"
                cx="88"
                cy="88"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-black text-slate-800 tracking-tight">{progressVal}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Cumplido</span>
            </div>
          </div>

          <div className="space-y-4 max-w-xs">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Briefcase className="text-brand" size={20} />
              Avance Ponderado
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              El avance global se calcula proporcionalmente según la ponderación legal de cada fase descrita en la metodología de la Ley 21.719.
            </p>
            <div className="flex gap-2 text-xs font-bold text-slate-400">
              <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200">F2: Levantamiento (25%)</span>
              <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200">F6: Protocolos (20%)</span>
            </div>
          </div>
        </div>

        {/* Countdown Clock */}
        <div className="rounded-xl border border-line bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clock className="text-amber-600" size={20} />
              Plazo de Entrada en Vigencia
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Las sanciones legales y la fiscalización comienzan de forma obligatoria el 1 de diciembre de 2026.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-3 my-6 text-center">
            {[
              { val: timeLeft.days, unit: "Días" },
              { val: timeLeft.hours, unit: "Horas" },
              { val: timeLeft.minutes, unit: "Minutos" },
              { val: timeLeft.seconds, unit: "Segundos" }
            ].map((box) => (
              <div className="bg-[#0f766e]/5 border border-brand/10 rounded-lg p-3" key={box.unit}>
                <span className="block text-2xl sm:text-3xl font-black text-brand tracking-tight">
                  {String(box.val).padStart(2, "0")}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                  {box.unit}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-xs text-slate-400 font-semibold">
            <span>Servicio Civil de Chile</span>
            <span>Plazo Final: 01-12-2026</span>
          </div>
        </div>

      </div>

      {/* Grid: 6 Phases & Recent Activity Feed */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        
        {/* The 6 Phases Progress Cards */}
        <div className="rounded-xl border border-line bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ListTodo className="text-brand" size={18} />
              Fases Metodológicas de Implementación
            </h3>
            <span className="text-xs text-slate-400 font-semibold">Total: 6 Fases</span>
          </div>

          <div className="space-y-3">
            {data.phases.map((phase) => (
              <div 
                key={phase.id} 
                onClick={() => onNavigate && onNavigate("project")}
                className="p-3.5 rounded-lg border border-slate-150 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
              >
                <div className="space-y-1">
                  <p className="font-bold text-slate-800 text-sm">{phase.nombre}</p>
                  <p className="text-xs text-slate-400 font-medium">
                    Plazo: {new Date(phase.fecha_inicio).toLocaleDateString()} - {new Date(phase.fecha_fin).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3 min-w-[200px] justify-between sm:justify-end">
                  <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColor(phase.progreso)}`} 
                      style={{ width: `${phase.progreso}%` }}
                    ></div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getProgressTextClass(phase.progreso)}`}>
                    {phase.progreso}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Timeline Activity Logs */}
        <div className="rounded-xl border border-line bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Activity className="text-brand" size={18} />
                Bitácora Reciente de Auditoría
              </h3>
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>

            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {data.recent_activity.length > 0 ? (
                data.recent_activity.map((log) => (
                  <div className="relative pl-6 pb-4 border-l-2 border-slate-200 last:border-0 last:pb-0" key={log.id}>
                    <span className="absolute -left-[6px] top-1.5 h-2.5 w-2.5 rounded-full bg-teal-600 border border-white"></span>
                    <div className="text-xs">
                      <div className="flex justify-between font-bold text-slate-700">
                        <span>{log.usuario}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{log.fecha_hora}</span>
                      </div>
                      <p className="text-slate-500 mt-1 font-medium">{log.accion}</p>
                      {log.detalle && log.detalle.nombre && (
                        <p className="text-[10px] text-slate-400 italic mt-0.5">Nombre: {log.detalle.nombre}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No hay registro de actividades reciente.
                </div>
              )}
            </div>
          </div>

          <div 
            onClick={() => onNavigate && onNavigate("audit")}
            className="border-t border-slate-100 pt-3 mt-4 text-center cursor-pointer hover:text-brand transition-colors"
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
              <span>Trazabilidad Total en Auditoría</span>
              <ChevronRight size={12} />
            </p>
          </div>
        </div>

      </div>

      {/* Unified Regulatory Timeline */}
      <ComplianceTimeline token={token} />

    </div>
  );
}
