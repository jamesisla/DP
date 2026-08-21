import React, { useState, useEffect } from "react";
import { 
  Activity, 
  ShieldCheck, 
  BarChart2, 
  Plus, 
  CheckCircle2, 
  TrendingUp, 
  Sliders,
  Layers,
  Download,
  BookOpen,
  Scale,
  FileSpreadsheet
} from "lucide-react";
import { API_URL, api } from "../../lib/api";

export function CyberMaturity({ maturityList = [], token, user, onReload }) {
  const latest = maturityList[0] || null;
  const [tab, setTab] = useState("radar"); // "radar" | "crosswalk"

  // Crosswalk data
  const [crosswalk, setCrosswalk] = useState([]);
  const [loadingCrosswalk, setLoadingCrosswalk] = useState(false);

  // Edit / Assessment modal
  const [modalOpen, setModalOpen] = useState(false);
  const [titulo, setTitulo] = useState("Diagnóstico de Madurez Ley 21.663");
  const [identificar, setIdentificar] = useState(65);
  const [proteger, setProteger] = useState(60);
  const [detectar, setDetectar] = useState(50);
  const [responder, setResponder] = useState(45);
  const [recuperar, setRecuperar] = useState(55);
  const [conclusiones, setConclusiones] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (tab === "crosswalk" && crosswalk.length === 0) {
      loadCrosswalk();
    }
  }, [tab]);

  async function loadCrosswalk() {
    setLoadingCrosswalk(true);
    try {
      const res = await api("/cyber/crosswalk-matrix", token);
      setCrosswalk(res);
    } catch (err) {
      console.error("Error al cargar matriz cruzada:", err);
    } finally {
      setLoadingCrosswalk(false);
    }
  }

  function openCreate() {
    if (latest) {
      setIdentificar(latest.porcentaje_identificar);
      setProteger(latest.porcentaje_proteger);
      setDetectar(latest.porcentaje_detectar);
      setResponder(latest.porcentaje_responder);
      setRecuperar(latest.porcentaje_recuperar);
      setConclusiones(latest.conclusiones_ciso || "");
    }
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        titulo,
        porcentaje_identificar: parseInt(identificar),
        porcentaje_proteger: parseInt(proteger),
        porcentaje_detectar: parseInt(detectar),
        porcentaje_responder: parseInt(responder),
        porcentaje_recuperar: parseInt(recuperar),
        conclusiones_ciso: conclusiones
      };

      await api("/cyber/maturity", token, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setModalOpen(false);
      if (onReload) onReload();
    } catch (err) {
      alert("Error al guardar evaluación: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const domains = latest ? [
    { name: "1. Identificar", score: latest.porcentaje_identificar, desc: "Inventario de activos RSIC, gobernanza, gestión de riesgos y cadena de suministro.", color: "bg-blue-600", text: "text-blue-700" },
    { name: "2. Proteger", score: latest.porcentaje_proteger, desc: "Control de accesos, MFA, cifrado de datos, capacitación y gestión de parches.", color: "bg-indigo-600", text: "text-indigo-700" },
    { name: "3. Detectar", score: latest.porcentaje_detectar, desc: "Monitoreo continuo de eventos (SIEM/SOC), detección de intrusiones y anomalías.", color: "bg-purple-600", text: "text-purple-700" },
    { name: "4. Responder", score: latest.porcentaje_responder, desc: "Plan de Respuesta a Incidentes (PRI), notificación en 3h a la ANCI y análisis forense.", color: "bg-amber-600", text: "text-amber-700" },
    { name: "5. Recuperar", score: latest.porcentaje_recuperar, desc: "Planes de Continuidad BCP/DRP, copias de respaldo inmutables y lecciones aprendidas.", color: "bg-emerald-600", text: "text-emerald-700" },
  ] : [];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-purple-50 text-purple-700 border border-purple-100 shrink-0">
            <Activity size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-purple-600 tracking-wider">Marco Nacional de Ciberseguridad</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                NIST CSF 2.0 & ISO 27001
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mt-0.5">Diagnóstico de Madurez & Matriz de Correspondencia (Crosswalk)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluación cuantitativa en los 5 dominios ANCI y correspondencia regulatoria unificada con la Ley 21.719 y normas ISO.
            </p>
          </div>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm shrink-0"
        >
          <Plus size={15} />
          Actualizar Autoevaluación
        </button>
      </div>

      {/* Tabs Selector: 5 Domains Radar vs Crosswalk Matrix */}
      <div className="flex bg-slate-200/70 p-1 rounded-xl border border-slate-300 max-w-md">
        <button
          onClick={() => setTab("radar")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "radar" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
        >
          Dominios NIST / ANCI ({latest ? `${latest.madurez_global}%` : "0%"})
        </button>
        <button
          onClick={() => setTab("crosswalk")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "crosswalk" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
        >
          Matriz Cruzada (Crosswalk GRC)
        </button>
      </div>

      {tab === "radar" ? (
        latest ? (
          <div className="space-y-6">
            
            {/* Global Score Card */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
              <div className="space-y-1 text-center md:text-left">
                <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">Índice Global Ponderado</span>
                <h3 className="text-xl font-black text-indigo-950">Madurez Nacional de Ciberseguridad</h3>
                <p className="text-xs text-indigo-900/80 max-w-xl">
                  {latest.conclusiones_ciso || "La institución mantiene un nivel de madurez intermedio con capacidades activas de respuesta y controles perimetrales conformes."}
                </p>
              </div>

              <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-indigo-200 shadow-sm shrink-0">
                <div className="text-center">
                  <span className="text-3xl font-black text-indigo-600 tracking-tight">{latest.madurez_global}%</span>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mt-0.5">Madurez Global</span>
                </div>
              </div>
            </div>

            {/* 5 Domains Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {domains.map((dom, idx) => (
                <div 
                  key={idx}
                  className="rounded-xl border border-line bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-sm text-slate-800">{dom.name}</h4>
                      <span className={`text-xs font-black px-2 py-0.5 rounded bg-slate-50 border border-slate-200 ${dom.text}`}>
                        {dom.score}%
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">{dom.desc}</p>
                  </div>

                  <div className="space-y-1.5 pt-3 border-t border-slate-100">
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full ${dom.color} transition-all duration-500`}
                        style={{ width: `${dom.score}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                      <span>Nivel Inicial</span>
                      <span>Optimizado</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-350 p-12 text-center text-slate-400 bg-white">
            <BarChart2 size={40} className="mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-sm">No hay diagnósticos de madurez registrados</p>
            <p className="text-xs mt-1">Haz clic en "Actualizar Autoevaluación" para calificar los 5 dominios.</p>
          </div>
        )
      ) : (
        /* TAB 2: CROSSWALK REGULATORY MATRIX */
        <div className="rounded-xl border border-line bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">Matriz de Correspondencia Regulatoria Cruzada</h3>
              <p className="text-xs text-slate-500">Mapeo unificado entre Ley 21.719 (Datos), Ley 21.663 (ANCI), ISO 27001 y NIST CSF 2.0.</p>
            </div>

            <a
              href={`${API_URL.replace("/api", "")}/api/cyber/crosswalk-matrix/download?token=${token}`}
              download
              className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-900 hover:bg-indigo-100 shadow-2xs"
            >
              <Download size={13} />
              Exportar Matriz Cruzada (MD)
            </a>
          </div>

          {loadingCrosswalk ? (
            <div className="py-8 text-center text-xs text-slate-400">Cargando correspondencias regulatorias...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="p-3">Dominio & Control</th>
                    <th className="p-3 text-teal-800">Ley N° 21.719 (Datos)</th>
                    <th className="p-3 text-indigo-800">Ley N° 21.663 (ANCI)</th>
                    <th className="p-3 text-slate-700">ISO/IEC 27001:2022</th>
                    <th className="p-3 text-purple-800">NIST CSF 2.0</th>
                    <th className="p-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {crosswalk.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{row.control}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{row.dominio} ({row.id})</span>
                      </td>
                      <td className="p-3 font-medium text-teal-900 bg-teal-50/20">{row.ley_21719}</td>
                      <td className="p-3 font-medium text-indigo-900 bg-indigo-50/20">{row.ley_21663}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-600">{row.iso_27001}</td>
                      <td className="p-3 font-mono text-[11px] text-purple-900">{row.nist_csf}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {row.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- ASSESSMENT MODAL --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Evaluación de Madurez de Ciberseguridad</h3>
            <p className="text-xs text-slate-400 mb-4">Califica de 0% a 100% el nivel de adopción en cada dominio del marco nacional.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="mat-tit">Título / Período de Evaluación</label>
                <input
                  id="mat-tit"
                  className="field mt-1 text-sm"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              {/* 5 sliders */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div>
                  <div className="flex justify-between font-bold text-slate-700 mb-1">
                    <span>1. Identificar (Activos, Riesgos, Cadena de Suministro)</span>
                    <span className="text-indigo-600">{identificar}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    value={identificar}
                    onChange={(e) => setIdentificar(e.target.value)}
                  />
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-700 mb-1">
                    <span>2. Proteger (MFA, Cifrado, Control de Accesos)</span>
                    <span className="text-indigo-600">{proteger}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    value={proteger}
                    onChange={(e) => setProteger(e.target.value)}
                  />
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-700 mb-1">
                    <span>3. Detectar (Monitoreo de Eventos, SIEM, EDR)</span>
                    <span className="text-indigo-600">{detectar}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    value={detectar}
                    onChange={(e) => setDetectar(e.target.value)}
                  />
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-700 mb-1">
                    <span>4. Responder (Plan PRI, Alerta Temprana 3h)</span>
                    <span className="text-indigo-600">{responder}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    value={responder}
                    onChange={(e) => setResponder(e.target.value)}
                  />
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-700 mb-1">
                    <span>5. Recuperar (Backups Inmutables, Plan BCP/DRP)</span>
                    <span className="text-indigo-600">{recuperar}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    value={recuperar}
                    onChange={(e) => setRecuperar(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="mat-conc">Conclusiones del CISO / Dictamen</label>
                <textarea
                  id="mat-conc"
                  className="field mt-1 text-xs h-20 py-2"
                  placeholder="Resumen del estado de madurez, fortalezas y brechas prioritarias..."
                  value={conclusiones}
                  onChange={(e) => setConclusiones(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm"
                >
                  {submitting ? "Guardando..." : "Guardar Evaluación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
