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
  Lock,
  Layers,
  MapPin
} from "lucide-react";
import { API_URL, api } from "../lib/api";

const CRITICIDADES = ["Crítico OIV", "Alto PSE", "Medio", "Bajo"];

const PAISES_ADECUADOS = ["Chile", "Estados Unidos", "Unión Europea", "Alemania", "España", "Irlanda", "Reino Unido", "Japón", "Canadá"];

export function Providers({ providers = [], areas = [], token, onReload, isCyber = false }) {
  const [tab, setTab] = useState("list"); // 'list', 'transfers'
  const [modalOpen, setModalOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [rut, setRut] = useState("");
  const [servicio, setServicio] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [areaId, setAreaId] = useState(areas[0] ? String(areas[0].id) : "");
  const [criticidadCiber, setCriticidadCiber] = useState(isCyber ? "Alto PSE" : "Medio");
  const [paisAlojamiento, setPaisAlojamiento] = useState("Chile");
  const [slaNotificacion, setSlaNotificacion] = useState(isCyber ? 12 : 24);
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
    setCriticidadCiber(isCyber ? "Alto PSE" : "Medio");
    setPaisAlojamiento("Chile");
    setSlaNotificacion(isCyber ? 12 : 24);
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
    const now = new Date();
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return { label: "Contrato Vencido", color: "bg-rose-100 text-rose-700 border-rose-300" };
    if (diffDays <= 30) return { label: `Por vencer (${diffDays} días)`, color: "bg-amber-100 text-amber-800 border-amber-300" };
    return { label: `Vigente (${diffDays} días)`, color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
  }

  // Cross-border transfers metrics
  const internationalProviders = providers.filter(p => p.pais_alojamiento && p.pais_alojamiento.toLowerCase() !== "chile");
  const localProviders = providers.filter(p => !p.pais_alojamiento || p.pais_alojamiento.toLowerCase() === "chile");

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-xs uppercase font-bold tracking-wider ${isCyber ? "text-indigo-600" : "text-teal-600"}`}>
              {isCyber ? "Cadena de Suministro TI & Proveedores Críticos" : "Gestión de Terceros & Cadena de Suministro"}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${isCyber ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-teal-50 text-teal-700 border-teal-200"}`}>
              {isCyber ? "Art. 8 y 10 Ley 21.663 (ANCI)" : "Art. 16 y 28 Ley 21.719 · Art. 8 Ley 21.663"}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-1">
            {isCyber ? "Proveedores Críticos TI, SLAs de Seguridad y Resiliencia" : "Proveedores, Acuerdos DPA y Transferencias Internacionales"}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isCyber 
              ? "Control de proveedores tecnológicos de servicios esenciales, evaluación ISO 27001/SOC 2 y SLAs de notificación ante incidentes."
              : "Control de encargados de datos, cláusulas de notificación mandatoria y flujo transfronterizo de información."
            }
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href={isCyber 
              ? `${API_URL.replace("/api", "")}/api/cyber/procurement-security-clauses?token=${token}`
              : `${API_URL.replace("/api", "")}/api/documents/procurement-dpa-clauses?token=${token}`
            }
            download
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold shadow-2xs transition-colors shrink-0 ${isCyber ? "border-indigo-300 bg-indigo-50 text-indigo-900 hover:bg-indigo-100" : "border-teal-300 bg-teal-50 text-teal-900 hover:bg-teal-100"}`}
            title={isCyber ? "Descargar Pliego de Ciberseguridad para Mercado Público / ChileCompra" : "Descargar Pliego DPA para Mercado Público / ChileCompra"}
          >
            <span>{isCyber ? "📋 Pliego ChileCompra Ciberdefensa (MD)" : "📋 Pliego ChileCompra DPA (MD)"}</span>
          </a>

          <button
            onClick={openCreate}
            className={`flex items-center gap-1.5 rounded px-4 py-2 text-xs font-bold text-white shadow-sm shrink-0 transition-colors ${isCyber ? "bg-indigo-700 hover:bg-indigo-800" : "bg-teal-700 hover:bg-teal-800"}`}
          >
            <Plus size={15} />
            {isCyber ? "Ingresar Proveedor TI" : "Ingresar Proveedor"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/70 p-1 rounded-xl border border-slate-300 max-w-md">
        <button
          onClick={() => setTab("list")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "list" ? (isCyber ? "bg-white text-indigo-900 shadow-2xs" : "bg-white text-slate-900 shadow-2xs") : "text-slate-600 hover:text-slate-900"}`}
        >
          Catálogo & Contratos ({providers.length})
        </button>
        <button
          onClick={() => setTab("transfers")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "transfers" ? (isCyber ? "bg-white text-indigo-700 shadow-2xs" : "bg-white text-teal-800 shadow-2xs") : "text-slate-600 hover:text-slate-900"}`}
        >
          Transferencias Internacionales ({internationalProviders.length})
        </button>
      </div>

      {tab === "list" ? (
        /* TAB 1: PROVIDERS LIST */
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => {
              const status = checkExpirationAlert(p.fecha_contrato_fin);
              const isAdequate = PAISES_ADECUADOS.includes(p.pais_alojamiento || "Chile");

              return (
                <div key={p.id} className="rounded-xl border border-line bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Building size={16} className="text-slate-400" />
                        <h4 className="font-bold text-sm text-slate-800">{p.nombre}</h4>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1">
                      <p><span className="font-semibold text-slate-700">RUT:</span> {p.rut || "Sin RUT"}</p>
                      <p><span className="font-semibold text-slate-700">Servicio:</span> {p.servicio}</p>
                      <p className="flex items-center gap-1.5">
                        <Globe size={13} className="text-indigo-600" />
                        <span className="font-semibold text-slate-700">Alojamiento:</span> {p.pais_alojamiento || "Chile"}
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${isAdequate ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                          {isAdequate ? "Nivel Adecuado" : "Requiere CCT"}
                        </span>
                      </p>
                    </div>

                    {/* Dual Compliance Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${p.dpa_firmado ? "bg-teal-50 text-teal-800 border-teal-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
                        {p.dpa_firmado ? "✓ DPA Firmado (Art. 16)" : "! Sin DPA"}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${p.clausula_anci_firmada ? "bg-indigo-50 text-indigo-800 border-indigo-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
                        {p.clausula_anci_firmada ? `✓ Cláusula ANCI <${p.sla_notificacion_horas || 24}h` : "! Sin Cláusula ANCI"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <a
                      href={`${API_URL.replace("/api", "")}/api/documents/contract/${p.id}/export?token=${token}`}
                      download
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900"
                    >
                      <Download size={13} />
                      Contrato Unificado (MD)
                    </a>

                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Eliminar proveedor"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {providers.length === 0 && (
            <div className="text-center py-12 border border-dashed border-slate-300 rounded-xl bg-white text-slate-400">
              <Building size={36} className="mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-sm">No hay proveedores registrados</p>
              <p className="text-xs mt-1">Haz clic en "Nuevo Proveedor" para incorporar contratos de servicios y DPA.</p>
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: CROSS-BORDER TRANSFERS (ART. 28 LEY 21.719) */
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Proveedores Cloud</span>
              <p className="text-2xl font-black text-slate-800 mt-1">{providers.length}</p>
              <span className="text-xs text-slate-400 font-medium">Servicios externos</span>
            </div>

            <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">Alojamiento Local (Chile)</span>
              <p className="text-2xl font-black text-teal-700 mt-1">{localProviders.length}</p>
              <span className="text-xs text-teal-600 font-medium">Sin transferencia internacional</span>
            </div>

            <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Flujo Transfronterizo (Art. 28)</span>
              <p className="text-2xl font-black text-indigo-700 mt-1">{internationalProviders.length}</p>
              <span className="text-xs text-indigo-600 font-medium">Servidores en el extranjero</span>
            </div>
          </div>

          {/* Transfers Breakdown */}
          <div className="rounded-xl border border-line bg-white p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">Mapa de Transferencias Internacionales y Destinos Cloud</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Conforme al Art. 28 de la Ley N° 21.719, las transferencias a países sin nivel adecuado de protección deben respaldarse mediante Cláusulas Contractuales Tipo (CCT) o Normas Corporativas Vinculantes (BCR).
              </p>
            </div>

            <div className="space-y-3">
              {internationalProviders.map((p) => {
                const isAdequate = PAISES_ADECUADOS.includes(p.pais_alojamiento || "Chile");

                return (
                  <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800">{p.nombre}</span>
                        <span className="text-xs text-slate-400">({p.servicio})</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <MapPin size={13} className="text-indigo-600" />
                        <span>País de Destino / Datacenter: <strong>{p.pais_alojamiento}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${isAdequate ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-300"}`}>
                        {isAdequate ? "✓ País con Nivel Adecuado" : "⚠️ Requiere Cláusulas Tipo (CCT)"}
                      </span>
                    </div>
                  </div>
                );
              })}

              {internationalProviders.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">
                  No se registran proveedores con infraestructura fuera de Chile.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- CREATE MODAL --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Registrar Nuevo Proveedor / Encargado</h3>
            <p className="text-xs text-slate-400 mb-4">Registro unificado con cláusulas de Protección de Datos (Art. 16 y 28) y Ciberseguridad ANCI (Art. 8).</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-2 bg-rose-50 text-rose-700 text-xs rounded border border-rose-200">{error}</div>}

              <div>
                <label className="field-label" htmlFor="p-name">Razón Social del Proveedor</label>
                <input
                  id="p-name"
                  className="field mt-1 text-sm"
                  required
                  placeholder="Ej. Cloud Infrastructure Ltd."
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="p-rut">RUT / Tax ID</label>
                  <input
                    id="p-rut"
                    className="field mt-1 text-xs"
                    placeholder="76.123.456-7"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="p-country">País Alojamiento Servidores</label>
                  <input
                    id="p-country"
                    className="field mt-1 text-xs"
                    placeholder="Chile, Estados Unidos, etc."
                    value={paisAlojamiento}
                    onChange={(e) => setPaisAlojamiento(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="p-serv">Descripción del Servicio</label>
                <input
                  id="p-serv"
                  className="field mt-1 text-xs"
                  required
                  placeholder="Ej. Almacenamiento cloud, mesa de ayuda, nómina..."
                  value={servicio}
                  onChange={(e) => setServicio(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="p-ini">Inicio Contrato</label>
                  <input
                    id="p-ini"
                    type="date"
                    className="field mt-1 text-xs"
                    required
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="p-fin">Término Contrato</label>
                  <input
                    id="p-fin"
                    type="date"
                    className="field mt-1 text-xs"
                    required
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                <span className="font-bold text-slate-700 block">Controles Contractuales Mandatorios:</span>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dpaFirmado}
                    onChange={(e) => setDpaFirmado(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <span>Acuerdo DPA Firmado (Art. 16 Ley 21.719)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clausulaAnci}
                    onChange={(e) => setClausulaAnci(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Cláusula Notificación ANCI &lt;24h (Art. 8 Ley 21.663)</span>
                </label>
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
                  className="rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 shadow-sm"
                >
                  {submitting ? "Guardando..." : "Registrar Proveedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
