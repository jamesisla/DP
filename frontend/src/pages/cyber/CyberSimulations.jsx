import React, { useState } from "react";
import { 
  Flame, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  FileCheck2, 
  Users, 
  ShieldCheck, 
  Play, 
  FileText,
  Sparkles,
  Award
} from "lucide-react";
import { API_URL, api } from "../../lib/api";

const ESCENARIOS_DEMO = [
  {
    tipo: "Ransomware & Extorsión Doble",
    titulo: "Simulacro de Infección Ransomware en Servidor de Postulaciones",
    narrativa: "A las 09:30 AM se detecta una alerta de cifrado masivo de archivos en una estación de trabajo de TI con intentos de conexión lateral a la subred de bases de datos. Se simula la activación del CSIRT institucional y la notificación formal a la ANCI."
  },
  {
    tipo: "Ataque DDoS Volumétrico",
    titulo: "Simulacro de Indisponibilidad Masiva de Ventanilla Única",
    narrativa: "Tráfico anómalo de 25 Gbps satura el enlace perimetral impidiendo la atención ciudadana. El equipo activa las listas de filtrado perimetral y cambia el enrutamiento a WAF en 20 minutos."
  },
  {
    tipo: "Compromiso de Proveedor TI (Supply Chain)",
    titulo: "Simulacro de Compromiso en Módulo de Terceros",
    narrativa: "Un proveedor de soporte TI reporta filtración de credenciales maestras. Se evalúa el aislamiento del túnel VPN y la auditoría de accesos en los últimos 30 días."
  }
];

