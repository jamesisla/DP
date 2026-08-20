import React, { useState } from "react";
import { 
  UserCheck, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Download, 
  Edit3, 
  User, 
  Mail, 
  ShieldAlert, 
  Filter 
} from "lucide-react";
import { Panel } from "../components/Panel";
import { api, API_URL } from "../lib/api";

const TIPOS_DERECHOS = [
  "Acceso",
  "Rectificación",
  "Cancelación",
  "Oposición",
  "Portabilidad",
  "Bloqueo"
];

const ESTADOS_ARCO = [
  "Ingresada",
  "En análisis",
  "Respondida favorable",
  "Rechazada fundada",
  "Prorrogada"
];

export function ArcoRequests({ arcoRequests = [], areas = [], users = [], token, user, onReload }) {
  const [filterTipo, setFilterTipo] = useState("Todos");
  const [filterEstado, setFilterEstado] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tipoDerecho, setTipoDerecho] = useState(TIPOS_DERECHOS[0]);
  const [titularNombre, setTitularNombre] = useState("");
  const [titularRut, setTitularRut] = useState("");
  const [titularEmail, setTitularEmail] = useState("");
  const [descripcionSolicitud, setDescripcionSolicitud] = useState("");
  const [areaDerivadaId, setAreaDerivadaId] = useState(areas[0] ? String(areas[0].id) : "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Resolve / Edit Modal state
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [resolveEstado, setResolveEstado] = useState("Respondida favorable");
  const [fundamentoRespuesta, setFundamentoRespuesta] = useState("");

  // Business day calculation helper
  function getBusinessDaysRemaining(limitDateStr) {
    const limit = new Date(limitDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    limit.setHours(0, 0, 0, 0);
    
    let count = 0;
    const isPast = today > limit;
    let cur = isPast ? new Date(limit) : new Date(today);
    const end = isPast ? new Date(today) : new Date(limit);

    while (cur < end) {
      cur.setDate(cur.getDate() + 1);
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        count++;
      }
    }
    return isPast ? -count : count;
  }

  function getSemaphoreBadge(daysRem, estado) {
    if (["Respondida favorable", "Rechazada fundada"].includes(estado)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle size={10} />
          Completada
        </span>
      );
    }
    if (daysRem < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
          <AlertTriangle size={10} />
          Vencida ({Math.abs(daysRem)} días de retraso)
        </span>
      );
    }
    if (daysRem <= 5) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <Clock size={10} />
          Urgente: {daysRem} días hábiles restantes
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <Clock size={10} />
        {daysRem} días hábiles
      </span>
    );
  }

  // Filtered requests
  const filtered = arcoRequests.filter((req) => {
    if (filterTipo !== "Todos" && req.tipo_derecho !== filterTipo) return false;
    if (filterEstado !== "Todos" && req.estado !== filterEstado) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const target = `${req.folio} ${req.titular_nombre} ${req.titular_rut} ${req.titular_email} ${req.descripcion_solicitud}`.toLowerCase();
      if (!target.includes(q)) return false;
    }
    return true;
  });

  // KPI calculations
  const total = arcoRequests.length;
  const pending = arcoRequests.filter((r) => ["Ingresada", "En análisis"].includes(r.estado)).length;
  const urgent = arcoRequests.filter((r) => ["Ingresada", "En análisis"].includes(r.estado) && getBusinessDaysRemaining(r.fecha_limite_legal) <= 5).length;
  const resolved = arcoRequests.filter((r) => ["Respondida favorable", "Rechazada fundada"].includes(r.estado)).length;

  function openCreate() {
    setTipoDerecho(TIPOS_DERECHOS[0]);
    setTitularNombre("");
    setTitularRut("");
    setTitularEmail("");
    setDescripcionSolicitud("");
    setAreaDerivadaId(areas[0] ? String(areas[0].id) : "");
    setError("");
    setCreateModalOpen(true);
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        tipo_derecho: tipoDerecho,
        titular_nombre: titularNombre,
        titular_rut: titularRut,
        titular_email: titularEmail,
        descripcion_solicitud: descripcionSolicitud,
        area_derivada_id: areaDerivadaId ? parseInt(areaDerivadaId) : null
      };

      await api("/arco", token, {
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

  function openResolve(req) {
    setSelectedReq(req);
    setResolveEstado(req.estado === "Ingresada" ? "En análisis" : req.estado);
    setFundamentoRespuesta(req.fundamento_respuesta || "");
    setError("");
    setResolveModalOpen(true);
  }

  async function handleResolveSubmit(e) {
    e.preventDefault();
    if (!selectedReq) return;
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        estado: resolveEstado,
        fundamento_respuesta: fundamentoRespuesta
      };

      await api(`/arco/${selectedReq.id}`, token, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      setResolveModalOpen(false);
      if (onReload) onReload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100 shrink-0">
            <UserCheck size={26} />
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-teal-600 tracking-wider">Atención de Titulares de Datos</span>
            <h2 className="text-xl font-bold text-slate-800 mt-0.5">Gestión de Solicitudes ARCO+ (Ley 21.719)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Control de plazos legales de <strong>15 días hábiles</strong> para responder solicitudes de Acceso, Rectificación, Cancelación, Oposición, Portabilidad y Bloqueo.
            </p>
          </div>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-95 shadow-sm shrink-0"
        >
          <Plus size={16} />
          Ingresar Solicitud ARCO+
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Solicitudes</span>
          <p className="text-2xl font-black text-slate-800 mt-1">{total}</p>
          <span className="text-xs text-slate-400 font-medium">Registradas históricamente</span>
        </div>

        <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">En Trámite Activo</span>
          <p className="text-2xl font-black text-blue-700 mt-1">{pending}</p>
          <span className="text-xs text-blue-500 font-medium">En proceso de análisis</span>
        </div>

        <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Urgentes (&le; 5 días)</span>
          <p className="text-2xl font-black text-rose-600 mt-1">{urgent}</p>
          <span className="text-xs text-rose-500 font-medium">Riesgo de vencimiento legal</span>
        </div>

        <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Resueltas</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{resolved}</p>
          <span className="text-xs text-emerald-500 font-medium">Con oficio emitido</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-line bg-white p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 flex-wrap">
        <div className="relative w-full md:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search size={15} />
          </span>
          <input
            type="text"
            className="field pl-9 text-xs h-9 min-h-0 py-0"
            placeholder="Buscar por folio, titular, RUT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Filter size={14} />
            <span>Tipo:</span>
            <select
              className="field text-xs h-8 min-h-0 py-0"
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
            >
              <option value="Todos">Todos los derechos</option>
              {TIPOS_DERECHOS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span>Estado:</span>
            <select
              className="field text-xs h-8 min-h-0 py-0"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
            >
              <option value="Todos">Todos los estados</option>
              {ESTADOS_ARCO.map((est) => (
                <option key={est} value={est}>{est}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Requests Grid / Cards */}
      {filtered.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {filtered.map((req) => {
            const daysRem = getBusinessDaysRemaining(req.fecha_limite_legal);
            const isCompleted = ["Respondida favorable", "Rechazada fundada"].includes(req.estado);

            return (
              <div 
                key={req.id}
                className="rounded-xl border border-line bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                          {req.folio}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          Derecho de {req.tipo_derecho}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mt-2">{req.titular_nombre}</h4>
                      <p className="text-xs text-slate-400 font-mono">RUT: {req.titular_rut} · {req.titular_email}</p>
                    </div>

                    <div>{getSemaphoreBadge(daysRem, req.estado)}</div>
                  </div>

                  {/* Description Box */}
                  <div className="bg-slate-50 border border-slate-150 rounded-lg p-3 text-xs text-slate-600 space-y-1">
                    <span className="font-bold text-slate-700 block">Detalle de la Solicitud:</span>
                    <p className="leading-relaxed">{req.descripcion_solicitud}</p>
                  </div>

                  {/* Dates & Assigned Info */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1">
                    <div>
                      <span className="text-slate-400 font-medium">Ingreso: </span>
                      <span className="font-semibold text-slate-700">{new Date(req.fecha_ingreso).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Límite Legal: </span>
                      <span className="font-bold text-slate-800">{new Date(req.fecha_limite_legal).toLocaleDateString()}</span>
                    </div>
                    {req.area_derivada && (
                      <div className="col-span-2">
                        <span className="text-slate-400 font-medium">Área Derivada: </span>
                        <span className="font-semibold text-slate-700">{req.area_derivada.nombre}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-100 flex-wrap gap-2">
                  <button
                    onClick={() => openResolve(req)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    <Edit3 size={13} />
                    {isCompleted ? "Ver / Modificar Resolución" : "Gestionar / Resolver"}
                  </button>

                  <a
                    href={`${API_URL.replace("/api", "")}/api/arco/${req.id}/oficio?token=${token}`}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-800 shadow-sm"
                    title="Descargar Oficio Formal de Respuesta"
                  >
                    <Download size={13} />
                    Oficio Respuesta (MD)
                  </a>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-350 p-12 text-center text-slate-400 bg-white shadow-sm">
          <UserCheck size={40} className="mx-auto mb-2 opacity-40" />
          <p className="font-semibold text-sm">No se encontraron solicitudes ARCO+</p>
          <p className="text-xs mt-1">Haz clic en "Ingresar Solicitud ARCO+" para recepcionar peticiones de titulares.</p>
        </div>
      )}

      {/* --- CREATE MODAL --- */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Ingreso de Solicitud de Derechos ARCO+</h3>
            <p className="text-xs text-slate-400 mb-4">Se activará el plazo legal perentorio de 15 días hábiles de respuesta.</p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="arco-tipo">Tipo de Derecho Ejercido</label>
                <select
                  id="arco-tipo"
                  className="field mt-1 text-sm"
                  value={tipoDerecho}
                  onChange={(e) => setTipoDerecho(e.target.value)}
                >
                  {TIPOS_DERECHOS.map((t) => (
                    <option key={t} value={t}>{t} de datos personales</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="arco-nom">Nombre Completo del Titular</label>
                  <input
                    id="arco-nom"
                    className="field mt-1 text-sm"
                    required
                    placeholder="Ej. Ana María Rojas"
                    value={titularNombre}
                    onChange={(e) => setTitularNombre(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="arco-rut">RUT del Titular</label>
                  <input
                    id="arco-rut"
                    className="field mt-1 text-sm"
                    required
                    placeholder="12.345.678-9"
                    value={titularRut}
                    onChange={(e) => setTitularRut(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="arco-email">Correo Electrónico de Notificación</label>
                  <input
                    id="arco-email"
                    type="email"
                    className="field mt-1 text-sm"
                    required
                    placeholder="ana.rojas@gmail.com"
                    value={titularEmail}
                    onChange={(e) => setTitularEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="arco-area">Derivar a División Interna</label>
                  <select
                    id="arco-area"
                    className="field mt-1 text-sm"
                    value={areaDerivadaId}
                    onChange={(e) => setAreaDerivadaId(e.target.value)}
                  >
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="arco-desc">Petición Concreta del Titular</label>
                <textarea
                  id="arco-desc"
                  className="field mt-1 text-sm h-20 py-2"
                  required
                  placeholder="Detalle exactamente qué datos o proceso solicita acceder, suprimir o rectificar..."
                  value={descripcionSolicitud}
                  onChange={(e) => setDescripcionSolicitud(e.target.value)}
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
                  className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-95 shadow-sm"
                >
                  {submitting ? "Ingresando..." : "Ingresar Solicitud"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RESOLVE / EDIT MODAL --- */}
      {resolveModalOpen && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Resolución de Solicitud ARCO+</h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">{selectedReq.folio} · {selectedReq.titular_nombre}</p>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="res-estado">Estado de la Solicitud</label>
                <select
                  id="res-estado"
                  className="field mt-1 text-sm"
                  value={resolveEstado}
                  onChange={(e) => setResolveEstado(e.target.value)}
                >
                  {ESTADOS_ARCO.map((est) => (
                    <option key={est} value={est}>{est}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label" htmlFor="res-fund">Fundamento de la Respuesta u Observaciones</label>
                <textarea
                  id="res-fund"
                  className="field mt-1 text-sm h-28 py-2"
                  placeholder="Fundamente la resolución adoptada (favorable, denegatoria fundada o antecedentes adicionales solicitados)..."
                  value={fundamentoRespuesta}
                  onChange={(e) => setFundamentoRespuesta(e.target.value)}
                />
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-150">{error}</p>}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolveModalOpen(false)}
                  className="rounded border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-95 shadow-sm"
                >
                  {submitting ? "Guardando..." : "Guardar Resolución"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
