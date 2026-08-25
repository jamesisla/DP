import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Plus, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  Edit3, 
  Send, 
  Users, 
  Activity, 
  FileWarning, 
  ServerCrash 
} from "lucide-react";
import { Panel } from "../components/Panel";
import { api, API_URL } from "../lib/api";

const TIPOS_INCIDENTES = [
  "Acceso no autorizado",
  "Exfiltración de datos",
  "Ransomware / Denegación de servicio",
  "Alteración no autorizada",
  "Extravío de dispositivo físico",
  "Envío erróneo a destinatario no autorizado"
];

const GRAVEDADES = ["Baja", "Media", "Alta", "Crítica"];
const ESTADOS_INCIDENTE = ["En contención", "En investigación", "Notificado a Agencia", "Mitigado y Cerrado"];

export function SecurityBreaches({ breaches = [], token, user, onReload }) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBreach, setSelectedBreach] = useState(null);

  // Create form states
  const [tipoIncidente, setTipoIncidente] = useState(TIPOS_INCIDENTES[0]);
  const [gravedad, setGravedad] = useState("Alta");
  const [descripcion, setDescripcion] = useState("");
  const [datosAfectados, setDatosAfectados] = useState("");
  const [cantidadTitulares, setCantidadTitulares] = useState("100");
  const [medidasContencion, setMedidasContencion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Edit form states
  const [editEstado, setEditEstado] = useState("En contención");
  const [editMedidas, setEditMedidas] = useState("");
  const [editNotificadoAgencia, setEditNotificadoAgencia] = useState(false);
  const [editNotificadoTitulares, setEditNotificadoTitulares] = useState(false);

  // Time left calculation for 72h countdown
  function getHoursRemaining(deadlineStr) {
    const deadline = new Date(deadlineStr).getTime();
    const now = new Date().getTime();
    const diffMs = deadline - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours: diffHours, minutes: diffMins, isExpired: diffMs <= 0, diffMs };
  }

  function getGravedadBadge(g) {
    switch (g) {
      case "Crítica": return "bg-rose-600 text-white font-black";
      case "Alta": return "bg-rose-100 text-rose-800 border-rose-300 font-bold";
      case "Media": return "bg-amber-100 text-amber-800 border-amber-300 font-bold";
      default: return "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold";
    }
  }

  function openCreate() {
    setTipoIncidente(TIPOS_INCIDENTES[0]);
    setGravedad("Alta");
    setDescripcion("");
    setDatosAfectados("");
    setCantidadTitulares("100");
    setMedidasContencion("");
    setError("");
    setCreateModalOpen(true);
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        tipo_incidente: tipoIncidente,
        gravedad,
        descripcion,
        datos_afectados: datosAfectados,
        cantidad_titulares_afectados: parseInt(cantidadTitulares) || 0,
        medidas_contencion: medidasContencion
      };

      await api("/breaches", token, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setCreateModalOpen(false);
      if (onReload) onReload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(b) {
    setSelectedBreach(b);
    setEditEstado(b.estado);
    setEditMedidas(b.medidas_contencion || "");
    setEditNotificadoAgencia(b.notificado_agencia || false);
    setEditNotificadoTitulares(b.notificado_titulares || false);
    setError("");
    setEditModalOpen(true);
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!selectedBreach) return;
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        estado: editEstado,
        medidas_contencion: editMedidas,
        notificado_agencia: editNotificadoAgencia,
        notificado_titulares: editNotificadoTitulares
      };

      await api(`/breaches/${selectedBreach.id}`, token, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      setEditModalOpen(false);
      if (onReload) onReload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Count unnotified active breaches
  const unnotifiedCount = breaches.filter(b => !b.notificado_agencia && b.estado !== "Mitigado y Cerrado").length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
            <ShieldAlert size={26} />
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-rose-600 tracking-wider">Gestión de Incidentes de Seguridad</span>
            <h2 className="text-xl font-bold text-slate-800 mt-0.5">Notificación de Brechas de Seguridad (72 Horas)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Protocolo legal obligatorio de notificación a la <strong>Agencia Nacional de Protección de Datos</strong> dentro de las 72 horas de detectada la brecha.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href={`${API_URL.replace("/api", "")}/api/documents/crisis-citizen-notification?token=${token}`}
            download
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors shrink-0"
            title="Descargar Plantilla Oficial de Notificación Transparente a Titulares de Datos y Comunicado de Prensa (Art. 18)"
          >
            <span>📢 Comunicado Oficial Titulares (MD)</span>
          </a>

          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-sm shrink-0"
          >
            <Plus size={15} />
            Reportar Nueva Brecha
          </button>
        </div>
      </div>

      {/* Unnotified Alert Banner */}
      {unnotifiedCount > 0 && (
        <div className="flex items-start gap-4 rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-900 shadow-sm animate-pulse">
          <AlertTriangle className="mt-0.5 text-rose-600 shrink-0" size={22} />
          <div>
            <h4 className="font-bold text-sm tracking-tight">ALERTA LEGAL: {unnotifiedCount} INCIDENTE(S) SIN NOTIFICAR A LA AGENCIA</h4>
            <p className="mt-0.5 text-xs text-rose-800 font-medium leading-relaxed">
              La Ley 21.719 sanciona gravemente la omisión del deber de notificación en el plazo perentorio de 72 horas. Descarga el formulario oficial y marca como notificado a la brevedad.
            </p>
          </div>
        </div>
      )}

      {/* Breaches List Cards */}
      {breaches.length > 0 ? (
        <div className="space-y-4">
          {breaches.map((b) => {
            const rem = getHoursRemaining(b.fecha_limite_notificacion);
            const isClosed = b.estado === "Mitigado y Cerrado";

            return (
              <div
                key={b.id}
                className={`rounded-xl border bg-white p-5 shadow-sm space-y-4 transition-all hover:shadow-md ${!b.notificado_agencia && !isClosed ? "border-rose-300 bg-rose-50/5" : "border-slate-200"}`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      {b.codigo_incidente}
                    </span>
                    <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${getGravedadBadge(b.gravedad)}`}>
                      Gravedad {b.gravedad}
                    </span>
                    <h3 className="font-bold text-sm text-slate-800">{b.tipo_incidente}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {b.notificado_agencia ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <CheckCircle size={11} />
                        Notificado a la Agencia
                      </span>
                    ) : isClosed ? (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Cerrado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-800 bg-rose-100 border border-rose-300 px-2.5 py-0.5 rounded-full animate-bounce">
                        <Clock size={11} />
                        Plazo 72h: {rem.hours}h {rem.minutes}m restantes
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 text-xs">
                  <div className="space-y-2">
                    <div>
                      <span className="font-bold text-slate-700 block">Descripción del Incidente:</span>
                      <p className="text-slate-600 mt-0.5 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-150">
                        {b.descripcion}
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 block">Datos Personales Comprometidos:</span>
                      <p className="text-slate-600 mt-0.5 font-medium">
                        {b.datos_afectados} ({b.cantidad_titulares_afectados?.toLocaleString() || b.cantidad_titulares_afectados} titulares estimados)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="font-bold text-slate-700 block">Medidas de Contención Aplicadas:</span>
                      <p className="text-slate-600 mt-0.5 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-150">
                        {b.medidas_contencion || "Sin medidas registradas aún."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1">
                      <div>
                        <span className="text-slate-400 font-medium">Detección: </span>
                        <span className="font-semibold text-slate-700">{new Date(b.fecha_deteccion).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Límite 72h: </span>
                        <span className="font-bold text-rose-700">{new Date(b.fecha_limite_notificacion).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cross-correlation CISO / ANCI Banner */}
                {b.origen_ciberseguridad && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                    <div className="flex items-center gap-2 text-indigo-950 font-bold">
                      <ServerCrash size={16} className="text-indigo-600 shrink-0" />
                      <div>
                        <span>🔒 ORIGEN CIBERATAQUE (WAZUH SIEM / ANCI):</span>
                        <span className="font-normal text-indigo-900 ml-1">Activo RSIC comprometido: {b.activo_rsic_afectado || "Servidor Central BD"}.</span>
                      </div>
                    </div>
                    {b.codigo_incidente_ciber && (
                      <span className="font-mono bg-white px-2.5 py-1 rounded border border-indigo-300 text-indigo-900 font-bold shrink-0 shadow-2xs">
                        Incidente ANCI: {b.codigo_incidente_ciber} · 3h
                      </span>
                    )}
                  </div>
                )}

                {/* Footer Actions */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-100 flex-wrap gap-2">
                  <button
                    onClick={() => openEdit(b)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800 shadow-sm"
                  >
                    <Edit3 size={13} />
                    Actualizar Medidas / Estado
                  </button>

                  <a
                    href={`${API_URL.replace("/api", "")}/api/breaches/${b.id}/notification-form?token=${token}`}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-300 bg-rose-50 text-rose-800 rounded text-xs font-bold hover:bg-rose-100 shadow-sm"
                    title="Descargar Formulario de Notificación Oficial"
                  >
                    <Download size={13} />
                    Formulario Notificación Agencia (MD)
                  </a>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-350 p-12 text-center text-slate-400 bg-white shadow-sm">
          <ShieldAlert size={40} className="mx-auto mb-2 opacity-40" />
          <p className="font-semibold text-sm">No hay incidentes ni brechas registradas</p>
          <p className="text-xs mt-1">Registra aquí cualquier acceso no autorizado o fuga de datos para controlar el plazo legal de 72h.</p>
        </div>
      )}

      {/* --- CREATE MODAL --- */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Reporte de Incidente / Brecha de Seguridad</h3>
            <p className="text-xs text-rose-600 mb-4 font-semibold">El temporizador de 72 horas para notificación oficial a la Agencia comenzará ahora.</p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="b-tipo">Tipo de Incidente</label>
                  <select
                    id="b-tipo"
                    className="field mt-1 text-sm"
                    value={tipoIncidente}
                    onChange={(e) => setTipoIncidente(e.target.value)}
                  >
                    {TIPOS_INCIDENTES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="b-grav">Gravedad Estimada</label>
                  <select
                    id="b-grav"
                    className="field mt-1 text-sm"
                    value={gravedad}
                    onChange={(e) => setGravedad(e.target.value)}
                  >
                    {GRAVEDADES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="b-desc">Descripción de los Hechos y Origen</label>
                <textarea
                  id="b-desc"
                  className="field mt-1 text-sm h-20 py-2"
                  required
                  placeholder="Detalle cómo ocurrió la brecha, sistemas o servidores afectados..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="b-datos">Categorías de Datos Comprometidos</label>
                  <input
                    id="b-datos"
                    className="field mt-1 text-sm"
                    required
                    placeholder="Ej. RUN, Nombres, Diagnósticos"
                    value={datosAfectados}
                    onChange={(e) => setDatosAfectados(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="b-titulares">Titulares Estimados Afectados</label>
                  <input
                    id="b-titulares"
                    type="number"
                    className="field mt-1 text-sm"
                    required
                    placeholder="150"
                    value={cantidadTitulares}
                    onChange={(e) => setCantidadTitulares(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="b-med">Medidas Inmediatas de Contención</label>
                <textarea
                  id="b-med"
                  className="field mt-1 text-sm h-20 py-2"
                  placeholder="Ej. Aislamiento de red, bloqueo de credenciales, activación de backup..."
                  value={medidasContencion}
                  onChange={(e) => setMedidasContencion(e.target.value)}
                />
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-150">{error}</p>}

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
                  {submitting ? "Reportando..." : "Registrar Brecha"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT / RESOLVE MODAL --- */}
      {editModalOpen && selectedBreach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Actualizar Incidente de Seguridad</h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">{selectedBreach.codigo_incidente} · {selectedBreach.tipo_incidente}</p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="eb-estado">Estado del Incidente</label>
                <select
                  id="eb-estado"
                  className="field mt-1 text-sm"
                  value={editEstado}
                  onChange={(e) => setEditEstado(e.target.value)}
                >
                  {ESTADOS_INCIDENTE.map(est => (
                    <option key={est} value={est}>{est}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label" htmlFor="eb-med">Medidas de Mitigación y Análisis Forense</label>
                <textarea
                  id="eb-med"
                  className="field mt-1 text-sm h-24 py-2"
                  placeholder="Detalle los avances de la investigación y remediación técnica..."
                  value={editMedidas}
                  onChange={(e) => setEditMedidas(e.target.value)}
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-brand focus:ring-brand h-4 w-4"
                    checked={editNotificadoAgencia}
                    onChange={(e) => setEditNotificadoAgencia(e.target.checked)}
                  />
                  <span>Marcar como notificado formalmente a la Agencia de Protección de Datos</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-brand focus:ring-brand h-4 w-4"
                    checked={editNotificadoTitulares}
                    onChange={(e) => setEditNotificadoTitulares(e.target.checked)}
                  />
                  <span>Marcar como notificado a los titulares afectados (si correspondía)</span>
                </label>
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-150">{error}</p>}

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
                  className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-95 shadow-sm"
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