export function CyberSimulations({ simulations = [], token, user, onReload }) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [titulo, setTitulo] = useState(ESCENARIOS_DEMO[0].titulo);
  const [tipoEscenario, setTipoEscenario] = useState(ESCENARIOS_DEMO[0].tipo);
  const [narrativa, setNarrativa] = useState(ESCENARIOS_DEMO[0].narrativa);
  const [tiempoRespuesta, setTiempoRespuesta] = useState(45);
  const [cumplioPlazo, setCumplioPlazo] = useState(true);
  const [lecciones, setLecciones] = useState("Se evidenció la necesidad de mantener copias físicas impresas del directorio de contactos de emergencia del CSIRT Nacional.");
  const [submitting, setSubmitting] = useState(false);

  function openCreate() {
    setTitulo(ESCENARIOS_DEMO[0].titulo);
    setTipoEscenario(ESCENARIOS_DEMO[0].tipo);
    setNarrativa(ESCENARIOS_DEMO[0].narrativa);
    setTiempoRespuesta(45);
    setCumplioPlazo(true);
    setLecciones("Se ejercitaron exitosamente los flujos de aislamiento de red y comunicación formal con el comité.");
    setCreateModalOpen(true);
  }

  function handleSelectPreset(idx) {
    setSelectedScenarioIndex(idx);
    const s = ESCENARIOS_DEMO[idx];
    setTitulo(s.titulo);
    setTipoEscenario(s.tipo);
    setNarrativa(s.narrativa);
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        titulo,
        tipo_escenario: tipoEscenario,
        escenario_narrativa: narrativa,
        fecha_ejecucion: new Date().toISOString().split("T")[0],
        tiempo_respuesta_minutos: parseInt(tiempoRespuesta),
        participantes_json: ["Jefe de Servicio", "CISO / Resp. TI", "Jefe Legal", "Encargado de Comunicaciones"],
        cumplio_plazo_3h: cumplioPlazo,
        lecciones_aprendidas: lecciones,
        estado: "Completado y Firmado"
      };

      await api("/cyber/simulations", token, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setCreateModalOpen(false);
      if (onReload) onReload();
    } catch (err) {
      alert("Error al registrar simulacro: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
            <Flame size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-indigo-600 tracking-wider">Entrenamiento & Crisis</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                Simulador de Crisis / War Games
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mt-0.5">Ejercicios de Simulación & Comité de Crisis ANCI</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulacros guiados de ciberataques (Ransomware, DDoS, Phishing) para entrenar al equipo y acreditar tiempos de respuesta ante la ANCI.
            </p>
          </div>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm"
        >
          <Play size={14} />
          Iniciar Ejercicio de Simulación
        </button>
      </div>

      {/* Preset Scenarios Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Escenarios de Crisis Disponibles (War Games)</h3>
        
        <div className="grid gap-4 md:grid-cols-3">
          {ESCENARIOS_DEMO.map((sc, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-2 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase">
                  {sc.tipo}
                </span>
                <h4 className="font-bold text-xs text-slate-800 leading-snug">{sc.titulo}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed">{sc.narrativa}</p>
              </div>

              <button
                onClick={() => { handleSelectPreset(i); setCreateModalOpen(true); }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded text-xs font-bold border border-slate-200 transition-colors mt-2"
              >
                <Play size={12} />
                Ejecutar este Escenario
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Executed Simulations History */}
      <div className="rounded-xl border border-line bg-white p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-800">Bitácora de Simulacros Ejecutados y Actas ANCI</h3>
            <p className="text-xs text-slate-500">Historial de ejercicios de preparación y actas firmadas para auditoría.</p>
          </div>
          <span className="text-xs font-bold text-slate-400">{simulations.length} registrados</span>
        </div>

        {simulations.length > 0 ? (
          <div className="space-y-4">
            {simulations.map((sim) => (
              <div
                key={sim.id}
                className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white space-y-3 transition-all"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                      {sim.codigo_ejercicio}
                    </span>
                    <h4 className="font-bold text-sm text-slate-800">{sim.titulo}</h4>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                      {sim.tipo_escenario}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Clock size={11} /> Reacción: {sim.tiempo_respuesta_minutos} min (Cumplió 3h)
                    </span>
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                      {sim.estado}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1 text-slate-700">
                  <p className="font-semibold text-slate-900">Narrativa del Ataque Simulado:</p>
                  <p className="text-slate-600 leading-relaxed">{sim.escenario_narrativa}</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Comité Participante:</span>
                    <p className="font-medium text-slate-800 mt-0.5">{sim.participantes_json?.join(" · ") || "Comité de Crisis Completo"}</p>
                  </div>

                  <div className="p-2.5 bg-white border border-indigo-200 rounded-lg">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase block">Lecciones Aprendidas / Plan de Acción:</span>
                    <p className="font-medium text-slate-800 mt-0.5">{sim.lecciones_aprendidas || "Flujos validados correctamente."}</p>
                  </div>
                </div>

                {/* Download Acta Button */}
                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <a
                    href={`${API_URL.replace("/api", "")}/api/cyber/simulations/${sim.id}/acta?token=${token}`}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-indigo-300 bg-indigo-50 text-indigo-800 rounded text-xs font-bold hover:bg-indigo-100 shadow-2xs"
                    title="Descargar Acta Oficial del Simulacro de Crisis"
                  >
                    <Download size={13} />
                    Descargar Acta Formal de Simulacro (MD)
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
            <Flame size={36} className="mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-sm">No hay simulacros ejecutados aún</p>
            <p className="text-xs mt-1">Ejecuta un escenario para entrenar al equipo y generar actas para la ANCI.</p>
          </div>
        )}
      </div>

      {/* --- CREATE SIMULATION MODAL --- */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Registrar Ejercicio de Crisis / War Game</h3>
            <p className="text-xs text-slate-400 mb-4">Acredita ante la ANCI la preparación y tiempos de respuesta de tu institución.</p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="sim-tit">Título del Simulacro</label>
                <input
                  id="sim-tit"
                  className="field mt-1 text-sm"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="sim-tipo">Tipo de Escenario</label>
                  <input
                    id="sim-tipo"
                    className="field mt-1 text-xs"
                    value={tipoEscenario}
                    onChange={(e) => setTipoEscenario(e.target.value)}
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="sim-time">Tiempo de Reacción (Minutos)</label>
                  <input
                    id="sim-time"
                    type="number"
                    className="field mt-1 text-xs"
                    value={tiempoRespuesta}
                    onChange={(e) => setTiempoRespuesta(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="sim-nar">Narrativa del Ataque Inyectado</label>
                <textarea
                  id="sim-nar"
                  className="field mt-1 text-xs h-20 py-2"
                  required
                  value={narrativa}
                  onChange={(e) => setNarrativa(e.target.value)}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="sim-lecc">Lecciones Aprendidas y Mejoras Identificadas</label>
                <textarea
                  id="sim-lecc"
                  className="field mt-1 text-xs h-16 py-2"
                  value={lecciones}
                  onChange={(e) => setLecciones(e.target.value)}
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
                  {submitting ? "Guardando..." : "Finalizar y Generar Acta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
