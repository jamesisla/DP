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
  CheckCircle2,
  DollarSign,
  Scale,
  Percent,
  ShieldCheck,
  Plus,
  FileText,
  Check,
  Sparkles,
  Shield,
  Fingerprint
} from "lucide-react";
import { Panel } from "../components/Panel";
import { api, API_URL } from "../lib/api";

export function Risks({ risks = [], masterMatrix = [], token, onReload }) {
  const [tab, setTab] = useState("matrix"); // 'matrix', 'eipd', 'fines'
  const [heatmap, setHeatmap] = useState([]);
  const [loadingHeatmap, setLoadingHeatmap] = useState(true);
  const [selectedRiskCell, setSelectedRiskCell] = useState(null);

  // EIPD state
  const [eipdList, setEipdList] = useState([]);
  const [loadingEipd, setLoadingEipd] = useState(false);
  const [showEipdModal, setShowEipdModal] = useState(false);
  const [newEipd, setNewEipd] = useState({
    titulo: "",
    area_id: 1,
    descripcion_tratamiento: "",
    base_licitud: "Obligación Legal (Art. 13)",
    criterios_alto_riesgo_json: [],
    analisis_necesidad: "",
    riesgos_derechos: "",
    medidas_mitigacion: "",
    riesgo_residual: "Aceptable / Bajo",
    opinion_dpo: "",
    estado: "Aprobado con Mitigaciones"
  });

  const criteriosOficiales = [
    "1. Evaluación o puntuación / Perfilamiento de personas",
    "2. Toma de decisiones automatizadas con efectos jurídicos",
    "3. Observación, monitorización o videovigilancia sistemática",
    "4. Datos sensibles o categorías especiales (salud, biometría)",
    "5. Tratamiento de datos personales a gran escala",
    "6. Cruce o combinación de bases de datos distintas",
    "7. Datos de sujetos vulnerables (niños, pacientes, empleados)",
    "8. Uso innovador de nuevas tecnologías o IA",
    "9. Tratamientos que impiden a los titulares ejercer un derecho"
  ];

  // Fines simulator state
  const [finesData, setFinesData] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState("grave");
  const [activeAtenuantes, setActiveAtenuantes] = useState({
    dpo: true,
    compliance: true,
    cooperacion: true,
    hardening: true
  });

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

  async function loadEipds() {
    setLoadingEipd(true);
    try {
      const data = await api("/impact-assessments", token);
      setEipdList(data || []);
    } catch (err) {
      console.error("Error cargando EIPDs:", err);
    } finally {
      setLoadingEipd(false);
    }
  }

  async function loadFinesData() {
    try {
      const data = await api("/risks/fines-simulator", token);
      setFinesData(data);
    } catch (err) {
      console.error("Error cargando simulador de multas:", err);
    }
  }

  useEffect(() => {
    loadHeatmap();
    loadFinesData();
    loadEipds();
  }, [risks, token]);

  async function handleApproveEipd(id) {
    try {
      await api(`/impact-assessments/${id}/approve`, token, { method: "POST" });
      loadEipds();
    } catch (err) {
      alert("Error al aprobar EIPD: " + err.message);
    }
  }

  async function handleCreateEipd(e) {
    e.preventDefault();
    try {
      await api("/impact-assessments", token, {
        method: "POST",
        body: JSON.stringify(newEipd)
      });
      setShowEipdModal(false);
      loadEipds();
      setNewEipd({
        titulo: "",
        area_id: 1,
        descripcion_tratamiento: "",
        base_licitud: "Obligación Legal (Art. 13)",
        criterios_alto_riesgo_json: [],
        analisis_necesidad: "",
        riesgos_derechos: "",
        medidas_mitigacion: "",
        riesgo_residual: "Aceptable / Bajo",
        opinion_dpo: "",
        estado: "Aprobado con Mitigaciones"
      });
    } catch (err) {
      alert("Error al crear EIPD: " + err.message);
    }
  }

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

  function get5x5Color(prob, imp) {
    const score = prob * imp;
    if (score >= 16) return "bg-rose-600 text-white hover:bg-rose-700";
    if (score >= 10) return "bg-amber-500 text-white hover:bg-amber-600";
    if (score >= 6) return "bg-yellow-400 text-slate-900 hover:bg-yellow-500";
    return "bg-emerald-500 text-white hover:bg-emerald-600";
  }

  function getRisksInCell(prob, imp) {
    return risks.filter(r => (r.probabilidad || 2) === prob && (r.impacto || 2) === imp);
  }

  const eipdRequiredRisks = risks.filter(r => r.requiere_eipd);

  // Fines calculation
  const utmVal = finesData?.valor_utm_clp || 66000;
  const currentScenarioObj = finesData?.escenarios?.find(s => s.id === selectedScenario) || {
    categoria: "Infracción Grave",
    multa_max_utm: 10000,
    multa_max_clp: 660000000,
    ejemplos: []
  };

  const totalDiscount = (finesData?.atenuantes_legales || []).reduce((acc, a) => {
    return activeAtenuantes[a.id] ? acc + a.descuento_porcentaje : acc;
  }, 0);

  const cappedDiscount = Math.min(80, totalDiscount); // Legal cap on mitigating factors
  const mitigatedUtm = Math.round(currentScenarioObj.multa_max_utm * (1 - cappedDiscount / 100));
  const mitigatedClp = mitigatedUtm * utmVal;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Executive Header */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-teal-600 tracking-wider">Motor de Riesgos & Sanciones</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              Ley N° 21.719
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-1">Matriz de Riesgo 5×5, EIPD y Simulador de Sanciones</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cálculo ponderado de <strong>Probabilidad × Impacto</strong>, Evaluaciones de Impacto EIPD y cuantificación económica de multas legales.
          </p>
        </div>

        <a
          href={`${API_URL.replace("/api", "")}/api/risks/report?token=${token}`}
          download
          className="inline-flex items-center gap-2 rounded bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 shadow-sm shrink-0"
        >
          <Download size={14} />
          Exportar Informe de Riesgos (MD)
        </a>
      </div>

      {/* Tab Selector */}
      <div className="flex bg-slate-200/70 p-1 rounded-xl border border-slate-300 max-w-xl">
        <button
          onClick={() => setTab("matrix")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "matrix" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
        >
          Matriz 5×5 ({risks.length})
        </button>
        <button
          onClick={() => setTab("eipd")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "eipd" ? "bg-white text-teal-800 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
        >
          Evaluaciones EIPD (Art. 25) ({eipdList.length})
        </button>
        <button
          onClick={() => setTab("fines")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "fines" ? "bg-white text-teal-800 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
        >
          Simulador de Sanciones
        </button>
      </div>

      {tab === "eipd" ? (
        /* TAB 2: EIPD / DPIA ASSESSMENTS (ART. 25 LEY 21.719) */
        <div className="space-y-6">
          
          {/* Header Banner */}
          <div className="rounded-xl border border-teal-200 bg-gradient-to-r from-teal-900 via-teal-950 to-slate-900 text-white p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Gobernanza de Alto Riesgo · Art. 25 Ley N° 21.719
              </span>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles size={20} className="text-teal-400" />
                Evaluaciones de Impacto en Protección de Datos (EIPD / DPIA)
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Dictamen formal y obligatorio del DPO para tratamientos que involucren biometría, perfilamiento automatizado, vigilancia sistemática o datos sensibles a gran escala.
              </p>
            </div>

            <button
              onClick={() => setShowEipdModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-500 shadow-md transition-all shrink-0"
            >
              <Plus size={15} />
              Nueva Evaluación EIPD (Wizard)
            </button>
          </div>

          {/* EIPD Cards Grid */}
          {loadingEipd ? (
            <div className="p-12 text-center text-xs text-slate-400">Cargando evaluaciones EIPD...</div>
          ) : (
            <div className="grid gap-5">
              {eipdList.map((eipd) => (
                <div key={eipd.id} className="rounded-xl border border-line bg-white p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-black px-2.5 py-1 rounded bg-teal-50 text-teal-800 border border-teal-200">
                        EIPD-{String(eipd.id).padStart(4, "0")}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">{eipd.titulo}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <Check size={12} />
                        {eipd.estado}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {eipd.descripcion_tratamiento}
                  </p>

                  {/* High risk criteria tags */}
                  {eipd.criterios_alto_riesgo_json && eipd.criterios_alto_riesgo_json.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Factores de Alto Riesgo Acreditados (Art. 25):</span>
                      <div className="flex flex-wrap gap-1.5">
                        {eipd.criterios_alto_riesgo_json.map((crit, idx) => (
                          <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            ⚠️ {crit}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Technical & Organizational Mitigations */}
                  <div className="grid md:grid-cols-2 gap-3 text-xs pt-2">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Salvaguardas Técnicas Implementadas:</span>
                      <p className="text-slate-700 font-medium leading-relaxed">{eipd.medidas_mitigacion}</p>
                    </div>
                    <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200 space-y-1">
                      <span className="text-[10px] font-bold text-teal-800 uppercase block">Dictamen y Opinión del DPO:</span>
                      <p className="text-teal-950 font-medium leading-relaxed">{eipd.opinion_dpo}</p>
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px]">
                      <Fingerprint size={14} className="text-teal-600" />
                      <span>Hash SHA-256: {eipd.hash_integridad ? eipd.hash_integridad.substring(0, 24) + "..." : "Sello pendiente"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`${API_URL.replace("/api", "")}/api/impact-assessments/${eipd.id}/download?token=${token}`}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm"
                      >
                        <Download size={13} />
                        Descargar Dictamen (MD)
                      </a>
                      <button
                        onClick={() => handleApproveEipd(eipd.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-sm"
                      >
                        <ShieldCheck size={13} />
                        Sellar Dictamen DPO
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

          {/* Modal Wizard Nueva EIPD */}
          {showEipdModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Asistente de Evaluación de Impacto (EIPD / DPIA)</h3>
                    <p className="text-xs text-slate-400">Metodología oficial de 9 criterios conforme al Art. 25 de la Ley N° 21.719.</p>
                  </div>
                  <button onClick={() => setShowEipdModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
                </div>

                <form onSubmit={handleCreateEipd} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Título del Proyecto / Tratamiento *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: EIPD-03: Sistema de Videovigilancia y Reconocimiento de Patentes"
                      value={newEipd.titulo}
                      onChange={(e) => setNewEipd({ ...newEipd, titulo: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Descripción Sistemática del Tratamiento *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Detalle los datos recolectados, flujos de almacenamiento, finalidades y usuarios con acceso..."
                      value={newEipd.descripcion_tratamiento}
                      onChange={(e) => setNewEipd({ ...newEipd, descripcion_tratamiento: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  {/* 9 High risk criteria checkboxes */}
                  <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800 block text-xs">
                      Criterios Oficiales de Alto Riesgo (Marque los que apliquen):
                    </span>
                    <div className="space-y-1.5">
                      {criteriosOficiales.map((crit, idx) => {
                        const checked = newEipd.criterios_alto_riesgo_json.includes(crit);
                        return (
                          <label key={idx} className="flex items-center gap-2 cursor-pointer text-slate-700">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const updated = checked
                                  ? newEipd.criterios_alto_riesgo_json.filter((c) => c !== crit)
                                  : [...newEipd.criterios_alto_riesgo_json, crit];
                                setNewEipd({ ...newEipd, criterios_alto_riesgo_json: updated });
                              }}
                              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                            />
                            <span>{crit}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Salvaguardas y Mitigaciones Técnicas</label>
                      <textarea
                        rows={2}
                        placeholder="Ej: Cifrado AES-256, seudonimización, MFA y borrado seguro..."
                        value={newEipd.medidas_mitigacion}
                        onChange={(e) => setNewEipd({ ...newEipd, medidas_mitigacion: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 p-2.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Dictamen Vinculante del DPO</label>
                      <textarea
                        rows={2}
                        placeholder="Dictamen favorable con salvaguardas técnicas..."
                        value={newEipd.opinion_dpo}
                        onChange={(e) => setNewEipd({ ...newEipd, opinion_dpo: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 p-2.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowEipdModal(false)}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-teal-700 text-white font-bold hover:bg-teal-800 shadow-md"
                    >
                      Guardar y Sellar EIPD
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      ) : tab === "matrix" ? (
        <div className="space-y-6">
          {/* EIPD Banner if high risk exists */}
          {eipdRequiredRisks.length > 0 && (
            <div className="flex items-start gap-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-sm">
              <FileCheck className="mt-0.5 text-amber-700 shrink-0" size={22} />
              <div>
                <h4 className="font-bold text-sm">Atención: Se detectaron {eipdRequiredRisks.length} actividades que exigen una EIPD</h4>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  Conforme al Art. 25 de la Ley 21.719, los tratamientos de alto riesgo deben contar con una Evaluación de Impacto antes de su puesta en producción.
                </p>
              </div>
            </div>
          )}

          {/* 5x5 Heatmap & Department Grid */}
          <div className="grid gap-6 lg:grid-cols-12">
            
            {/* 5x5 Interactive Matrix */}
            <div className="lg:col-span-6 rounded-xl border border-line bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs uppercase font-bold text-slate-800 tracking-wider">Matriz Probabilidad × Impacto</span>
                <span className="text-[10px] text-slate-400 font-semibold">Haz clic en una celda para filtrar</span>
              </div>

              <div className="space-y-1">
                {[5, 4, 3, 2, 1].map((prob) => (
                  <div key={prob} className="flex items-center gap-2">
                    <span className="w-5 text-[10px] font-bold text-slate-400 text-right">{prob}</span>
                    <div className="grid grid-cols-5 gap-1.5 flex-1">
                      {[1, 2, 3, 4, 5].map((imp) => {
                        const cellRisks = getRisksInCell(prob, imp);
                        const isSelected = selectedRiskCell?.prob === prob && selectedRiskCell?.imp === imp;

                        return (
                          <button
                            key={imp}
                            onClick={() => setSelectedRiskCell(isSelected ? null : { prob, imp, risks: cellRisks })}
                            className={`h-9 rounded font-black text-xs transition-all flex items-center justify-center relative ${get5x5Color(prob, imp)} ${isSelected ? "ring-2 ring-slate-900 ring-offset-1 scale-105" : ""}`}
                          >
                            {cellRisks.length > 0 ? cellRisks.length : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="flex items-center gap-2 pt-1 pl-7">
                  <div className="grid grid-cols-5 gap-1.5 flex-1 text-center text-[10px] font-bold text-slate-400">
                    {[1, 2, 3, 4, 5].map(i => <div key={i}>{i}</div>)}
                  </div>
                </div>
                <div className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-1">
                  Impacto Operacional & Legal &rarr;
                </div>
              </div>
            </div>

            {/* Department Summary Heatmap */}
            <div className="lg:col-span-6 rounded-xl border border-line bg-white p-5 shadow-sm space-y-4">
              <span className="text-xs uppercase font-bold text-slate-800 tracking-wider block border-b border-slate-100 pb-2">
                Nivel de Riesgo por Áreas Institucionales
              </span>

              {loadingHeatmap ? (
                <div className="py-8 text-center text-xs text-slate-400">Cargando mapa de riesgos...</div>
              ) : (
                <div className="space-y-2.5">
                  {heatmap.map((h, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">{h.area}</span>
                        <span className="text-[10px] text-slate-400">
                          {h.requiere_eipd > 0 ? `⚠️ ${h.requiere_eipd} tratamientos EIPD` : "Riesgo controlado"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] font-bold">
                        {h.Crítico > 0 && <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white">{h.Crítico} Crítico</span>}
                        {h.Alto > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white">{h.Alto} Alto</span>}
                        {h.Medio > 0 && <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800">{h.Medio} Medio</span>}
                        {h.Bajo > 0 && <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">{h.Bajo} Bajo</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Risks Breakdown Table */}
          <div className="rounded-xl border border-line bg-white p-5 shadow-sm space-y-4">
            <span className="text-xs uppercase font-bold text-slate-800 tracking-wider block border-b border-slate-100 pb-2">
              Detalle de Riesgos Identificados ({risks.length})
            </span>

            <div className="space-y-3">
              {risks.map((r) => (
                <div key={r.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${getLevelBadge(r.nivel)}`}>
                        {r.nivel} ({r.puntuacion}/25)
                      </span>
                      {r.requiere_eipd && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Exige EIPD
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Prob: {r.probabilidad} | Imp: {r.impacto}</span>
                  </div>

                  <p className="text-slate-800 font-semibold">{r.descripcion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: FINES & PENALTIES SIMULATOR (ART. 50 LEY 21.719) */
        <div className="space-y-6">
          
          {/* Executive Sanction Calculator Card */}
          <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">Simulador de Exposición Económica</span>
              <h3 className="text-xl font-black text-slate-900">Exposición a Sanciones Administrativas (Ley 21.719)</h3>
              <p className="text-xs text-slate-600 max-w-xl">
                La Ley N° 21.719 faculta a la Agencia a aplicar multas de hasta <strong>20.000 UTM (~$1.320.000.000 CLP)</strong>. La adopción de atenuantes legales (DPO, RAT y LexApp GRC) reduce la exposición hasta en un {cappedDiscount}%.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
              <div className="bg-white p-3.5 rounded-xl border border-teal-200 shadow-sm text-center">
                <span className="text-xs font-bold text-slate-400 uppercase block">Multa Mitigada Estimada</span>
                <span className="text-2xl font-black text-teal-800 tracking-tight">{mitigatedUtm.toLocaleString()} UTM</span>
                <span className="text-[11px] text-slate-500 font-mono block mt-0.5">~${mitigatedClp.toLocaleString("es-CL")} CLP</span>
              </div>
            </div>
          </div>

          {/* Infraction Tier Selector */}
          <div className="grid gap-4 md:grid-cols-3">
            {(finesData?.escenarios || []).map((scen) => (
              <div
                key={scen.id}
                onClick={() => setSelectedScenario(scen.id)}
                className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${selectedScenario === scen.id ? "border-teal-600 bg-white shadow-md ring-2 ring-teal-600/20" : "border-slate-200 bg-slate-50 hover:bg-white"}`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-slate-800">{scen.categoria}</span>
                    <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">{scen.articulo}</span>
                  </div>

                  <div>
                    <span className="text-lg font-black text-slate-900">{scen.multa_max_utm.toLocaleString()} UTM</span>
                    <span className="text-[11px] text-slate-400 block font-mono">Hasta ${(scen.multa_max_clp).toLocaleString("es-CL")} CLP</span>
                  </div>

                  <ul className="text-[11px] text-slate-600 space-y-1 pt-2 border-t border-slate-150">
                    {scen.ejemplos.map((ej, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-teal-600 shrink-0">•</span>
                        <span>{ej}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Mitigating Factors (Art. 52) */}
          <div className="rounded-xl border border-line bg-white p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">Atenuantes Legales y Rebaja de Sanciones (Art. 52)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Marcar los controles implementados en la institución que acreditan la responsabilidad proactiva para reducir el monto de una eventual multa.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {(finesData?.atenuantes_legales || []).map((at) => {
                const isChecked = Boolean(activeAtenuantes[at.id]);
                return (
                  <label
                    key={at.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${isChecked ? "border-teal-300 bg-teal-50/40" : "border-slate-200 bg-slate-50"}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => setActiveAtenuantes({ ...activeAtenuantes, [at.id]: !isChecked })}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                      />
                      <span className="text-xs font-bold text-slate-800">{at.nombre}</span>
                    </div>

                    <span className="text-[11px] font-black text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded">
                      -{at.descuento_porcentaje}%
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
