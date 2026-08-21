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
  ServerCrash,
  Flame,
  Fingerprint,
  FileCheck2,
  Lock,
  Cpu,
  Hash,
  ExternalLink,
  ShieldCheck
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
  const [forensicModalOpen, setForensicModalOpen] = useState(false);
  const [selectedInc, setSelectedInc] = useState(null);

  // Form states
  const [tipoAtaque, setTipoAtaque] = useState(TIPOS_ATAQUE[0]);
  const [severidad, setSeveridad] = useState("Alta");
  const [afectaServicio, setAfectaServicio] = useState(true);
  const [descripcion, setDescripcion] = useState("");
  const [sistemasComprometidos, setSistemasComprometidos] = useState("");
  const [medidasContencion, setMedidasContencion] = useState("");
  const [ipsAtacantes, setIpsAtacantes] = useState("");
  const [hashesMalware, setHashesMalware] = useState("");
  const [urlsC2, setUrlsC2] = useState("");
  const [tiempoDeteccion, setTiempoDeteccion] = useState(15);
  const [submitting, setSubmitting] = useState(false);

  // Edit / Forensic states
  const [editEstado, setEditEstado] = useState("Alerta Inicial (3h)");
  const [editMedidas, setEditMedidas] = useState("");
  const [editAlerta3h, setEditAlerta3h] = useState(false);
  const [editInforme72h, setEditInforme72h] = useState(false);
  
  // Forensic checklist
  const [volcadoRam, setVolcadoRam] = useState(false);
  const [congelamientoLogs, setCongelamientoLogs] = useState(false);
  const [aislamientoRed, setAislamientoRed] = useState(false);
  const [hashSha256, setHashSha256] = useState("");

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

  function openCreate(isPanic = false) {
    setTipoAtaque(isPanic ? "Ransomware / Secuestro de datos" : TIPOS_ATAQUE[0]);
    setSeveridad(isPanic ? "Crítica" : "Alta");
    setAfectaServicio(true);
    setDescripcion(isPanic ? "ALERTA URGENTE: Detección activa de vector de ataque crítico en infraestructura esencial. Activación de protocolo de contención inmediata." : "");
    setSistemasComprometidos("");
    setMedidasContencion("");
    setIpsAtacantes("");
    setHashesMalware("");
    setUrlsC2("");
    setTiempoDeteccion(10);
    setCreateModalOpen(true);
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const iocs = {
        ips_atacantes: ipsAtacantes ? ipsAtacantes.split(",").map(s => s.trim()) : [],
        hashes_malware: hashesMalware ? hashesMalware.split(",").map(s => s.trim()) : [],
        urls_c2: urlsC2 ? urlsC2.split(",").map(s => s.trim()) : []
      };

      const payload = {
        tipo_ataque: tipoAtaque,
        severidad,
        afecta_servicio_esencial: afectaServicio,
        descripcion,
        sistemas_comprometidos: sistemasComprometidos,
        medidas_contencion_aplicadas: medidasContencion,
        iocs_json: iocs,
        checklist_forense_json: {
          volcado_ram: false,
          congelamiento_logs: false,
          aislamiento_red: false,
          hash_sha256: ""
        },
        tiempo_deteccion_minutos: parseInt(tiempoDeteccion) || 15
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

  function openForensic(inc) {
    setSelectedInc(inc);
    const forense = inc.checklist_forense_json || {};
    setVolcadoRam(forense.volcado_ram || false);
    setCongelamientoLogs(forense.congelamiento_logs || false);
    setAislamientoRed(forense.aislamiento_red || false);
    setHashSha256(forense.hash_sha256 || "");
    setForensicModalOpen(true);
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

  async function handleForensicSubmit(e) {
    e.preventDefault();
    if (!selectedInc) return;
    setSubmitting(true);
    try {
      const forenseData = {
        volcado_ram: volcadoRam,
        congelamiento_logs: congelamientoLogs,
        aislamiento_red: aislamientoRed,
        hash_sha256: hashSha256 || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      };

      await api(`/cyber/incidents/${selectedInc.id}`, token, {
        method: "PUT",
        body: JSON.stringify({
          estado: selectedInc.estado === "Alerta Inicial (3h)" ? "En Análisis Forense" : selectedInc.estado,
          checklist_forense_json: forenseData
        })
      });

      setForensicModalOpen(false);
      if (onReload) onReload();
    } catch (err) {
      alert("Error al guardar protocolo forense: " + err.message);
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
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-rose-600 tracking-wider">Fase IV · Ley N° 21.663</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold border border-rose-200">
                Alerta Temprana 3h & Forense Digital
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mt-0.5">Centro de Mando & Gestión de Incidentes ANCI</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Protocolo legal de <strong>Alerta Temprana (3 horas)</strong>, Indicadores de Compromiso (IoCs) y <strong>Cadena de Custodia Forense</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Libro Oficial de Registro de Incidentes (Art. 10) */}
          <a
            href={`${API_URL.replace("/api", "")}/api/cyber/incidents-book?token=${token}`}
            download
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors shrink-0"
            title="Descargar Libro Oficial de Registro y Bitácora de Incidentes (Art. 10 Ley 21.663)"
          >
            <Download size={14} className="text-indigo-600" />
            Libro de Incidentes (MD)
          </a>

          {/* Botón de Pánico / Alerta Inmediata 3h */}
          <button
            onClick={() => openCreate(true)}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-black text-white hover:bg-rose-700 shadow-md animate-pulse shrink-0"
            title="Activar de inmediato el temporizador legal de 3 horas para la ANCI"
          >
            <Flame size={16} />
            BOTÓN DE PÁNICO (3H)
          </button>

          <button
            onClick={() => openCreate(false)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 shrink-0"
          >
            <Plus size={15} />
            Reportar Incidente
          </button>
        </div>
      </div>

      {/* Urgent 3h banner */}
      {urgentCount > 0 && (
        <div className="flex items-start gap-4 rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-900 shadow-sm animate-pulse">
          <AlertTriangle className="mt-0.5 text-rose-600 shrink-0" size={22} />
          <div>
            <h4 className="font-bold text-sm tracking-tight">ALERTA LEGAL: {urgentCount} INCIDENTE(S) PENDIENTE(S) DE ALERTA TEMPRANA ANCI (PLAZO 3 HORAS)</h4>
            <p className="mt-0.5 text-xs text-rose-800 font-medium leading-relaxed">
              El Art. 12 de la Ley N° 21.663 exige remitir la notificación preliminar antes de las 3 horas. Registra los IoCs, ejecuta la cadena forense y despacha el oficio.
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
            const iocs = inc.iocs_json || {};
            const forense = inc.checklist_forense_json || {};

            return (
              <div
                key={inc.id}
                className={`rounded-xl border bg-white p-5 shadow-sm space-y-4 transition-all hover:shadow-md ${!inc.alerta_3h_enviada_anci && !isMitigated ? "border-rose-300 bg-rose-50/5" : "border-slate-200"}`}
              >
                {/* Inc Header */}
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

                {/* Inc Details & IoCs Grid */}
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

                    {/* IoCs List */}
                    <div className="p-2.5 bg-indigo-50/50 border border-indigo-200 rounded-lg space-y-1 text-[11px]">
                      <span className="font-bold text-indigo-900 block flex items-center gap-1">
                        <Fingerprint size={12} /> Indicadores de Compromiso (IoCs):
                      </span>
                      <p className="text-slate-700 font-mono">
                        <strong>IPs Atacantes:</strong> {iocs.ips_atacantes?.length ? iocs.ips_atacantes.join(", ") : "En análisis"}
                      </p>
                      {iocs.hashes_malware?.length > 0 && (
                        <p className="text-slate-700 font-mono truncate">
                          <strong>Hashes:</strong> {iocs.hashes_malware.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="font-bold text-slate-700 block">Medidas de Contención Aplicadas:</span>
                      <p className="text-slate-600 mt-0.5 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-150">
                        {inc.medidas_contencion_aplicadas || "Aislamiento de interfaz de red y preservación forense de memoria/logs."}
                      </p>
                    </div>

                    {/* Forensic Status Box */}
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-[11px]">
                      <span className="font-bold text-slate-700 block">Cadena de Custodia Forense:</span>
                      <div className="flex flex-wrap gap-2 text-[10px]">
                        <span className={`px-2 py-0.5 rounded font-bold ${forense.volcado_ram ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                          RAM Dump {forense.volcado_ram ? "✓" : "✗"}
                        </span>
                        <span className={`px-2 py-0.5 rounded font-bold ${forense.congelamiento_logs ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                          Logs Frozen {forense.congelamiento_logs ? "✓" : "✗"}
                        </span>
                        <span className={`px-2 py-0.5 rounded font-bold ${forense.aislamiento_red ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                          Network Isolated {forense.aislamiento_red ? "✓" : "✗"}
                        </span>
                      </div>
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(inc)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 shadow-2xs"
                    >
                      <Edit3 size={13} />
                      Estado / Notificación
                    </button>

                    <button
                      onClick={() => openForensic(inc)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-indigo-300 bg-indigo-50 text-indigo-800 rounded-lg text-xs font-bold hover:bg-indigo-100 shadow-2xs"
                    >
                      <Fingerprint size={13} />
                      Protocolo Forense Digital
                    </button>
                  </div>

                  <a
                    href={`${API_URL.replace("/api", "")}/api/cyber/incidents/${inc.id}/oficio-anci?token=${token}`}
                    download
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-rose-300 bg-rose-50 text-rose-800 rounded-lg text-xs font-bold hover:bg-rose-100 shadow-2xs"
                    title="Descargar Formulario Oficial de Notificación a la ANCI"
                  >
                    <Download size={13} />
                    Oficio Oficial ANCI (MD)
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
          <p className="text-xs mt-1">Usa el botón de pánico o registra un incidente para gestionar el plazo de 3h y la cadena de custodia.</p>
        </div>
      )}

      {/* --- CREATE MODAL --- */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-xl rounded-xl border border-line bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Reporte de Incidente & Alerta Temprana ANCI</h3>
            <p className="text-xs text-rose-600 mb-4 font-semibold">Se activará el temporizador legal de 3 horas y el protocolo forense.</p>

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
                <label className="field-label" htmlFor="inc-desc">Descripción de los Hechos</label>
                <textarea
                  id="inc-desc"
                  className="field mt-1 text-xs h-20 py-2"
                  required
                  placeholder="Detalle cómo se detectó el ataque, anomalías observadas..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="inc-sist">Sistemas Afectados (RSIC)</label>
                  <input
                    id="inc-sist"
                    className="field mt-1 text-xs"
                    placeholder="Ej. RSIC-0001 (Servidor Central)"
                    value={sistemasComprometidos}
                    onChange={(e) => setSistemasComprometidos(e.target.value)}
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="inc-time">Tiempo de Detección (Minutos)</label>
                  <input
                    id="inc-time"
                    type="number"
                    className="field mt-1 text-xs"
                    value={tiempoDeteccion}
                    onChange={(e) => setTiempoDeteccion(e.target.value)}
                  />
                </div>
              </div>

              {/* IoCs Section */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-lg space-y-2.5 text-xs">
                <span className="font-bold text-indigo-950 block">Indicadores de Compromiso (IoCs) Iniciales:</span>
                
                <div>
                  <label className="field-label" htmlFor="ioc-ips">IPs Atacantes / Origen (Separadas por coma)</label>
                  <input
                    id="ioc-ips"
                    className="field mt-1 text-xs font-mono"
                    placeholder="Ej. 185.220.101.5, 45.154.255.8"
                    value={ipsAtacantes}
                    onChange={(e) => setIpsAtacantes(e.target.value)}
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="ioc-hashes">Hashes SHA-256 de Muestras de Malware</label>
                  <input
                    id="ioc-hashes"
                    className="field mt-1 text-xs font-mono"
                    placeholder="Ej. e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                    value={hashesMalware}
                    onChange={(e) => setHashesMalware(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="inc-med">Medidas Inmediatas de Contención</label>
                <textarea
                  id="inc-med"
                  className="field mt-1 text-xs h-16 py-2"
                  placeholder="Ej. Aislamiento de VLAN, bloqueo perimetral en firewall..."
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
                  {submitting ? "Reportando..." : "Despachar Alerta 3h"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- FORENSIC CHECKLIST MODAL --- */}
      {forensicModalOpen && selectedInc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2.5 text-indigo-700 mb-1">
              <Fingerprint size={22} />
              <h3 className="text-lg font-bold text-slate-800">Protocolo Forense Digital & Cadena de Custodia</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 font-mono">{selectedInc.codigo_incidente} · {selectedInc.tipo_ataque}</p>

            <form onSubmit={handleForensicSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 shrink-0"
                    checked={volcadoRam}
                    onChange={(e) => setVolcadoRam(e.target.checked)}
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">1. Volcado de Memoria RAM (RAM Dump)</span>
                    <span className="text-[11px] text-slate-500">Captura volátil de procesos y claves en memoria antes de apagar el servidor.</span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 shrink-0"
                    checked={congelamientoLogs}
                    onChange={(e) => setCongelamientoLogs(e.target.checked)}
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">2. Congelamiento de Logs del Sistema</span>
                    <span className="text-[11px] text-slate-500">Preservación inmutable de `/var/log`, `journald` y registros del firewall.</span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 shrink-0"
                    checked={aislamientoRed}
                    onChange={(e) => setAislamientoRed(e.target.checked)}
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">3. Aislamiento de Red Seguro</span>
                    <span className="text-[11px] text-slate-500">Desconexión física o lógica de la interfaz para evitar propagación lateral.</span>
                  </div>
                </label>
              </div>

              <div>
                <label className="field-label" htmlFor="for-hash">Hash SHA-256 de las Evidencias (Firma de Integridad)</label>
                <input
                  id="for-hash"
                  className="field mt-1 text-xs font-mono"
                  placeholder="Ej. a8b4c2... (Calculado sobre el tar.gz de evidencias)"
                  value={hashSha256}
                  onChange={(e) => setHashSha256(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setForensicModalOpen(false)}
                  className="rounded border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm"
                >
                  {submitting ? "Guardando..." : "Firmar Evidencia Forense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT STATUS MODAL --- */}
      {editModalOpen && selectedInc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Actualizar Estado de Incidente ANCI</h3>
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
