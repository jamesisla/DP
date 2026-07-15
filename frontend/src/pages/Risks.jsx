import React, { useEffect, useState } from "react";
import { AlertTriangle, Download, Flame, ShieldAlert, BarChart3, HelpCircle } from "lucide-react";
import { Panel } from "../components/Panel";
import { api, API_URL } from "../lib/api";

export function Risks({ risks, masterMatrix, token, onReload }) {
  const [heatmap, setHeatmap] = useState([]);
  const [loadingHeatmap, setLoadingHeatmap] = useState(true);

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
      case "Alto":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Medio":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  }

  function getScoreBadge(score) {
    if (score >= 15) return "bg-rose-600 text-white";
    if (score >= 9) return "bg-amber-500 text-white";
    return "bg-emerald-500 text-white";
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Risk Executive Header */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-teal-600 tracking-wider">Motor de Riesgos Normativo</span>
          <h2 className="text-xl font-bold text-slate-800 mt-1">Análisis de Brechas e Impacto Ley 21.719</h2>
          <p className="text-xs text-slate-400 mt-0.5">Cálculos automáticos basados en el flujo e importancia de los datos declarados.</p>
        </div>

        <a
          href={`${API_URL.replace("/api", "")}/api/risks/report?token=${token}`}
          download
          className="inline-flex items-center gap-2 rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-95 shadow-sm"
        >
          <Download size={16} />
          Exportar Informe de Hallazgos
        </a>
      </div>

      {/* Heatmap Grid Section */}
      <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        
        {/* Heatmap table */}
        <Panel title="Mapa de Calor de Riesgos por División" icon={Flame}>
          {loadingHeatmap ? (
            <div className="text-center py-8 text-slate-500">Cargando mapa de calor...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 font-bold text-slate-500">
                    <th className="p-3">División / Área</th>
                    <th className="p-3 text-center text-rose-700 bg-rose-50 border-x border-slate-100">Alto</th>
                    <th className="p-3 text-center text-amber-700 bg-amber-50 border-x border-slate-100">Medio</th>
                    <th className="p-3 text-center text-emerald-700 bg-emerald-50 border-x border-slate-100">Bajo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {heatmap.map((h, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-700">{h.area}</td>
                      <td className="p-3 text-center font-bold text-rose-700 border-x border-slate-100 bg-rose-50/20">
                        {h.Alto > 0 ? (
                          <span className="inline-block h-6 w-6 rounded-full bg-rose-100 leading-6 text-center animate-pulse">
                            {h.Alto}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="p-3 text-center font-bold text-amber-700 border-x border-slate-100 bg-amber-50/20">
                        {h.Medio > 0 ? (
                          <span className="inline-block h-6 w-6 rounded-full bg-amber-100 leading-6 text-center">
                            {h.Medio}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="p-3 text-center font-bold text-emerald-700 border-x border-slate-100 bg-emerald-50/20">
                        {h.Bajo > 0 ? (
                          <span className="inline-block h-6 w-6 rounded-full bg-emerald-100 leading-6 text-center">
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

        {/* Methodology explanation card */}
        <div className="rounded-xl border border-line bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <HelpCircle className="text-brand" size={20} />
              Criterio de Evaluación y Reglas
            </h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              El motor de riesgos analiza los tratamientos declarados en la Matriz Maestra en base a reglas de ponderación legal:
            </p>
          </div>

          <div className="space-y-3.5 my-5 text-xs">
            <div className="flex gap-2.5 items-start">
              <span className="h-5 w-5 rounded bg-rose-100 text-rose-700 font-bold text-center leading-5 shrink-0">A</span>
              <div>
                <p className="font-bold text-slate-700">Riesgo Alto (Puntuación 16-25)</p>
                <p className="text-slate-500">Uso de datos sensibles (salud, infracciones) con transferencia internacional activa.</p>
              </div>
            </div>
            <div className="flex gap-2.5 items-start">
              <span className="h-5 w-5 rounded bg-amber-100 text-amber-700 font-bold text-center leading-5 shrink-0">M</span>
              <div>
                <p className="font-bold text-slate-700">Riesgo Medio (Puntuación 9-15)</p>
                <p className="text-slate-500">Tratamiento masivo (&gt;10k registros) apoyado por Inteligencia Artificial, o uso estándar de datos sensibles.</p>
              </div>
            </div>
            <div className="flex gap-2.5 items-start">
              <span className="h-5 w-5 rounded bg-emerald-100 text-emerald-700 font-bold text-center leading-5 shrink-0">B</span>
              <div>
                <p className="font-bold text-slate-700">Riesgo Bajo (Puntuación 1-8)</p>
                <p className="text-slate-500">Tratamientos generales de datos identificativos locales con medidas básicas.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <BarChart3 size={15} />
            <span>Matriz de Riesgo: Impacto × Probabilidad</span>
          </div>
        </div>

      </div>

      {/* Risks Table registry */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <ShieldAlert className="text-rose-600" size={20} />
          Registro de Riesgos Evaluados
        </h3>

        {risks.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {risks.map((risk) => (
              <div 
                key={risk.id}
                className="rounded-xl border border-line bg-white p-4 shadow-sm hover:shadow-md transition-all flex items-start gap-3.5"
              >
                <span className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center font-black text-sm shadow-sm ${getScoreBadge(risk.puntuacion)}`}>
                  {risk.puntuacion}
                </span>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Riesgo ID: {risk.id}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold border ${getLevelBadge(risk.nivel)}`}>
                      {risk.nivel}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-700 leading-relaxed">
                    {risk.descripcion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-350 p-12 text-center text-slate-400 bg-white">
            <Flame size={40} className="mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-sm">No se han registrado riesgos</p>
            <p className="text-xs mt-1">Completa la Matriz de Levantamiento para disparar el motor automático de riesgos.</p>
          </div>
        )}
      </div>

    </div>
  );
}
