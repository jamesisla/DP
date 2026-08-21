import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Flame, 
  Filter, 
  ArrowRight,
  Radio,
  FileCheck,
  Scale
} from "lucide-react";
import { api } from "../lib/api";

export function ComplianceTimeline({ token }) {
  const [timeline, setTimeline] = useState([]);
  const [filterLey, setFilterLey] = useState("Todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTimeline() {
      try {
        const data = await api("/compliance-timeline", token);
        setTimeline(data);
      } catch (err) {
        console.error("Error cargando cronograma:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTimeline();
  }, [token]);

  const filtered = timeline.filter(item => {
    if (filterLey !== "Todos" && item.ley !== filterLey) return false;
    return true;
  });

  function getUrgencyBadge(urgency) {
    switch (urgency) {
      case "Crítica":
        return "bg-rose-600 text-white font-black animate-pulse";
      case "Alta":
        return "bg-rose-50 text-rose-700 border-rose-200 font-bold";
      case "Media":
        return "bg-amber-50 text-amber-700 border-amber-200 font-bold";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  }

  return (
    <div className="rounded-xl border border-line bg-white p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100 shrink-0">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800">Cronograma y Calendario Regulatorio GRC (2026 - 2027)</h3>
            <p className="text-xs text-slate-400">Vencimientos legales, plazos perentorios y recurrencias de auditoría en tiempo real.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Filtrar Ley:</span>
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
            {["Todos", "Ley 21.719", "Ley 21.663"].map(f => (
              <button
                key={f}
                onClick={() => setFilterLey(f)}
                className={`px-2.5 py-1 rounded-md transition-all ${filterLey === f ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">Cargando cronograma regulatorio...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isL21719 = item.ley.includes("21.719");

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${isL21719 ? "bg-teal-50 text-teal-800 border-teal-200" : "bg-indigo-50 text-indigo-800 border-indigo-200"}`}>
                      {item.ley}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${getUrgencyBadge(item.urgencia)}`}>
                      {item.tipo}
                    </span>
                    <h4 className="font-bold text-xs text-slate-800">{item.titulo}</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-2xl">{item.descripcion}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 block font-mono">
                      {item.dias_restantes} días
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Fecha: {new Date(item.fecha).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
