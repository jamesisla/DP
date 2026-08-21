import React, { useState } from "react";
import { 
  BookOpenCheck, 
  Plus, 
  Trash2, 
  Download, 
  AlertTriangle, 
  Calendar, 
  Building,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Clock,
  FileCheck2,
  Lock
} from "lucide-react";
import { API_URL, api } from "../lib/api";

const CRITICIDADES = ["Crítico OIV", "Alto PSE", "Medio", "Bajo"];

export function Providers({ providers = [], areas = [], token, onReload }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [rut, setRut] = useState("");
  const [servicio, setServicio] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [areaId, setAreaId] = useState(areas[0] ? String(areas[0].id) : "");
  const [criticidadCiber, setCriticidadCiber] = useState("Medio");
  const [paisAlojamiento, setPaisAlojamiento] = useState("Chile");
  const [slaNotificacion, setSlaNotificacion] = useState(24);
  const [dpaFirmado, setDpaFirmado] = useState(true);
  const [clausulaAnci, setClausulaAnci] = useState(true);
  const [evaluacionSeguridad, setEvaluacionSeguridad] = useState("Conforme ISO 27001 / SOC 2");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function openCreate() {
    setNombre("");
    setRut("");
    setServicio("");
    setFechaInicio("");
    setFechaFin("");
    setAreaId(areas[0] ? String(areas[0].id) : "");
    setCriticidadCiber("Medio");
    setPaisAlojamiento("Chile");
    setSlaNotificacion(24);
    setDpaFirmado(true);
    setClausulaAnci(true);
    setEvaluacionSeguridad("Conforme ISO 27001 / SOC 2");
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        nombre,
        rut,
        servicio,
        fecha_contrato_inicio: fechaInicio,
        fecha_contrato_fin: fechaFin,
        area_id: areaId ? parseInt(areaId) : null,
        criticidad_ciber: criticidadCiber,
        pais_alojamiento: paisAlojamiento,
        sla_notificacion_horas: parseInt(slaNotificacion),
        dpa_firmado: dpaFirmado,
        clausula_anci_firmada: clausulaAnci,
        evaluacion_seguridad: evaluacionSeguridad
      };

      await api("/proveedores", token, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setModalOpen(false);
      if (onReload) onReload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("¿Está seguro de eliminar este proveedor?")) return;
    try {
      await api(`/proveedores/${id}`, token, { method: "DELETE" });
      if (onReload) onReload();
    } catch (err) {
      alert("Error al eliminar: " + err.message);
    }
  }

  function checkExpirationAlert(endDateStr) {
    const end = new Date(endDateStr);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 180;
  }

  function getDaysRemaining(endDateStr) {
    const end = new Date(endDateStr);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-teal-600 tracking-wider">Gestión de Encargados Externos</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              Supply Chain Security & DPA
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-1">Registro de Terceros, Proveedores & Cadena de Suministro</h2>
          <p className="text-xs text-slate-400 mt-0.5">Control y debida diligencia de encargados de tratamiento (Art. 16 Ley 21.719) y cláusulas de ciberseguridad ANCI (Art. 8 Ley 21.663).</p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 shadow-sm"
        >
          <Plus size={15} />
          Registrar Proveedor
        </button>
      </div>

      {/* Grid of Providers */}
      {providers.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {providers.map((prov) => {
            const isAlertActive = checkExpirationAlert(prov.fecha_contrato_fin);
            const daysLeft = getDaysRemaining(prov.fecha_contrato_fin);
            const areaObj = areas.find(a => a.id === prov.area_id);

            return (
              <div 
                key={prov.id}
                className={`rounded-xl border bg-white p-5 shadow-sm flex flex-col justify-between gap-4 transition-all hover:shadow-md ${isAlertActive ? "border-amber-300 bg-amber-50/5" : "border-slate-200"}`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{prov.nombre}</h4>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5">RUT: {prov.rut}</p>
                    </div>
                    
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                      Criticidad: {prov.criticidad_ciber || "Medio"}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1.5 font-medium">
                    <p><span className="font-bold text-slate-700">Servicio prestado:</span> {prov.servicio}</p>
                    
                    <div className="flex items-center gap-3 text-slate-500 text-[11px] flex-wrap">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        <span>Vigencia: {new Date(prov.fecha_contrato_inicio).toLocaleDateString()} al {new Date(prov.fecha_contrato_fin).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Globe size={12} className="text-indigo-600" />
                        <span>Alojamiento: {prov.pais_alojamiento || "Chile"}</span>
                      </div>
                    </div>

                    {areaObj && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Building size={12} className="text-slate-400" />
                        <span>División Responsable: {areaObj.nombre}</span>
                      </div>
                    )}
                  </div>

                  {/* Dual Compliance Badges (DPA + ANCI) */}
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Cláusulas Regulatorias Suscritas:</span>
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <span className={`inline-flex items-center gap-1 font-bold ${prov.dpa_firmado !== false ? "text-teal-700" : "text-slate-400"}`}>
                        <ShieldCheck size={13} /> DPA Ley 21.719 {prov.dpa_firmado !== false ? "[✓]" : "[✗]"}
                      </span>
                      <span className={`inline-flex items-center gap-1 font-bold ${prov.clausula_anci_firmada !== false ? "text-indigo-700" : "text-slate-400"}`}>
                        <Clock size={13} /> Alerta ANCI &lt;{prov.sla_notificacion_horas || 24}h {prov.clausula_anci_firmada !== false ? "[✓]" : "[✗]"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100 flex-wrap gap-2">
                  <a
                    href={`${API_URL.replace("/api", "")}/api/proveedores/${prov.id}/annex?token=${token}`}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-teal-200 bg-teal-50 rounded text-xs font-bold text-teal-800 hover:bg-teal-100 shadow-2xs transition-colors"
                  >
                    <Download size={13} />
                    Contrato DPA + ANCI (MD)
                  </a>

                  <button
                    onClick={() => handleDelete(prov.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                    title="Eliminar Proveedor"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-350 p-12 text-center text-slate-400 bg-white shadow-sm">
          <BookOpenCheck size={40} className="mx-auto mb-2 opacity-45" />
          <p className="font-semibold text-sm">No hay proveedores registrados</p>
          <p className="text-xs mt-1">Haz clic en "Registrar Proveedor" para incorporar contratos externos con cláusulas DPA y ANCI.</p>
        </div>
      )}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Registrar Proveedor & Cadena de Suministro</h3>
            <p className="text-xs text-slate-400 mb-4">Incorporación de cláusulas Art. 16 (Ley 21.719) y Art. 8 (Ley 21.663).</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="prov-name">Razón Social del Proveedor</label>
                <input
                  id="prov-name"
                  className="field mt-1 text-sm"
                  required
                  placeholder="Ej. Cloud & Data Services Chile SpA"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="prov-rut">RUT Proveedor</label>
                  <input
                    id="prov-rut"
                    className="field mt-1 text-xs"
                    required
                    placeholder="76.123.456-K"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="prov-area">Área Institucional</label>
                  <select
                    id="prov-area"
                    className="field mt-1 text-xs"
                    value={areaId}
                    onChange={(e) => setAreaId(e.target.value)}
                  >
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="prov-serv">Servicio Prestado y Datos Tratados</label>
                <input
                  id="prov-serv"
                  className="field mt-1 text-xs"
                  required
                  placeholder="Ej. Hosting Cloud, Soporte TI y gestión de base de datos"
                  value={servicio}
                  onChange={(e) => setServicio(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="prov-pais">País de Servidores / Alojamiento</label>
                  <input
                    id="prov-pais"
                    className="field mt-1 text-xs"
                    placeholder="Ej. Chile / EE.UU."
                    value={paisAlojamiento}
                    onChange={(e) => setPaisAlojamiento(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="prov-crit">Criticidad Ciberseguridad</label>
                  <select
                    id="prov-crit"
                    className="field mt-1 text-xs"
                    value={criticidadCiber}
                    onChange={(e) => setCriticidadCiber(e.target.value)}
                  >
                    {CRITICIDADES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="prov-start">Inicio Contrato</label>
                  <input
                    id="prov-start"
                    type="date"
                    className="field mt-1 text-xs"
                    required
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="prov-end">Término Contrato</label>
                  <input
                    id="prov-end"
                    type="date"
                    className="field mt-1 text-xs"
                    required
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </div>
              </div>

              {/* Dual Compliance Checkboxes */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                <span className="font-bold text-slate-700 block">Cláusulas de Cumplimiento Mandatorias:</span>
                
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-teal-800">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                    checked={dpaFirmado}
                    onChange={(e) => setDpaFirmado(e.target.checked)}
                  />
                  <span>Contrato de Encargado de Tratamiento (DPA Ley 21.719)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-indigo-900">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    checked={clausulaAnci}
                    onChange={(e) => setClausulaAnci(e.target.checked)}
                  />
                  <span>Obligación de Notificación de Incidentes en &lt;24h (Ley 21.663)</span>
                </label>
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>}

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
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
                  className="rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 shadow-sm"
                >
                  {submitting ? "Registrando..." : "Registrar Proveedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
