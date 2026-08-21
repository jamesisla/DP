import React, { useState } from "react";
import { 
  Activity, 
  ShieldCheck, 
  BarChart2, 
  Plus, 
  CheckCircle2, 
  TrendingUp, 
  Sliders 
} from "lucide-react";
import { api } from "../../lib/api";

export function CyberMaturity({ maturityList = [], token, user, onReload }) {
  const latest = maturityList[0] || null;

  const [modalOpen, setModalOpen] = useState(false);
  const [titulo, setTitulo] = useState("Diagnóstico de Madurez Ley 21.663");
  const [identificar, setIdentificar] = useState(65);
  const [proteger, setProteger] = useState(60);
  const [detectar, setDetectar] = useState(50);
  const [responder, setResponder] = useState(45);
  const [recuperar, setRecuperar] = useState(55);
  const [conclusiones, setConclusiones] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
            <span className="text-xs uppercase font-bold text-purple-600 tracking-wider">Marco Nacional de Ciberseguridad</span>
            <h2 className="text-xl font-bold text-slate-800 mt-0.5">Diagnóstico de Madurez Institucional (ANCI / NIST)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluación cuantitativa en los 5 dominios de seguridad para Prestadores de Servicios Esenciales y OIV.
            </p>
          </div>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm shrink-0"
        >
          <Plus size={16} />
          Actualizar Autoevaluación
        </button>
      </div>

      {latest ? (
        <div className="space-y-6">
          
          {/* Main Score Banner */}
          <div className="rounded-xl border border-line bg-white p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-white via-indigo-50/10 to-indigo-50/30">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                Evaluación: {new Date(latest.fecha_evaluacion).toLocaleDateString()}
              </span>
              <h3 className="text-lg font-bold text-slate-800">{latest.titulo}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {latest.conclusiones_ciso || "La institución mantiene controles adecuados en la identificación de activos y requiere formalizar ejercicios periódicos de respuesta ante incidentes."}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-white border border-indigo-200 rounded-2xl shadow-sm min-w-[160px]">
              <span className="text-4xl font-black text-indigo-700">{latest.madurez_global}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Madurez Global</span>
            </div>
          </div>

          {/* 5 Domains Detailed Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {domains.map((dom, idx) => (
              <div key={idx} className="rounded-xl border border-line bg-white p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-slate-800">{dom.name}</h4>
                  <span className={`text-base font-black ${dom.text}`}>{dom.score}%</span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className={`h-full ${dom.color}`} style={{ width: `${dom.score}%` }}></div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">{dom.desc}</p>
              </div>
            ))}
          </div>

        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-350 p-12 text-center text-slate-400 bg-white">
          <Activity size={40} className="mx-auto mb-2 opacity-40" />
          <p className="font-semibold text-sm">No hay autoevaluación registrada</p>
          <p className="text-xs mt-1">Haz clic en "Actualizar Autoevaluación" para medir el nivel de madurez ANCI.</p>
        </div>
      )}

      {/* --- ASSESSMENT MODAL --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Autoevaluación de Madurez Ciberseguridad</h3>
            <p className="text-xs text-slate-400 mb-4">Ajusta el porcentaje de cumplimiento por dominio (0 a 100%).</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="mat-tit">Título del Diagnóstico</label>
                <input
                  id="mat-tit"
                  className="field mt-1 text-xs"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              {[
                { label: "1. Identificar (Activos, Gobernanza, Riesgos)", val: identificar, set: setIdentificar },
                { label: "2. Proteger (MFA, Cifrado, Parches, Accesos)", val: proteger, set: setProteger },
                { label: "3. Detectar (Monitoreo SIEM, Logs, Anomalías)", val: detectar, set: setDetectar },
                { label: "4. Responder (Plan PRI, Notificación 3h ANCI)", val: responder, set: setResponder },
                { label: "5. Recuperar (Continuidad BCP/DRP, Backups)", val: recuperar, set: setRecuperar },
              ].map((field, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <label>{field.label}</label>
                    <span className="font-bold text-indigo-600">{field.val}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    value={field.val}
                    onChange={(e) => field.set(e.target.value)}
                  />
                </div>
              ))}

              <div>
                <label className="field-label" htmlFor="mat-concl">Conclusiones del CISO / Equipo de Seguridad</label>
                <textarea
                  id="mat-concl"
                  className="field mt-1 text-xs h-20 py-2"
                  placeholder="Resumen del estado técnico y plan de remediación prioritario..."
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
