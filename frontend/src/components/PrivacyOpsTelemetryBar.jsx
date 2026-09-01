import React, { useState } from "react";
import { Activity, ShieldCheck, Zap, Database, Clock, RefreshCw, AlertTriangle, Terminal, CheckCircle2, Lock } from "lucide-react";
import { api, API_URL } from "../lib/api";

export function PrivacyOpsTelemetryBar({ token, onReload, isCyber = false }) {
  const [runningPresidio, setRunningPresidio] = useState(false);
  const [runningWazuh, setRunningWazuh] = useState(false);
  const [liveEvent, setLiveEvent] = useState(null);
  const [feedOpen, setFeedOpen] = useState(false);

  // Simulated / live telemetry events
  const defaultEvents = [
    { time: "Ahora", source: "MS Presidio NLP", msg: "Escaneo de PII completado: 1.450 campos auditados.", status: "ok" },
    { time: "Hace 12m", source: "Keycloak IAM", msg: "Acceso administrativo con MFA verificado en RSIC-01.", status: "ok" },
    { time: "Hace 1h", source: "MinIO WORM", msg: "Snapshot inmutable de base de datos verificado con SHA-256.", status: "ok" },
    { time: "Hace 3h", source: "ClaveÚnica Hub", msg: "Solicitud ARCO+ ingresada. SLA 15d activado.", status: "ok" },
    { time: "Hace 5h", source: "Wazuh FIM", msg: "Monitoreo de integridad de archivos (/etc, /var/www) sin alteraciones.", status: "ok" }
  ];

  const [events, setEvents] = useState(defaultEvents);

  async function triggerPresidioScan() {
    setRunningPresidio(true);
    try {
      const res = await api("/gateways/simulate-presidio-scan", token, { method: "POST" });
      const newEv = {
        time: "Justo ahora",
        source: "MS Presidio NLP",
        msg: res.resultado || "Escaneo NLP finalizado con éxito.",
        status: "alert"
      };
      setLiveEvent(newEv);
      setEvents(prev => [newEv, ...prev]);
      if (onReload) onReload();
    } catch (err) {
      alert("Error al ejecutar Presidio: " + err.message);
    } finally {
      setRunningPresidio(false);
    }
  }

  async function triggerWazuhAlert() {
    setRunningWazuh(true);
    try {
      const res = await api("/gateways/simulate-wazuh-alert", token, { method: "POST" });
      const newEv = {
        time: "Justo ahora",
        source: "Wazuh SIEM L12",
        msg: "Alerta Nivel 12: Correlación cruzada ANCI 3h y DPO 72h generada.",
        status: "critical"
      };
      setLiveEvent(newEv);
      setEvents(prev => [newEv, ...prev]);
      if (onReload) onReload();
    } catch (err) {
      alert("Error al simular alerta Wazuh: " + err.message);
    } finally {
      setRunningWazuh(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 p-4 shadow-md space-y-4 overflow-hidden relative">
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Zap size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950 px-2 py-0.2 rounded border border-indigo-800/60">
                PRIVACYOPS &amp; CIBEROPS ENGINE
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold text-emerald-400">TELEMETRÍA EN VIVO</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Orquestación continua de cumplimiento, descubrimiento PII y respuesta a incidentes
            </p>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={triggerPresidioScan}
            disabled={runningPresidio}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-500/40 bg-teal-950/40 hover:bg-teal-900/50 text-teal-300 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            title="Ejecutar escaneo en vivo con Microsoft Presidio NLP para detectar datos sensibles"
          >
            <RefreshCw size={12} className={runningPresidio ? "animate-spin text-teal-400" : "text-teal-400"} />
            <span>{runningPresidio ? "Escaneando..." : "Test Presidio NLP"}</span>
          </button>

          <button
            type="button"
            onClick={triggerWazuhAlert}
            disabled={runningWazuh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            title="Simular llegada de alerta Wazuh SIEM con Correlación Cruzada (CISO 3h & DPO 72h)"
          >
            <AlertTriangle size={12} className={runningWazuh ? "animate-spin text-rose-400" : "text-rose-400"} />
            <span>{runningWazuh ? "Disparando..." : "Simular Wazuh SIEM"}</span>
          </button>

          <button
            type="button"
            onClick={() => setFeedOpen(!feedOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all"
            title="Ver / Ocultar consola de eventos de telemetría"
          >
            <Terminal size={12} />
            <span>{feedOpen ? "Ocultar Log" : "Ver Log"}</span>
          </button>
        </div>
      </div>

      {/* PrivacyOps Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        
        {/* Metric 1: DSAR SLA Velocity */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-semibold">Velocidad ARCO+ (DSAR)</span>
            <Clock size={13} className="text-teal-400" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-black text-teal-300 font-mono">3.2 Días</span>
            <span className="text-[10px] text-slate-400 ml-1.5 font-medium">/ 15d límite legal</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: "21%" }}></div>
          </div>
        </div>

        {/* Metric 2: Privacy Technical Debt */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-semibold">Deuda Técnica Privacidad</span>
            <Activity size={13} className="text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-black text-amber-300 font-mono">12.4%</span>
            <span className="text-[10px] text-emerald-400 ml-1.5 font-bold">↓ Bajo Riesgo</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: "12%" }}></div>
          </div>
        </div>

        {/* Metric 3: Continuous RoPA Freshness */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-semibold">Frescura del RAT (RoPA)</span>
            <Database size={13} className="text-indigo-400" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-black text-indigo-300 font-mono">98.5%</span>
            <span className="text-[10px] text-slate-400 ml-1.5 font-medium">Continuo</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: "98%" }}></div>
          </div>
        </div>

        {/* Metric 4: Tríada Técnica RSIC */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-semibold">Tríada Técnica ANCI</span>
            <ShieldCheck size={13} className="text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-black text-emerald-300 font-mono">100%</span>
            <span className="text-[10px] text-emerald-400 ml-1.5 font-medium">AES + MFA + WORM</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "100%" }}></div>
          </div>
        </div>
      </div>

      {/* Expandable Telemetry Event Log */}
      {feedOpen && (
        <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Terminal size={12} className="text-indigo-400" />
              Event Stream en Vivo (Wazuh, Presidio, MinIO, Keycloak)
            </span>
            <span>{events.length} eventos registrados</span>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {events.map((ev, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[11px] p-1.5 rounded bg-slate-950/60 border border-slate-800/60">
                <span className="text-slate-500 text-[10px] shrink-0">{ev.time}</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                  ev.status === "critical" ? "bg-rose-900/60 text-rose-300 border border-rose-700/50" :
                  ev.status === "alert" ? "bg-amber-900/60 text-amber-300 border border-amber-700/50" :
                  "bg-indigo-950 text-indigo-300 border border-indigo-800/40"
                }`}>
                  {ev.source}
                </span>
                <span className="text-slate-300 truncate">{ev.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
