import React, { useState } from "react";
import { 
  Radio, 
  Plus, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  Edit3, 
  Send, 
  FileWarning, 
  ShieldAlert, 
  ServerCrash 
} from "lucide-react";
import { API_URL, api } from "../../lib/api";

const TIPOS_ATAQUE = [
  "Ransomware / Secuestro de datos",
  "Phishing masivo / Robo de credenciales",
  "Ataque de Denegación de Servicio (DDoS)",
  "Intrusión no autorizada / Intrusión APT",
  "Alteración no autorizada (Defacement)",
  "Fuga o exfiltración de información confidencial",
  "Compromiso de proveedor tecnológico (Supply Chain)"
];

const SEVERIDADES = ["Baja", "Media", "Alta", "Crítica"];
const ESTADOS_INCIDENTE = ["Alerta Inicial (3h)", "En Contención", "En Análisis Forense", "Mitigado y Notificado"];

export function CyberIncidents({ incidents = [], token, user, onReload }) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedInc, setSelectedInc] = useState(null);

  // Form states
  const [tipoAtaque, setTipoAtaque] = useState(TIPOS_ATAQUE[0]);
  const [severidad, setSeveridad] = useState("Alta");
  const [afectaServicio, setAfectaServicio] = useState(true);
  const [descripcion, setDescripcion] = useState("");
  const [sistemasComprometidos, setSistemasComprometidos] = useState("");
  const [medidasContencion, setMedidasContencion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit states
  const [editEstado, setEditEstado] = useState("Alerta Inicial (3h)");
  const [editMedidas, setEditMedidas] = useState("");
  const [editAlerta3h, setEditAlerta3h] = useState(false);
  const [editInforme72h, setEditInforme72h] = useState(false);

  function get3hRemaining(deadlineStr) {
    const deadline = new Date(deadlineStr).getTime();
    const now = new Date().getTime();
    const diffMs = deadline - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours: diffHours, minutes: diffMins, isExpired: diffMs <= 0 };
  }

  function getSeveridadBadge(s) {
    switch (s) {
      case "Crítica": return "bg-rose-600 text-white font-black";
      case "Alta": return "bg-rose-100 text-rose-800 border-rose-300 font-bold";
      case "Media": return "bg-amber-100 text-amber-800 border-amber-300 font-bold";
      default: return "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold";
    }
  }

  function openCreate() {
    setTipoAtaque(TIPOS_ATAQUE[0]);
    setSeveridad("Alta");
    setAfectaServicio(true);
    setDescripcion("");
    setSistemasComprometidos("");
    setMedidasContencion("");
    setCreateModalOpen(true);
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        tipo_ataque: tipoAtaque,
        severidad,
        afecta_servicio_esencial: afectaServicio,
        descripcion,
        sistemas_comprometidos: sistemasComprometidos,
        medidas_contencion_aplicadas: medidasContencion
      };

      await api("/cyber/incidents", token, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setCreateModalOpen(false);
      if (onReload) onReload();
    } catch (err) {
      alert("Error al reportar incidente: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(inc) {
    setSelectedInc(inc);
    setEditEstado(inc.estado);
    setEditMedidas(inc.medidas_contencion_aplicadas || "");
    setEditAlerta3h(inc.alerta_3h_enviada_anci || false);
    setEditInforme72h(inc.informe_72h_enviado_anci || false);
    setEditModalOpen(true);
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!selectedInc) return;
    setSubmitting(true);
    try {
      const payload = {
        estado: editEstado,
        medidas_contencion_aplicadas: editMedidas,
        alerta_3h_enviada_anci: editAlerta3h,
        informe_72h_enviado_anci: editInforme72h
      };

      await api(`/cyber/incidents/${selectedInc.id}`, token, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      setEditModalOpen(false);
      if (onReload) onReload();
    } catch (err) {
      alert("Error al actualizar incidente: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const urgentCount = incidents.filter(i => !i.alerta_3h_enviada_anci && i.estado !== "Mitigado y Notificado").length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
            <Radio size={26} />
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-rose-600 tracking-wider">Notificación Obligatoria Ley 21.663</span>
            <h2 className="text-xl font-bold text-slate-800 mt-0.5">Gestión de Incidentes ANCI (Alerta 3h / 72h)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Protocolo legal de <strong>Alerta Temprana (3 horas)</strong> e <strong>Informe Técnico (72 horas)</strong> ante la Agencia Nacional de Ciberseguridad.
            </p>
          </div>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 shadow-sm shrink-0"
        >
          <Plus size={16} />
          Reportar Ciberataque / Incidente
        </button>
      </div>

      {/* Urgent 3h banner */}
      {urgentCount > 0 && (
        <div className="flex items-start gap-4 rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-900 shadow-sm animate-pulse">
          <AlertTriangle className="mt-0.5 text-rose-600 shrink-0" size={22} />
          <div>
            <h4 className="font-bold text-sm tracking-tight">ALERTA LEGAL: {urgentCount} INCIDENTE(S) SIN NOTIFICAR A LA ANCI (PLAZO 3 HORAS)</h4>
            <p className="mt-0.5 text-xs text-rose-800 font-medium leading-relaxed">
              El Art. 12 de la Ley N° 21.663 impone la obligación de remitir la Alerta Temprana en menos de 3 horas. Descarga el formulario de notificación y marca como enviado.
            </p>
          </div>
        </div>
      )}

      {/* Incidents List */}
      {incidents.length > 0 ? (
        <div className="space-y-4">
          {incidents.map((inc) => {
            const rem3h = get3hRemaining(inc.fecha_limite_alerta_3h);
            const isMitigated = inc.estado === "Mitigado y Notificado";

            return (
              <div
                key={inc.id}
                className={`rounded-xl border bg-white p-5 shadow-sm space-y-4 transition-all hover:shadow-md ${!inc.alerta_3h_enviada_anci && !isMitigated ? "border-rose-300 bg-rose-50/5" : "border-slate-200"}`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      {inc.codigo_incidente}
                    </span>
                    <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${getSeveridadBadge(inc.severidad)}`}>
                      Severidad {inc.severidad}
                    </span>
                    {inc.afecta_servicio_esencial && (
                      <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded border border-rose-300">
                        Afecta Servicio Esencial
                      </span>
                    )}
                    <h3 className="font-bold text-sm text-slate-800">{inc.tipo_ataque}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {inc.alerta_3h_enviada_anci ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <CheckCircle size={11} />
                        Alerta 3h Enviada a ANCI
                      </span>
                    ) : isMitigated ? (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Cerrado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-800 bg-rose-100 border border-rose-300 px-2.5 py-0.5 rounded-full animate-bounce">
                        <Clock size={11} />
                        Alerta 3h: {rem3h.hours}h {rem3h.minutes}m restantes
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 text-xs">
                  <div className="space-y-2">
                    <div>
                      <span className="font-bold text-slate-700 block">Descripción del Ataque y Vector de Entrada:</span>
                      <p className="text-slate-600 mt-0.5 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-150">
                        {inc.descripcion}
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 block">Sistemas Afectados (RSIC):</span>
                      <p className="text-slate-600 mt-0.5 font-medium">{inc.sistemas_comprometidos || "En evaluación preliminar."}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="font-bold text-slate-700 block">Medidas de Contención Aplicadas:</span>
                      <p className="text-slate-600 mt-0.5 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-150">
                        {inc.medidas_contencion_aplicadas || "Aislamiento de red y preservación forense de memoria/logs."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1">
                      <div>
                        <span className="text-slate-400 font-medium">Detección: </span>
                        <span className="font-semibold text-slate-700">{new Date(inc.fecha_deteccion).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Límite 3h: </span>
                        <span className="font-bold text-rose-700">{new Date(inc.fecha_limite_alerta_3h).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-100 flex-wrap gap-2">
                  <button
                    onClick={() => openEdit(inc)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800 shadow-sm"
                  >
                    <Edit3 size={13} />
                    Actualizar Estado / Reportes
                  </button>

                  <a
                    href={`${API_URL.replace("/api", "")}/api/cyber/incidents/${inc.id}/oficio-anci?token=${token}`}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-300 bg-rose-50 text-rose-800 rounded text-xs font-bold hover:bg-rose-100 shadow-sm"
                    title="Descargar Formulario Oficial de Notificación a la ANCI"
                  >
                    <Download size={13} />
                    Formulario Notificación ANCI (MD)
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-350 p-12 text-center text-slate-400 bg-white">
          <Radio size={40} className="mx-auto mb-2 opacity-40" />
          <p className="font-semibold text-sm">No hay incidentes de ciberseguridad activos</p>
          <p className="text-xs mt-1">Registra aquí ciberataques, intrusiones o denegaciones de servicio para controlar los plazos de 3h y 72h.</p>
        </div>
      )}

      {/* --- CREATE MODAL --- */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Reporte de Ciberataque / Incidente ANCI</h3>
            <p className="text-xs text-rose-600 mb-4 font-semibold">Se activará el temporizador de 3 horas para la Alerta Temprana legal.</p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="inc-tipo">Tipo de Ataque</label>
                  <select
                    id="inc-tipo"
                    className="field mt-1 text-xs"
                    value={tipoAtaque}
                    onChange={(e) => setTipoAtaque(e.target.value)}
                  >
                    {TIPOS_ATAQUE.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="field-label" htmlFor="inc-sev">Severidad</label>
                  <select
                    id="inc-sev"
                    className="field mt-1 text-xs"
                    value={severidad}
                    onChange={(e) => setSeveridad(e.target.value)}
                  >
                    {SEVERIDADES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                    checked={afectaServicio}
                    onChange={(e) => setAfectaServicio(e.target.checked)}
                  />
                  <span>¿Afecta la continuidad de un Servicio Esencial u OIV?</span>
                </label>
              </div>

              <div>
                <label className="field-label" htmlFor="inc-desc">Descripción de los Hechos e Indicadores de Compromiso</label>
                <textarea
                  id="inc-desc"
                  className="field mt-1 text-xs h-20 py-2"
                  required
                  placeholder="Detalle cómo se detectó el incidente, IPs de origen, vectores observados..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="inc-sist">Sistemas Comprometidos (RSIC)</label>
                <input
                  id="inc-sist"
                  className="field mt-1 text-xs"
                  placeholder="Ej. Servidor de Postulaciones RSIC-0001"
                  value={sistemasComprometidos}
                  onChange={(e) => setSistemasComprometidos(e.target.value)}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="inc-med">Medidas Inmediatas de Contención</label>
                <textarea
                  id="inc-med"
                  className="field mt-1 text-xs h-16 py-2"
                  placeholder="Ej. Aislamiento de VLAN, bloqueo en firewall, cambio forzado de credenciales..."
                  value={medidasContencion}
                  onChange={(e) => setMedidasContencion(e.target.value)}
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
                  className="rounded bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 shadow-sm"
                >
                  {submitting ? "Reportando..." : "Registrar Ciberataque"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {editModalOpen && selectedInc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Actualizar Incidente ANCI</h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">{selectedInc.codigo_incidente} · {selectedInc.tipo_ataque}</p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="einc-est">Estado del Incidente</label>
                <select
                  id="einc-est"
                  className="field mt-1 text-xs"
                  value={editEstado}
                  onChange={(e) => setEditEstado(e.target.value)}
                >
                  {ESTADOS_INCIDENTE.map(est => (
                    <option key={est} value={est}>{est}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label" htmlFor="einc-med">Medidas de Mitigación y Análisis Forense</label>
                <textarea
                  id="einc-med"
                  className="field mt-1 text-xs h-24 py-2"
                  placeholder="Detalle los avances del equipo CSIRT y medidas técnicas..."
                  value={editMedidas}
                  onChange={(e) => setEditMedidas(e.target.value)}
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    checked={editAlerta3h}
                    onChange={(e) => setEditAlerta3h(e.target.checked)}
                  />
                  <span>Marcar como Alerta Temprana (3 Horas) enviada formalmente a la ANCI</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    checked={editInforme72h}
                    onChange={(e) => setEditInforme72h(e.target.checked)}
                  />
                  <span>Marcar como Informe Técnico (72 Horas) remitido a la ANCI</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm"
                >
                  {submitting ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
