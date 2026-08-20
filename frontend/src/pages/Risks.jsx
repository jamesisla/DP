import React, { useEffect, useState } from "react";
import { 
  AlertTriangle, 
  Download, 
  Flame, 
  ShieldAlert, 
  BarChart3, 
  HelpCircle, 
  FileCheck, 
  Layers, 
  CheckCircle2 
} from "lucide-react";
import { Panel } from "../components/Panel";
import { api, API_URL } from "../lib/api";

export function Risks({ risks = [], masterMatrix = [], token, onReload }) {
  const [heatmap, setHeatmap] = useState([]);
  const [loadingHeatmap, setLoadingHeatmap] = useState(true);
  const [selectedRiskCell, setSelectedRiskCell] = useState(null);

  async function loadHeatmap() {
    setLoadingHeatmap(true);
    try {
      const data = await api("/risks/heatmap", token);
      setHeatmap(data);
    } catch (err) {
      console.error("Error cargando mapa de calor:", err);
    } finally {
      setLoadingHeatmap(false);
    }
  }

  useEffect(() => {
    loadHeatmap();
  }, [risks, token]);

  function getLevelBadge(level) {
    switch (level) {
      case "Crítico":
        return "bg-rose-600 text-white font-black";
      case "Alto":
        return "bg-rose-50 text-rose-700 border-rose-200 font-bold";
      case "Medio":
        return "bg-amber-50 text-amber-700 border-amber-200 font-bold";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold";
    }
  }

  function getScoreBadge(score) {
    if (score >= 20) return "bg-rose-700 text-white";
    if (score >= 15) return "bg-rose-500 text-white";
    if (score >= 9) return "bg-amber-500 text-white";
    return "bg-emerald-500 text-white";
  }

  // 5x5 Matrix Cell Risk Level
  function get5x5Color(prob, imp) {
    const score = prob * imp;
    if (score >= 16) return "bg-rose-600 text-white hover:bg-rose-700";
    if (score >= 10) return "bg-amber-500 text-white hover:bg-amber-600";
    if (score >= 6) return "bg-yellow-400 text-slate-900 hover:bg-yellow-500";
    return "bg-emerald-500 text-white hover:bg-emerald-600";
  }

  // Count risks in 5x5 cell
  function getRisksInCell(prob, imp) {
    return risks.filter(r => (r.probabilidad || 2) === prob && (r.impacto || 2) === imp);
  }

  const eipdRequiredRisks = risks.filter(r => r.requiere_eipd);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Executive Header */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-teal-600 tracking-wider">Motor de Riesgos y EIPD (Ley 21.719)</span>
          <h2 className="text-xl font-bold text-slate-800 mt-1">Matriz de Riesgo 5×5 y Evaluaciones de Impacto</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cálculo ponderado de <strong>Probabilidad (1-5) × Impacto (1-5)</strong> e identificación automática de tratamientos que exigen una EIPD formal.
          </p>
        </div>

        <a
          href={`${API_URL.replace("/api", "")}/api/risks/report?token=${token}`}
          download
          className="inline-flex items-center gap-2 rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-95 shadow-sm shrink-0"
        >
          <Download size={16} />
          Exportar Informe de Hallazgos (MD)
        </a>
      </div>

      {/* EIPD Banner if high risk exists */}
      {eipdRequiredRisks.length > 0 && (
        <div className="flex items-start gap-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-sm">
          <FileCheck className="mt-0.5 text-amber-700 shrink-0" size={22} />
          <div>
            <h4 className="font-bold text-sm">SE REQUIERE EVALUACIÓN DE IMPACTO EN PROTECCIÓN DE DATOS (EIPD)</h4>
            <p className="mt-0.5 text-xs text-amber-800 leading-relaxed font-medium">
              Se han detectado <strong>{eipdRequiredRisks.length}</strong> actividades de tratamiento con transferencia internacional de datos sensibles o uso masivo de Inteligencia Artificial. Conforme al Art. 25 de la Ley 21.719, estas actividades deben contar con un informe formal de mitigación antes de su puesta en producción.
            </p>
          </div>
        </div>
      )}

      {/* 5x5 Matrix & Heatmap Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        
        {/* 5x5 Matrix Board */}
        <div className="rounded-xl border border-line bg-white p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="text-brand" size={18} />
              Matriz 5×5 de Probabilidad vs Impacto
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Metodología ISO 27701</span>
          </div>

          <div className="overflow-x-auto pt-2">
            <div className="min-w-[420px]">
              {/* 5x5 Grid */}
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((prob) => (
                  <div key={prob} className="flex items-center gap-2">
                    <span className="w-8 text-[11px] font-bold text-slate-400 text-right">P{prob}</span>
                    <div className="grid grid-cols-5 gap-1.5 flex-1">
                      {[1, 2, 3, 4, 5].map((imp) => {
                        const inCell = getRisksInCell(prob, imp);
                        const isSelected = selectedRiskCell?.prob === prob && selectedRiskCell?.imp === imp;

                        return (
                          <button
                            key={imp}
                            type="button"
                            onClick={() => setSelectedRiskCell(isSelected ? null : { prob, imp, list: inCell })}
                            className={`h-11 rounded-lg text-center font-bold text-xs flex flex-col items-center justify-center transition-all cursor-pointer shadow-2xs ${get5x5Color(prob, imp)} ${isSelected ? "ring-2 ring-slate-900 scale-105" : ""}`}
                          >
                            <span className="text-[10px] opacity-80">{prob * imp}</span>
                            {inCell.length > 0 && (
                              <span className="bg-white text-slate-900 rounded-full px-1.5 text-[9px] font-black -mt-0.5 shadow-2xs">
                                {inCell.length}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Impact Labels */}
              <div className="flex items-center gap-2 mt-2">
                <span className="w-8"></span>
                <div className="grid grid-cols-5 gap-1.5 flex-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <div>I1 Muy Bajo</div>
                  <div>I2 Bajo</div>
                  <div>I3 Medio</div>
                  <div>I4 Alto</div>
                  <div>I5 Crítico</div>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Cell Detail */}
          {selectedRiskCell && (
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs animate-fadeIn">
              <span className="font-bold text-slate-700 block">
                Riesgos en celda P{selectedRiskCell.prob} × I{selectedRiskCell.imp} (Puntuación: {selectedRiskCell.prob * selectedRiskCell.imp}):
              </span>
              {selectedRiskCell.list.length > 0 ? (
                <ul className="list-disc list-inside mt-1 space-y-1 text-slate-600">
                  {selectedRiskCell.list.map((r, i) => (
                    <li key={i}>{r.descripcion}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 mt-1 italic">No hay tratamientos registrados con este nivel exacto.</p>
              )}
            </div>
          )}
        </div>

        {/* Division Heatmap Table */}
        <Panel title="Mapa de Calor por División" icon={Flame}>
          {loadingHeatmap ? (
            <div className="text-center py-8 text-slate-500">Cargando mapa de calor...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 font-bold text-slate-500">
                    <th className="p-3">División</th>
                    <th className="p-3 text-center text-rose-700 bg-rose-50/50">Crítico / Alto</th>
                    <th className="p-3 text-center text-amber-700 bg-amber-50/50">Medio</th>
                    <th className="p-3 text-center text-emerald-700 bg-emerald-50/50">Bajo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {heatmap.map((h, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-700">{h.area}</td>
                      <td className="p-3 text-center font-bold text-rose-700 bg-rose-50/20">
                        {h.Crítico + h.Alto > 0 ? (
                          <span className="inline-block h-5 w-5 rounded-full bg-rose-100 leading-5 text-center">
                            {h.Crítico + h.Alto}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="p-3 text-center font-bold text-amber-700 bg-amber-50/20">
                        {h.Medio > 0 ? (
                          <span className="inline-block h-5 w-5 rounded-full bg-amber-100 leading-5 text-center">
                            {h.Medio}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="p-3 text-center font-bold text-emerald-700 bg-emerald-50/20">
                        {h.Bajo > 0 ? (
                          <span className="inline-block h-5 w-5 rounded-full bg-emerald-100 leading-5 text-center">
                            {h.Bajo}
                          </span>
                        ) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

      </div>

      {/* Risks Table registry */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <ShieldAlert className="text-rose-600" size={20} />
          Inventario de Riesgos y Brechas Identificadas
        </h3>

        {risks.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {risks.map((risk) => (
              <div 
                key={risk.id}
                className="rounded-xl border border-line bg-white p-4 shadow-sm hover:shadow-md transition-all flex items-start gap-3.5"
              >
                <span className={`h-9 w-9 rounded-full shrink-0 flex items-center justify-center font-black text-sm shadow-2xs ${getScoreBadge(risk.puntuacion)}`}>
                  {risk.puntuacion}
                </span>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ID: {risk.id}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold border ${getLevelBadge(risk.nivel)}`}>
                        {risk.nivel}
                      </span>
                    </div>

                    {risk.requiere_eipd && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 font-bold px-1.5 py-0.5 rounded">
                        EIPD Requerida
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-medium text-slate-700 leading-relaxed">
                    {risk.descripcion}
                  </p>

                  <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-3 pt-1 border-t border-slate-50">
                    <span>Probabilidad: P{risk.probabilidad || 2}</span>
                    <span>Impacto: I{risk.impacto || 3}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-350 p-12 text-center text-slate-400 bg-white">
            <Flame size={40} className="mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-sm">No se han registrado riesgos</p>
            <p className="text-xs mt-1">Completa la Matriz de Levantamiento para disparar el motor automático de riesgos 5×5.</p>
          </div>
        )}
      </div>

    </div>
  );
}
