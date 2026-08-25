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
  Cpu,
  Layers,
  Network,
  Download,
  Terminal,
  Activity,
  ArrowRight,
  Database,
  Globe,
  Cloud,
  Laptop,
  Sparkles,
  Sliders,
  ShieldAlert
} from "lucide-react";
import { API_URL, api } from "../../lib/api";

const CAPAS_TECNOLOGICAS = [
  { id: "Todas", label: "Todas las Capas", icon: Layers },
  { id: "Perímetro / Red", label: "Perímetro / Red", icon: Network },
  { id: "Servidor Central", label: "Servidores", icon: Server },
  { id: "Base de Datos", label: "Bases de Datos", icon: Database },
  { id: "Aplicación Web / API", label: "Web / APIs", icon: Globe },
  { id: "Nube (OCI / AWS)", label: "Nube / Cloud", icon: Cloud },
  { id: "Endpoint Crítico", label: "Endpoints", icon: Laptop }
];

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
  const [viewMode, setViewMode] = useState("inventory"); // "inventory" | "topology"
  const [search, setSearch] = useState("");
  const [selectedCapa, setSelectedCapa] = useState("Todas");
  const [filterCrit, setFilterCrit] = useState("Todos");

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState(TIPOS_ACTIVOS[0]);
  const [capa, setCapa] = useState("Servidor Central");
  const [criticidad, setCriticidad] = useState("Crítico OIV");
  const [servicioEsencial, setServicioEsencial] = useState("");
  const [ubicacionIp, setUbicacionIp] = useState("");
  const [puertosExpuestos, setPuertosExpuestos] = useState("443/tcp, 22/tcp");
  const [versionSo, setVersionSo] = useState("Ubuntu 24.04 LTS");
  const [impactoCaida, setImpactoCaida] = useState("Interrupción de trámite en línea y atención ciudadana");
  const [dependenciasIds, setDependenciasIds] = useState([]);
  const [areaId, setAreaId] = useState(areas[0] ? String(areas[0].id) : "");
  const [cifradoActivo, setCifradoActivo] = useState(true);
  const [mfaActivo, setMfaActivo] = useState(true);
  const [respaldoInmutable, setRespaldoInmutable] = useState(true);
  const [albergaDatosPersonales, setAlbergaDatosPersonales] = useState(false);
  const [tratamientosAsociados, setTratamientosAsociados] = useState("");
  const [sensibilidadDatos, setSensibilidadDatos] = useState("Sensibles / Médicos / PII");
  const [submitting, setSubmitting] = useState(false);

  // Scan & Audit State
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  // Custom Hardening Modal State
  const [customHardeningOpen, setCustomHardeningOpen] = useState(false);
  const [hSshKeyOnly, setHSshKeyOnly] = useState(true);
  const [hDisableRoot, setHDisableRoot] = useState(true);
  const [hFirewallStrict, setHFirewallStrict] = useState(true);
  const [hSysctlDdos, setHSysctlDdos] = useState(true);
  const [hFail2ban, setHFail2ban] = useState(true);
  const [hWormBackup, setHWormBackup] = useState(true);

  const filtered = assets.filter((a) => {
    if (selectedCapa !== "Todas" && a.capa_tecnologica !== selectedCapa && a.tipo !== selectedCapa) return false;
    if (filterCrit !== "Todos" && a.criticidad !== filterCrit) return false;
    if (search) {
      const q = search.toLowerCase();
      const target = `${a.codigo_activo} ${a.nombre} ${a.servicio_esencial} ${a.ubicacion_o_ip} ${a.puertos_expuestos} ${a.version_so} ${a.tratamientos_asociados || ""}`.toLowerCase();
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
    setCapa("Servidor Central");
    setCriticidad("Crítico OIV");
    setServicioEsencial("");
    setUbicacionIp("");
    setPuertosExpuestos("443/tcp, 22/tcp");
    setVersionSo("Ubuntu 24.04 LTS");
    setImpactoCaida("Interrupción de trámite en línea y atención ciudadana");
    setDependenciasIds([]);
    setAreaId(areas[0] ? String(areas[0].id) : "");
    setCifradoActivo(true);
    setMfaActivo(true);
    setRespaldoInmutable(true);
    setAlbergaDatosPersonales(false);
    setTratamientosAsociados("");
    setSensibilidadDatos("Sensibles / Médicos / PII");
    setCreateModalOpen(true);
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        nombre,
        tipo,
        capa_tecnologica: capa,
        criticidad,
        servicio_esencial: servicioEsencial,
        ubicacion_o_ip: ubicacionIp,
        puertos_expuestos: puertosExpuestos,
        version_so: versionSo,
        impacto_caida_servicio: impactoCaida,
        dependencias_ids: dependenciasIds,
        area_responsable_id: areaId ? parseInt(areaId) : null,
        cifrado_activo: cifradoActivo,
        mfa_activo: mfaActivo,
        respaldo_inmutable: respaldoInmutable,
        alberga_datos_personales: albergaDatosPersonales,
        tratamientos_asociados: tratamientosAsociados,
        sensibilidad_datos: sensibilidadDatos,
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

  async function handleRunScan(asset) {
    setScanning(true);
    setScanResult(null);
    setScanModalOpen(true);
    try {
      const res = await api(`/cyber/assets/${asset.id}/scan`, token, {
        method: "POST"
      });
      setScanResult(res);
    } catch (err) {
      alert("Error durante la auditoría: " + err.message);
      setScanModalOpen(false);
    } finally {
      setScanning(false);
    }
  }

  async function handleDownloadCustomScript() {
    try {
      const payload = {
        ssh_key_only: hSshKeyOnly,
        disable_root: hDisableRoot,
        firewall_strict: hFirewallStrict,
        sysctl_ddos: hSysctlDdos,
        fail2ban: hFail2ban,
        worm_backup: hWormBackup
      };

      const res = await fetch(`${API_URL}/cyber/hardening/custom-script`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Error al generar script");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "lexapp_custom_hardening.sh";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setCustomHardeningOpen(false);
    } catch (err) {
      alert("Error: " + err.message);
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
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-indigo-600 tracking-wider">Fase II · Ley 21.663</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                Inventario Multicapa & BIA
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mt-0.5">Redes y Sistemas Informáticos Críticos (RSIC / OIV)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Catálogo de infraestructura tecnológica esencial, auditorías CIS Benchmark y generador de scripts de hardening.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setCustomHardeningOpen(true)}
            className="flex items-center gap-1.5 rounded border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-900 hover:bg-indigo-100 shadow-2xs transition-colors"
            title="Personalizar y generar scripts Bash de hardening según CIS Benchmarks"
          >
            <Terminal size={14} className="text-indigo-600" />
            Hardening Personalizado (.sh)
          </button>

          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm"
          >
            <Plus size={15} />
            Registrar Activo RSIC
          </button>
        </div>
      </div>

      {/* View Switcher & Capas Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          
          {/* Multilayer Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {CAPAS_TECNOLOGICAS.map((c) => {
              const Icon = c.icon;
              const isSelected = selectedCapa === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCapa(c.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${isSelected ? "bg-indigo-600 text-white shadow-2xs" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  <Icon size={13} />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          {/* View Toggle (Cards vs Dependency Topology) */}
          <div className="flex bg-slate-200/70 p-0.5 rounded-lg border border-slate-300 text-xs shrink-0">
            <button
              onClick={() => setViewMode("inventory")}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === "inventory" ? "bg-white text-slate-800 shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              Inventario RSIC ({filtered.length})
            </button>
            <button
              onClick={() => setViewMode("topology")}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === "topology" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              Mapeo de Dependencias (BIA)
            </button>
          </div>

        </div>

        {/* Search & Criticality Filter */}
        <div className="rounded-xl border border-line bg-white p-3.5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              className="field pl-9 text-xs h-8 min-h-0 py-0"
              placeholder="Buscar por código, IP, servicio esencial, puertos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 w-full md:w-auto">
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

      {/* VIEW MODE 1: INVENTORY CARDS */}
      {viewMode === "inventory" ? (
        filtered.length > 0 ? (
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
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      <span className="text-indigo-600 font-semibold">{asset.capa_tecnologica || asset.tipo}</span> · {asset.ubicacion_o_ip}
                    </p>
                    {asset.servicio_esencial && (
                      <p className="text-xs text-slate-700 font-semibold mt-1 bg-slate-50 p-1.5 rounded border border-slate-150">
                        Servicio Esencial: <span className="text-indigo-600">{asset.servicio_esencial}</span>
                      </p>
                    )}
                  </div>

                  {/* Technical Specs: Ports & OS */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Puertos Expuestos</span>
                      <span className="font-mono font-semibold text-slate-700">{asset.puertos_expuestos || "443/tcp, 22/tcp"}</span>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Sistema / Versión</span>
                      <span className="font-semibold text-slate-700 truncate block">{asset.version_so || "Linux"}</span>
                    </div>
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

                  {/* Cross-Compliance GRC: Custodia de Datos Personales (Ley 21.719 / RAT) */}
                  {asset.alberga_datos_personales ? (
                    <div className="p-2.5 bg-teal-50/80 border border-teal-200 rounded-lg space-y-1 text-[11px] text-teal-900 font-medium">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold">
                          <ShieldCheck size={14} className="text-teal-700 shrink-0" />
                          <span>Custodia Datos Personales (RAT)</span>
                        </div>
                        <span className="font-bold text-[9px] bg-white border border-teal-300 text-teal-900 px-1.5 py-0.5 rounded">
                          {asset.sensibilidad_datos || "Datos Sensibles"}
                        </span>
                      </div>
                      <p className="text-[10px] text-teal-800 font-mono truncate" title={asset.tratamientos_asociados}>
                        Tratamientos: {asset.tratamientos_asociados || "RAT-01 (Registro de Usuarios)"}
                      </p>
                    </div>
                  ) : (asset.tipo.includes("Base de Datos") || asset.tipo.includes("Servidor") || asset.tipo.includes("Portal") || asset.tipo.includes("Nube")) ? (
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-[10px] text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck size={13} className="text-slate-400 shrink-0" />
                        <span>Sin Tratamientos RAT asociados</span>
                      </div>
                      <span className="font-mono text-[9px] text-slate-400">
                        {asset.cifrado_activo ? "AES-256 Activo" : "Sin Cifrado"}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleRunScan(asset)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-bold hover:bg-indigo-100 shadow-2xs"
                    title="Auditar controles CIS Benchmark en este activo"
                  >
                    <Activity size={12} className="text-indigo-600" />
                    Auditoría CIS
                  </button>

                  <div className="flex items-center gap-2">
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
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-350 p-12 text-center text-slate-400 bg-white">
            <Server size={40} className="mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-sm">No hay activos críticos registrados en esta capa</p>
            <p className="text-xs mt-1">Registra servidores, bases de datos o portales esenciales para el catálogo RSIC.</p>
          </div>
        )
      ) : (
        /* VIEW MODE 2: DEPENDENCY & BIA TOPOLOGY MAP */
        <div className="rounded-xl border border-line bg-white p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800">Mapeo de Interconexiones y Análisis de Impacto en el Negocio (BIA)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluación de dependencias tecnológicas: Si un nodo de infraestructura crítica falla, qué servicios esenciales se interrumpen.
            </p>
          </div>

          <div className="space-y-4">
            {assets.map((a) => (
              <div key={a.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                      {a.codigo_activo}
                    </span>
                    <h4 className="font-bold text-xs text-slate-800">{a.nombre}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">({a.capa_tecnologica || a.tipo})</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${getCritBadge(a.criticidad)}`}>
                    {a.criticidad}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase block">Servicio Esencial Dependiente:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{a.servicio_esencial || "Infraestructura interna / Sin servicio público directo"}</p>
                  </div>

                  <div className="p-2.5 bg-white border border-rose-200 rounded-lg">
                    <span className="text-[10px] font-bold text-rose-700 uppercase block">Impacto ante Caída / Ciberataque:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{a.impacto_caida_servicio || "Interrupción de operaciones y riesgo de continuidad"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- CIS SCAN RESULTS MODAL --- */}
      {scanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-xl rounded-xl border border-line bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={22} className="text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-800">Resultado de Auditoría CIS Benchmark</h3>
              </div>
              {scanResult && (
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                  Score: {scanResult.cis_score} / 100
                </span>
              )}
            </div>

            {scanning ? (
              <div className="py-12 text-center text-slate-500 space-y-3">
                <Activity size={36} className="mx-auto text-indigo-600 animate-spin" />
                <p className="font-bold text-sm">Escaneando puertos, cifrado TLS y controles de acceso...</p>
              </div>
            ) : scanResult ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800 block">[{scanResult.codigo}] {scanResult.nombre}</span>
                    <span className="text-slate-400 font-mono text-[11px]">IP: {scanResult.ip || "127.0.0.1"} · {scanResult.fecha_escaneo}</span>
                  </div>
                  <span className={`font-black text-xs px-2.5 py-1 rounded ${scanResult.cis_score >= 80 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                    {scanResult.estado_auditoria}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block">
                    Hallazgos de Seguridad Detectados ({scanResult.total_hallazgos})
                  </span>

                  {scanResult.hallazgos.length > 0 ? (
                    scanResult.hallazgos.map((h, idx) => (
                      <div key={idx} className="p-3 bg-rose-50/50 border border-rose-200 rounded-lg space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-[10px] text-rose-900 bg-rose-100 px-1.5 py-0.5 rounded">
                            {h.control}
                          </span>
                          <span className="text-[10px] font-bold text-rose-700 uppercase">Severidad {h.severidad}</span>
                        </div>
                        <p className="text-slate-800 font-medium">{h.descripcion}</p>
                        <p className="text-indigo-900 font-semibold pt-1 border-t border-rose-100 text-[11px]">
                          <strong>Remediación sugerida:</strong> {h.remediacion}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg font-bold">
                      [✓] El activo cumple con todos los controles técnicos mínimos auditados.
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setScanModalOpen(false)}
                    className="rounded bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                  >
                    Cerrar Auditoría
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* --- CUSTOM HARDENING GENERATOR MODAL --- */}
      {customHardeningOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 text-indigo-700 mb-1">
              <Terminal size={22} />
              <h3 className="text-lg font-bold text-slate-800">Generador de Script de Hardening a Medida</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Selecciona los controles técnicos de fortificación que deseas empaquetar en el script Bash (.sh).</p>

            <div className="space-y-3 text-xs">
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  checked={hSshKeyOnly}
                  onChange={(e) => setHSshKeyOnly(e.target.checked)}
                />
                <div>
                  <span className="font-bold text-slate-800 block">1. Deshabilitar Contraseñas SSH (Forzar Llaves Criptográficas)</span>
                  <span className="text-[11px] text-slate-500">Configura `PasswordAuthentication no` en sshd_config.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  checked={hDisableRoot}
                  onChange={(e) => setHDisableRoot(e.target.checked)}
                />
                <div>
                  <span className="font-bold text-slate-800 block">2. Restringir Acceso Root Directo</span>
                  <span className="text-[11px] text-slate-500">Configura `PermitRootLogin prohibit-password`.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  checked={hFirewallStrict}
                  onChange={(e) => setHFirewallStrict(e.target.checked)}
                />
                <div>
                  <span className="font-bold text-slate-800 block">3. Firewall UFW Restrictivo</span>
                  <span className="text-[11px] text-slate-500">Denegar todo el tráfico entrante excepto puertos 80, 443 y 22.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  checked={hSysctlDdos}
                  onChange={(e) => setHSysctlDdos(e.target.checked)}
                />
                <div>
                  <span className="font-bold text-slate-800 block">4. Hardening de Kernel Sysctl Anti-DDoS</span>
                  <span className="text-[11px] text-slate-500">Activa TCP SYN Cookies, rp_filter y desactiva redirects.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  checked={hFail2ban}
                  onChange={(e) => setHFail2ban(e.target.checked)}
                />
                <div>
                  <span className="font-bold text-slate-800 block">5. Instalación y Aseguramiento de Fail2ban</span>
                  <span className="text-[11px] text-slate-500">Bloqueo automático de IPs atacantes tras múltiples fallos de login.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  checked={hWormBackup}
                  onChange={(e) => setHWormBackup(e.target.checked)}
                />
                <div>
                  <span className="font-bold text-slate-800 block">6. Directorio Seguro para Backups Inmutables (WORM)</span>
                  <span className="text-[11px] text-slate-500">Crea `/opt/backups_inmutables` con permisos 700.</span>
                </div>
              </label>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCustomHardeningOpen(false)}
                  className="rounded border border-line bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCustomScript}
                  className="flex items-center gap-1.5 rounded bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm"
                >
                  <Download size={13} />
                  Descargar Script Personalizado (.sh)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CREATE ASSET MODAL --- */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-xl rounded-xl border border-line bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Registrar Activo Crítico RSIC (Multicapa)</h3>
            <p className="text-xs text-slate-400 mb-4">Conforme al Art. 4 y 5 de la Ley N° 21.663 para OIV y Prestadores de Servicios Esenciales.</p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="as-nom">Nombre del Activo o Sistema</label>
                <input
                  id="as-nom"
                  className="field mt-1 text-sm"
                  required
                  placeholder="Ej. Servidor Central de Postulaciones y Trámites"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="as-capa">Capa Tecnológica</label>
                  <select
                    id="as-capa"
                    className="field mt-1 text-xs"
                    value={capa}
                    onChange={(e) => setCapa(e.target.value)}
                  >
                    {CAPAS_TECNOLOGICAS.filter(c => c.id !== "Todas").map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
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
                  <label className="field-label" htmlFor="as-ip">Ubicación / IP / Subred</label>
                  <input
                    id="as-ip"
                    className="field mt-1 text-xs"
                    placeholder="Ej. 10.0.1.15 (OCI VCN)"
                    value={ubicacionIp}
                    onChange={(e) => setUbicacionIp(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="as-ports">Puertos Expuestos</label>
                  <input
                    id="as-ports"
                    className="field mt-1 text-xs font-mono"
                    placeholder="Ej. 443/tcp, 22/tcp, 5432/tcp"
                    value={puertosExpuestos}
                    onChange={(e) => setPuertosExpuestos(e.target.value)}
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="as-so">Sistema Operativo / Versión</label>
                  <input
                    id="as-so"
                    className="field mt-1 text-xs"
                    placeholder="Ej. Ubuntu 24.04 LTS / PostgreSQL 16"
                    value={versionSo}
                    onChange={(e) => setVersionSo(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="as-impact">Impacto Operacional ante Caída (BIA)</label>
                <input
                  id="as-impact"
                  className="field mt-1 text-xs"
                  placeholder="Ej. Paralización de trámites ciudadanos e imposibilidad de pagos en línea"
                  value={impactoCaida}
                  onChange={(e) => setImpactoCaida(e.target.value)}
                />
              </div>

              {/* Technical controls toggles */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 text-xs">
                <span className="font-bold text-slate-700 block">Controles Técnicos Mínimos Obligatorios:</span>
                
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

              {/* Cross-Compliance GRC: Custodia de Datos Personales (Ley 21.719 / RAT) */}
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-lg space-y-2.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-teal-900">
                  <input
                    type="checkbox"
                    className="rounded border-teal-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                    checked={albergaDatosPersonales}
                    onChange={(e) => setAlbergaDatosPersonales(e.target.checked)}
                  />
                  <span>¿Este activo o servidor alberga Bases de Datos con Información Personal (RAT)?</span>
                </label>

                {albergaDatosPersonales && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="field-label text-[11px]" htmlFor="as-sens">Nivel de Sensibilidad</label>
                      <select
                        id="as-sens"
                        className="field mt-1 text-xs"
                        value={sensibilidadDatos}
                        onChange={(e) => setSensibilidadDatos(e.target.value)}
                      >
                        <option value="Sensibles / Médicos / PII">Sensibles / Médicos / PII</option>
                        <option value="Personales Ordinarios">Personales Ordinarios</option>
                        <option value="Financieros / Transaccionales">Financieros / Transaccionales</option>
                      </select>
                    </div>

                    <div>
                      <label className="field-label text-[11px]" htmlFor="as-rat">Tratamientos Asociados (RAT)</label>
                      <input
                        id="as-rat"
                        className="field mt-1 text-xs"
                        placeholder="Ej. RAT-01 (Usuarios), RAT-03 (Fichas)"
                        value={tratamientosAsociados}
                        onChange={(e) => setTratamientosAsociados(e.target.value)}
                      />
                    </div>
                  </div>
                )}
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
                  {submitting ? "Registrando..." : "Guardar Activo Multicapa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
