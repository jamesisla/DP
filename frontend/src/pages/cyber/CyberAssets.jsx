import React, { useState } from "react";
import { 
  Server, 
  Plus, 
  Search, 
  Lock, 
  KeyRound, 
  HardDrive, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  ShieldCheck, 
  Cpu 
} from "lucide-react";
import { api } from "../../lib/api";

const TIPOS_ACTIVOS = [
  "Servidor Central",
  "Base de Datos",
  "Red / Firewall",
  "Portal Ciudadano",
  "Nube OCI / AWS",
  "Endpoint Crítico",
  "Sistema SCADA / IoT"
];

const CRITICIDADES = [
  "Crítico OIV",
  "Alto PSE",
  "Medio",
  "Bajo"
];

export function CyberAssets({ assets = [], areas = [], token, user, onReload }) {
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("Todos");
  const [filterCrit, setFilterCrit] = useState("Todos");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState(TIPOS_ACTIVOS[0]);
  const [criticidad, setCriticidad] = useState("Crítico OIV");
  const [servicioEsencial, setServicioEsencial] = useState("");
  const [ubicacionIp, setUbicacionIp] = useState("");
  const [areaId, setAreaId] = useState(areas[0] ? String(areas[0].id) : "");
  const [cifradoActivo, setCifradoActivo] = useState(true);
  const [mfaActivo, setMfaActivo] = useState(true);
  const [respaldoInmutable, setRespaldoInmutable] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const filtered = assets.filter((a) => {
    if (filterTipo !== "Todos" && a.tipo !== filterTipo) return false;
    if (filterCrit !== "Todos" && a.criticidad !== filterCrit) return false;
    if (search) {
      const q = search.toLowerCase();
      const target = `${a.codigo_activo} ${a.nombre} ${a.servicio_esencial} ${a.ubicacion_o_ip}`.toLowerCase();
      if (!target.includes(q)) return false;
    }
    return true;
  });

  function getCritBadge(c) {
    switch (c) {
      case "Crítico OIV": return "bg-rose-100 text-rose-800 border-rose-300 font-black";
      case "Alto PSE": return "bg-amber-100 text-amber-800 border-amber-300 font-bold";
      case "Medio": return "bg-blue-50 text-blue-700 border-blue-200 font-semibold";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  }

  function openCreate() {
    setNombre("");
    setTipo(TIPOS_ACTIVOS[0]);
    setCriticidad("Crítico OIV");
    setServicioEsencial("");
    setUbicacionIp("");
    setAreaId(areas[0] ? String(areas[0].id) : "");
    setCifradoActivo(true);
    setMfaActivo(true);
    setRespaldoInmutable(true);
    setCreateModalOpen(true);
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        nombre,
        tipo,
        criticidad,
        servicio_esencial: servicioEsencial,
        ubicacion_o_ip: ubicacionIp,
        area_responsable_id: areaId ? parseInt(areaId) : null,
        cifrado_activo: cifradoActivo,
        mfa_activo: mfaActivo,
        respaldo_inmutable: respaldoInmutable,
        estado_cumplimiento: (cifradoActivo && mfaActivo && respaldoInmutable) ? "Conforme" : "En Adecuación"
      };

      await api("/cyber/assets", token, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setCreateModalOpen(false);
      if (onReload) onReload();
    } catch (err) {
      alert("Error al registrar activo: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("¿Deseas eliminar este activo del inventario RSIC?")) return;
    try {
      await api(`/cyber/assets/${id}`, token, { method: "DELETE" });
      if (onReload) onReload();
    } catch (err) {
      alert("Error al eliminar activo: " + err.message);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
            <Server size={26} />
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-indigo-600 tracking-wider">Inventario Regulado Ley 21.663</span>
            <h2 className="text-xl font-bold text-slate-800 mt-0.5">Redes y Sistemas Informáticos Críticos (RSIC / OIV)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Registro de infraestructura tecnológica esencial, servidores, bases de datos y verificación de controles técnicos mínimos (MFA, Cifrado, Backups).
            </p>
          </div>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm shrink-0"
        >
          <Plus size={16} />
          Registrar Activo RSIC
        </button>
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
            placeholder="Buscar por código, nombre, IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span>Tipo:</span>
            <select
              className="field text-xs h-8 min-h-0 py-0"
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
            >
              <option value="Todos">Todos los tipos</option>
              {TIPOS_ACTIVOS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span>Criticidad:</span>
            <select
              className="field text-xs h-8 min-h-0 py-0"
              value={filterCrit}
              onChange={(e) => setFilterCrit(e.target.value)}
            >
              <option value="Todos">Todas las criticidades</option>
              {CRITICIDADES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((asset) => (
            <div
              key={asset.id}
              className="rounded-xl border border-line bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    {asset.codigo_activo}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${getCritBadge(asset.criticidad)}`}>
                    {asset.criticidad}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-800">{asset.nombre}</h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{asset.tipo} · {asset.ubicacion_o_ip}</p>
                  {asset.servicio_esencial && (
                    <p className="text-xs text-indigo-600 font-semibold mt-1">
                      Servicio Esencial: {asset.servicio_esencial}
                    </p>
                  )}
                </div>

                {/* Technical Controls Badges */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-[11px]">
                  <span className="font-bold text-slate-600 text-[10px] uppercase block">Controles Técnicos Mínimos:</span>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1 font-semibold ${asset.cifrado_activo ? "text-emerald-700" : "text-slate-400"}`}>
                      <Lock size={12} /> Cifrado {asset.cifrado_activo ? "✓" : "✗"}
                    </span>
                    <span className={`inline-flex items-center gap-1 font-semibold ${asset.mfa_activo ? "text-emerald-700" : "text-slate-400"}`}>
                      <KeyRound size={12} /> MFA {asset.mfa_activo ? "✓" : "✗"}
                    </span>
                    <span className={`inline-flex items-center gap-1 font-semibold ${asset.respaldo_inmutable ? "text-emerald-700" : "text-slate-400"}`}>
                      <HardDrive size={12} /> Backup {asset.respaldo_inmutable ? "✓" : "✗"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${asset.estado_cumplimiento === "Conforme" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                  {asset.estado_cumplimiento}
                </span>

                <button
                  type="button"
                  onClick={() => handleDelete(asset.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded"
                  title="Eliminar activo"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-350 p-12 text-center text-slate-400 bg-white">
          <Server size={40} className="mx-auto mb-2 opacity-40" />
          <p className="font-semibold text-sm">No hay activos críticos registrados</p>
          <p className="text-xs mt-1">Registra servidores, bases de datos o portales esenciales para el catálogo RSIC.</p>
        </div>
      )}

      {/* --- CREATE ASSET MODAL --- */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Registrar Activo Crítico (RSIC)</h3>
            <p className="text-xs text-slate-400 mb-4">Conforme a la clasificación de OIV y Prestadores de Servicios Esenciales.</p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="as-nom">Nombre del Activo o Sistema</label>
                <input
                  id="as-nom"
                  className="field mt-1 text-sm"
                  required
                  placeholder="Ej. Servidor de Base de Datos Principal"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="as-tipo">Tipo de Activo</label>
                  <select
                    id="as-tipo"
                    className="field mt-1 text-xs"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                  >
                    {TIPOS_ACTIVOS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="field-label" htmlFor="as-crit">Nivel de Criticidad</label>
                  <select
                    id="as-crit"
                    className="field mt-1 text-xs"
                    value={criticidad}
                    onChange={(e) => setCriticidad(e.target.value)}
                  >
                    {CRITICIDADES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="as-serv">Servicio Esencial Asociado</label>
                  <input
                    id="as-serv"
                    className="field mt-1 text-xs"
                    placeholder="Ej. Portal de Trámites y Pagos"
                    value={servicioEsencial}
                    onChange={(e) => setServicioEsencial(e.target.value)}
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="as-ip">Ubicación / IP / Hostname</label>
                  <input
                    id="as-ip"
                    className="field mt-1 text-xs"
                    placeholder="Ej. 10.0.1.50 (VCN OCI)"
                    value={ubicacionIp}
                    onChange={(e) => setUbicacionIp(e.target.value)}
                  />
                </div>
              </div>

              {/* Technical controls toggles */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 text-xs">
                <span className="font-bold text-slate-700 block">Controles Técnicos Obligatorios:</span>
                
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    checked={cifradoActivo}
                    onChange={(e) => setCifradoActivo(e.target.checked)}
                  />
                  <span>Cifrado de datos en reposo y tránsito (TLS 1.3 / AES-256)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    checked={mfaActivo}
                    onChange={(e) => setMfaActivo(e.target.checked)}
                  />
                  <span>Autenticación Multifactor (MFA) obligatoria para administradores</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    checked={respaldoInmutable}
                    onChange={(e) => setRespaldoInmutable(e.target.checked)}
                  />
                  <span>Copias de respaldo diarias aisladas e inmutables (Anti-Ransomware)</span>
                </label>
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
                  {submitting ? "Registrando..." : "Guardar Activo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
