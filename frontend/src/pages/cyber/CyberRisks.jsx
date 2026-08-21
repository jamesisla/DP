import React, { useState } from "react";
import { 
  AlertTriangle, 
  Plus, 
  ShieldAlert, 
  ShieldCheck, 
  Sliders, 
  Search, 
  Trash2, 
  CheckCircle2, 
  TrendingUp, 
  HelpCircle,
  BarChart3,
  Layers,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { api } from "../../lib/api";

const CATEGORIAS_MITRE = [
  "Acceso Inicial",
  "Ejecución",
  "Persistencia",
  "Escalada de Privilegios",
  "Evasión de Defensas",
  "Exfiltración de Datos",
  "Impacto / Interrupción"
];

const ESTADOS_RIESGO = ["Identificado", "En Mitigación", "Aceptado", "Mitigado"];

export function CyberRisks({ risks = [], assets = [], token, user, onReload }) {
  const [tab, setTab] = useState("matrix"); // "matrix" | "gap"
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("Todas");

  // Create modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [amenaza, setAmenaza] = useState("");
  const [categoriaMitre, setCategoriaMitre] = useState(CATEGORIAS_MITRE[0]);
  const [activoId, setActivoId] = useState(assets[0] ? String(assets[0].id) : "");
  const [probabilidad, setProbabilidad] = useState(3);
  const [impacto, setImpacto] = useState(4);
  const [controlesExistentes, setControlesExistentes] = useState("");
  const [planTratamiento, setPlanTratamiento] = useState("");
  const [estadoRiesgo, setEstadoRiesgo] = useState("Identificado");
  const [submitting, setSubmitting] = useState(false);

  const filtered = risks.filter((r) => {
    if (selectedCat !== "Todas" && r.categoria_mitre !== selectedCat) return false;
    if (search) {
      const q = search.toLowerCase();
      const target = `${r.amenaza} ${r.categoria_mitre} ${r.plan_tratamiento}`.toLowerCase();
      if (!target.includes(q)) return false;
    }
    return true;
  });

  function getRiskBadge(score) {
    if (score >= 15) return "bg-rose-600 text-white font-black";
    if (score >= 10) return "bg-rose-100 text-rose-800 border border-rose-300 font-bold";
    if (score >= 5) return "bg-amber-100 text-amber-800 border border-amber-300 font-bold";
    return "bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold";
  }

  function getRiskColorClass(score) {
    if (score >= 15) return "bg-rose-600 text-white font-bold";
    if (score >= 10) return "bg-amber-500 text-white font-bold";
    if (score >= 5) return "bg-amber-300 text-slate-900 font-semibold";
    return "bg-emerald-400 text-slate-900";
  }

  function openCreate() {
    setAmenaza("");
    setCategoriaMitre(CATEGORIAS_MITRE[0]);
    setActivoId(assets[0] ? String(assets[0].id) : "");
    setProbabilidad(3);
    setImpacto(4);
    setControlesExistentes("");
    setPlanTratamiento("");
    setEstadoRiesgo("Identificado");
    setCreateModalOpen(true);
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        amenaza,
        categoria_mitre: categoriaMitre,
        activo_id: activoId ? parseInt(activoId) : null,
        probabilidad: parseInt(probabilidad),
        impacto: parseInt(impacto),
        controles_existentes: controlesExistentes,
        plan_tratamiento: planTratamiento,
        estado: estadoRiesgo,
        responsable_id: user?.id || null
      };

      await api("/cyber/risks", token, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setCreateModalOpen(false);
      if (onReload) onReload();
    } catch (err) {
      alert("Error al registrar riesgo: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("¿Deseas eliminar este riesgo de la matriz?")) return;
    try {
      await api(`/cyber/risks/${id}`, token, { method: "DELETE" });
      if (onReload) onReload();
    } catch (err) {
      alert("Error al eliminar riesgo: " + err.message);
    }
  }

  // Gap Analysis Recommendations Calculation
  const missingMfa = assets.filter(a => !a.mfa_activo);
  const missingBackup = assets.filter(a => !a.respaldo_inmutable);
  const missingEncryption = assets.filter(a => !a.cifrado_activo);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
            <AlertTriangle size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-amber-700 tracking-wider">Fase III · Ley 21.663</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                Matriz 5×5 & Gap Analysis
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mt-0.5">Motor de Riesgos Tecnológicos & Brechas ANCI</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluación cuantitativa de amenazas según el marco MITRE ATT&CK y plan de remediación priorizado por retorno de seguridad.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm"
          >
            <Plus size={15} />
            Registrar Amenaza / Riesgo
          </button>
        </div>
      </div>

      {/* Tabs Selector: 5x5 Matrix vs Gap Analysis */}
      <div className="flex bg-slate-200/70 p-1 rounded-xl border border-slate-300 max-w-md">
        <button
          onClick={() => setTab("matrix")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "matrix" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
        >
          Matriz de Riesgos 5×5 ({risks.length})
        </button>
        <button
          onClick={() => setTab("gap")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "gap" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
        >
          Análisis de Brechas (Gap Analysis)
        </button>
      </div>

      {tab === "matrix" ? (
        <div className="space-y-6">
          
          {/* Top 5x5 Heatmap Visualizer */}
          <div className="rounded-xl border border-line bg-white p-6 shadow-sm grid lg:grid-cols-[1fr_340px] gap-6">
            
            {/* Heatmap Grid */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-800">Mapa de Calor: Probabilidad × Impacto en Servicios Esenciales</h3>
                <span className="text-[11px] text-slate-400 font-semibold">Ley N° 21.663</span>
              </div>

              <div className="grid grid-cols-6 gap-1 text-center text-xs font-bold">
                <div className="p-1"></div>
                <div className="p-1 text-slate-400 text-[10px] uppercase">1 Muy Bajo</div>
                <div className="p-1 text-slate-400 text-[10px] uppercase">2 Bajo</div>
                <div className="p-1 text-slate-400 text-[10px] uppercase">3 Medio</div>
                <div className="p-1 text-slate-400 text-[10px] uppercase">4 Alto</div>
                <div className="p-1 text-slate-400 text-[10px] uppercase">5 Crítico</div>

                {[5, 4, 3, 2, 1].map((p) => (
                  <React.Fragment key={p}>
                    <div className="p-2 text-slate-400 text-[10px] font-bold self-center text-right pr-2">
                      P{p}
                    </div>
                    {[1, 2, 3, 4, 5].map((i) => {
                      const score = p * i;
                      const countInCell = risks.filter(r => r.probabilidad === p && r.impacto === i).length;
                      return (
                        <div
                          key={i}
                          className={`h-10 rounded-lg flex items-center justify-center border border-white/40 shadow-2xs transition-transform hover:scale-105 ${getRiskColorClass(score)}`}
                        >
                          {countInCell > 0 ? (
                            <span className="h-6 w-6 rounded-full bg-black/30 text-white flex items-center justify-center text-xs font-black">
                              {countInCell}
                            </span>
                          ) : (
                            <span className="opacity-40 text-[10px]">{score}</span>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Matrix Legend & Summary */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Resumen de Amenazas</span>
                <h4 className="text-sm font-bold text-slate-800 mt-0.5">Perfil de Riesgo Tecnológico</h4>
                
                <div className="space-y-2 mt-3 text-xs">
                  <div className="flex justify-between items-center p-2 rounded bg-rose-100 text-rose-900 font-bold">
                    <span>Crítico (Score 15-25):</span>
                    <span>{risks.filter(r => r.nivel_riesgo === "Crítico").length}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-amber-100 text-amber-900 font-bold">
                    <span>Alto (Score 10-14):</span>
                    <span>{risks.filter(r => r.nivel_riesgo === "Alto").length}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-blue-50 text-blue-900 font-semibold">
                    <span>Medio / Bajo:</span>
                    <span>{risks.filter(r => r.nivel_riesgo === "Medio" || r.nivel_riesgo === "Bajo").length}</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Todo riesgo calificado como <strong>Crítico</strong> u <strong>Alto</strong> debe contar con un plan de tratamiento activo y asignación de CISO/TI.
              </p>
            </div>

          </div>

          {/* Filter Bar */}
          <div className="rounded-xl border border-line bg-white p-3.5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                className="field pl-9 text-xs h-8 min-h-0 py-0"
                placeholder="Buscar amenaza, categoría MITRE, plan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 w-full md:w-auto">
              <span>Categoría MITRE:</span>
              <select
                className="field text-xs h-8 min-h-0 py-0"
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
              >
                <option value="Todas">Todas las categorías</option>
                {CATEGORIAS_MITRE.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Risks List */}
          {filtered.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((risk) => (
                <div
                  key={risk.id}
                  className="rounded-xl border border-line bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                        MITRE: {risk.categoria_mitre}
                      </span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full ${getRiskBadge(risk.puntuacion)}`}>
                        {risk.nivel_riesgo} ({risk.puntuacion} pts)
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-800 leading-snug">{risk.amenaza}</h4>
                      {risk.activo && (
                        <p className="text-[11px] text-indigo-600 font-semibold mt-1">
                          Activo RSIC: [{risk.activo.codigo_activo}] {risk.activo.nombre}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 text-xs">
                      {risk.controles_existentes && (
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">Controles Existentes:</span>
                          <p className="text-slate-700 mt-0.5">{risk.controles_existentes}</p>
                        </div>
                      )}

                      {risk.plan_tratamiento && (
                        <div className="p-2 bg-indigo-50/50 border border-indigo-200 rounded">
                          <span className="text-[10px] font-bold text-indigo-900 uppercase block">Plan de Tratamiento / Mitigación:</span>
                          <p className="text-indigo-950 font-medium mt-0.5">{risk.plan_tratamiento}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      Estado: {risk.estado}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDelete(risk.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded"
                      title="Eliminar riesgo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-350 p-12 text-center text-slate-400 bg-white">
              <AlertTriangle size={40} className="mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-sm">No hay amenazas registradas en esta categoría</p>
              <p className="text-xs mt-1">Registra riesgos como Ransomware, Phishing masivo o DDoS para alimentar la matriz 5×5.</p>
            </div>
          )}

        </div>
      ) : (
        /* TAB 2: GAP ANALYSIS & ROI-PRIORITIZED REMEDIATION */
        <div className="rounded-xl border border-line bg-white p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800">Plan de Remediación Priorizado (Gap Analysis)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identificación automática de brechas técnicas en infraestructura RSIC y priorización de controles según impacto en la continuidad.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Sin MFA Activo</span>
              <p className="text-2xl font-black text-rose-600">{missingMfa.length} activos</p>
              <p className="text-xs text-slate-500">Vulnerables a robo de credenciales</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Sin Backup Inmutable</span>
              <p className="text-2xl font-black text-amber-600">{missingBackup.length} activos</p>
              <p className="text-xs text-slate-500">Riesgo de extorsión Ransomware</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Sin Cifrado en Reposo</span>
              <p className="text-2xl font-black text-indigo-600">{missingEncryption.length} activos</p>
              <p className="text-xs text-slate-500">Exposición de confidencialidad</p>
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Controles Técnicos Recomendados por ROI</h4>

            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white">Prioridad Crítica</span>
                    <h5 className="font-bold text-xs text-slate-800">Forzado de MFA en Consolas SSH y Portales Administrativos</h5>
                  </div>
                  <p className="text-xs text-slate-600">
                    Costo de implementación: <strong>Bajo (TOTP / Google Authenticator PAM)</strong>. Reduce el 98% de accesos no autorizados.
                  </p>
                </div>
                <span className="text-xs font-bold text-rose-700 shrink-0">Impacto Inmediato</span>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-600 text-white">Prioridad Alta</span>
                    <h5 className="font-bold text-xs text-slate-800">Copias de Respaldo Inmutables WORM (Write Once, Read Many)</h5>
                  </div>
                  <p className="text-xs text-slate-600">
                    Costo de implementación: <strong>Medio</strong>. Garantiza recuperación operacional ante secuestro de datos.
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-700 shrink-0">Anti-Ransomware</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* --- CREATE RISK MODAL --- */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Registrar Amenaza / Riesgo Ciber</h3>
            <p className="text-xs text-slate-400 mb-4">Cálculo de probabilidad e impacto para la matriz 5×5.</p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="rk-amenaza">Descripción de la Amenaza</label>
                <input
                  id="rk-amenaza"
                  className="field mt-1 text-sm"
                  required
                  placeholder="Ej. Secuestro de datos mediante Ransomware en Servidor de Postulaciones"
                  value={amenaza}
                  onChange={(e) => setAmenaza(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="rk-cat">Categoría MITRE ATT&CK</label>
                  <select
                    id="rk-cat"
                    className="field mt-1 text-xs"
                    value={categoriaMitre}
                    onChange={(e) => setCategoriaMitre(e.target.value)}
                  >
                    {CATEGORIAS_MITRE.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="field-label" htmlFor="rk-act">Activo RSIC Afectado</label>
                  <select
                    id="rk-act"
                    className="field mt-1 text-xs"
                    value={activoId}
                    onChange={(e) => setActivoId(e.target.value)}
                  >
                    <option value="">Infraestructura General</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>[{a.codigo_activo}] {a.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <label className="field-label text-xs">Probabilidad (1 a 5): <strong>{probabilidad}</strong></label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-2"
                    value={probabilidad}
                    onChange={(e) => setProbabilidad(e.target.value)}
                  />
                  <span className="text-[10px] text-slate-400">1: Improbable · 5: Frecuente</span>
                </div>

                <div>
                  <label className="field-label text-xs">Impacto (1 a 5): <strong>{impacto}</strong></label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-2"
                    value={impacto}
                    onChange={(e) => setImpacto(e.target.value)}
                  />
                  <span className="text-[10px] text-slate-400">1: Menor · 5: Paralización</span>
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="rk-cont">Controles Existentes</label>
                <input
                  id="rk-cont"
                  className="field mt-1 text-xs"
                  placeholder="Ej. EDR en endpoints, firewall perimetral y respaldo diario"
                  value={controlesExistentes}
                  onChange={(e) => setControlesExistentes(e.target.value)}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="rk-plan">Plan de Tratamiento / Mitigación</label>
                <textarea
                  id="rk-plan"
                  className="field mt-1 text-xs h-20 py-2"
                  placeholder="Ej. Habilitar almacenamiento inmutable WORM y MFA obligatorio en consolas de administración..."
                  value={planTratamiento}
                  onChange={(e) => setPlanTratamiento(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm"
                >
                  {submitting ? "Guardando..." : "Registrar Riesgo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
