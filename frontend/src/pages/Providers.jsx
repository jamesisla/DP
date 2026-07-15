import React, { useState } from "react";
import { BookOpenCheck, Plus, Trash2, Download, AlertTriangle, Calendar, Building } from "lucide-react";
import { Panel } from "../components/Panel";
import { api, API_URL } from "../lib/api";

export function Providers({ providers, areas, token, onReload }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [rut, setRut] = useState("");
  const [servicio, setServicio] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [areaId, setAreaId] = useState(areas[0] ? String(areas[0].id) : "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function openCreate() {
    setNombre("");
    setRut("");
    setServicio("");
    setFechaInicio("");
    setFechaFin("");
    setAreaId(areas[0] ? String(areas[0].id) : "");
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
        area_id: areaId ? parseInt(areaId) : null
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

  // Calculate if contract expires in less than 6 months (180 days)
  function checkExpirationAlert(endDateStr) {
    const end = new Date(endDateStr);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Expires in less than 180 days
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
          <span className="text-xs uppercase font-bold text-teal-600 tracking-wider">Gestión de Encargados Externos</span>
          <h2 className="text-xl font-bold text-slate-800 mt-1">Registro de Terceros y Proveedores</h2>
          <p className="text-xs text-slate-400 mt-0.5">Controla y audita a empresas y contratistas externos que traten datos personales institucionales.</p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-95 shadow-sm"
        >
          <Plus size={16} />
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
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">RUT: {prov.rut}</p>
                    </div>
                    
                    {isAlertActive && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertTriangle size={10} />
                        Renovación Cláusulas (Vence en {daysLeft} días)
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 space-y-1.5 font-medium">
                    <p><span className="font-bold text-slate-700">Servicio prestado:</span> {prov.servicio}</p>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      <span>Contrato: {new Date(prov.fecha_contrato_inicio).toLocaleDateString()} al {new Date(prov.fecha_contrato_fin).toLocaleDateString()}</span>
                    </div>
                    {areaObj && (
                      <div className="flex items-center gap-1.5">
                        <Building size={13} className="text-slate-400" />
                        <span>División Vinculada: {areaObj.nombre}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100 flex-wrap gap-2">
                  <a
                    href={`${API_URL.replace("/api", "")}/api/proveedores/${prov.id}/annex?token=${token}`}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-800 shadow-sm"
                  >
                    <Download size={13} />
                    Generar Anexo Legal (Bidding)
                  </a>

                  <button
                    onClick={() => handleDelete(prov.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                    title="Eliminar Proveedor"
                  >
                    <Trash2 size={15} />
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
          <p className="text-xs mt-1">Haz clic en "Registrar Proveedor" para incorporar contratos externos.</p>
        </div>
      )}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-soft">
            <h3 className="text-lg font-bold mb-4 text-slate-800">Registrar Proveedor Externo</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="prov-name">Razón Social del Proveedor</label>
                <input
                  id="prov-name"
                  className="field mt-1 text-sm"
                  required
                  placeholder="Ej. Servicios Informáticos SpA"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="prov-rut">RUT Proveedor</label>
                  <input
                    id="prov-rut"
                    className="field mt-1 text-sm"
                    required
                    placeholder="76.123.456-K"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="prov-area">Área Vinculada</label>
                  <select
                    id="prov-area"
                    className="field mt-1 text-sm"
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
                <label className="field-label" htmlFor="prov-serv">Servicio y Datos que Trata</label>
                <input
                  id="prov-serv"
                  className="field mt-1 text-sm"
                  required
                  placeholder="Ej. Soporte TI, Tratamiento de correos electrónicos"
                  value={servicio}
                  onChange={(e) => setServicio(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="prov-start">Inicio Contrato</label>
                  <input
                    id="prov-start"
                    type="date"
                    className="field mt-1 text-sm"
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
                    className="field mt-1 text-sm"
                    required
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
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
                  className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-95 shadow-sm"
                >
                  {submitting ? "Registrando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
