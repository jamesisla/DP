import React, { useState } from "react";
import { 
  Globe, 
  UserCheck, 
  Radio, 
  ShieldCheck, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Fingerprint, 
  ExternalLink, 
  Send, 
  Sparkles, 
  Lock, 
  FileText,
  KeyRound,
  X
} from "lucide-react";
import { api, API_URL } from "../lib/api";

const TIPOS_DERECHOS = [
  "Acceso (Conocer mis datos)",
  "Rectificación (Actualizar o corregir)",
  "Cancelación (Eliminar mis datos)",
  "Oposición (Negar tratamiento)",
  "Portabilidad (Descargar en formato interoperable)",
  "Bloqueo (Suspensión temporal)"
];

export function CitizenPortalModal({ isOpen, onClose, token }) {
  const [activeTab, setActiveTab] = useState("arco"); // 'arco', 'cvd', 'transparency'
  
  // ARCO Submission State
  const [arcoName, setArcoName] = useState("Camila Andrea Rojas Morales");
  const [arcoRut, setArcoRut] = useState("16.892.415-K");
  const [arcoEmail, setArcoEmail] = useState("camila.rojas@gmail.com");
  const [arcoRight, setArcoRight] = useState("Acceso (Conocer mis datos)");
  const [arcoDetails, setArcoDetails] = useState("Solicito copia en formato abierto de mi historial de atenciones médicas y datos personales registrados en la institución.");
  const [arcoSubmitting, setArcoSubmitting] = useState(false);
  const [arcoSubmitResult, setArcoSubmitResult] = useState(null);

  // ARCO Tracking State
  const [arcoSearchFolio, setArcoSearchFolio] = useState("");
  const [arcoTrackingResult, setArcoTrackingResult] = useState(null);
  const [arcoTrackingLoading, setArcoTrackingLoading] = useState(false);
  const [arcoTrackingError, setArcoTrackingError] = useState("");

  // CVD Submission State
  const [cvdTitle, setCvdTitle] = useState("Inyección SQL / Fuga de Parámetros en API de Pagos");
  const [cvdAlias, setCvdAlias] = useState("SecResearcher_CL (Hacker Ético)");
  const [cvdEmail, setCvdEmail] = useState("researcher@cybersec.cl");
  const [cvdAsset, setCvdAsset] = useState("Portal de Pagos y Trámites Ciudadanos (RSIC-02)");
  const [cvdCvss, setCvdCvss] = useState(8.6);
  const [cvdDesc, setCvdDesc] = useState("Parámetro 'id_tramite' sin sanitizar permite enumerar registros personales de otros ciudadanos.");
  const [cvdPoa, setCvdPoa] = useState("Implementar Prepared Statements y limitar permisos de lectura en base de datos.");
  const [cvdSubmitting, setCvdSubmitting] = useState(false);
  const [cvdSubmitResult, setCvdSubmitResult] = useState(null);

  // CVD Tracking State
  const [cvdSearchFolio, setCvdSearchFolio] = useState("");
  const [cvdTrackingResult, setCvdTrackingResult] = useState(null);
  const [cvdTrackingLoading, setCvdTrackingLoading] = useState(false);
  const [cvdTrackingError, setCvdTrackingError] = useState("");

  if (!isOpen) return null;

  async function handleArcoSubmit(e) {
    e.preventDefault();
    setArcoSubmitting(true);
    setArcoSubmitResult(null);
    try {
      const cleanRight = arcoRight.split(" ")[0];
      const payload = {
        titular_nombre: arcoName,
        titular_rut: arcoRut,
        titular_email: arcoEmail,
        tipo_derecho: cleanRight,
        tratamiento_id: 1,
        detalle_solicitud: arcoDetails
      };

      const res = await api("/gateways/simulate-citizen-arco", token, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setArcoSubmitResult(res);
      setArcoSearchFolio(res.folio);
    } catch (err) {
      alert("Error al radicar solicitud ARCO+: " + err.message);
    } finally {
      setArcoSubmitting(false);
    }
  }

  async function handleArcoTrack(e) {
    e.preventDefault();
    if (!arcoSearchFolio.trim()) return;
    setArcoTrackingLoading(true);
    setArcoTrackingError("");
    setArcoTrackingResult(null);
    try {
      const res = await api(`/gateways/track-arco-citizen?folio=${encodeURIComponent(arcoSearchFolio.trim())}`, token);
      setArcoTrackingResult(res);
    } catch (err) {
      setArcoTrackingError(err.message || "No se encontró la solicitud");
    } finally {
      setArcoTrackingLoading(false);
    }
  }

  async function handleCvdSubmit(e) {
    e.preventDefault();
    setCvdSubmitting(true);
    setCvdSubmitResult(null);
    try {
      const payload = {
        titulo: cvdTitle,
        investigador_alias: cvdAlias,
        investigador_email: cvdEmail,
        activo_afectado: cvdAsset,
        severidad: cvdCvss >= 9.0 ? "Crítica" : cvdCvss >= 7.0 ? "Alta" : cvdCvss >= 4.0 ? "Media" : "Baja",
        cvss_score: parseFloat(cvdCvss),
        descripcion_tecnica: cvdDesc,
        poa_remediacion: cvdPoa
      };

      const res = await api("/gateways/simulate-cvd-report", token, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setCvdSubmitResult(res);
      setCvdSearchFolio(res.folio);
    } catch (err) {
      alert("Error al remitir reporte CVD: " + err.message);
    } finally {
      setCvdSubmitting(false);
    }
  }

  async function handleCvdTrack(e) {
    e.preventDefault();
    if (!cvdSearchFolio.trim()) return;
    setCvdTrackingLoading(true);
    setCvdTrackingError("");
    setCvdTrackingResult(null);
    try {
      const res = await api(`/gateways/track-cvd-report?folio=${encodeURIComponent(cvdSearchFolio.trim())}`, token);
      setCvdTrackingResult(res);
    } catch (err) {
      setCvdTrackingError(err.message || "No se encontró el reporte CVD");
    } finally {
      setCvdTrackingLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-indigo-950 text-white p-6 flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Portal de Transparencia & Confianza Digital
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Ley 21.719 & Ley 21.663
              </span>
            </div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <Globe size={22} className="text-teal-400" />
              Ventanilla Única Ciudadana & Canal CVD Ético
            </h2>
            <p className="text-xs text-slate-300">
              Canal público e interoperable para ejercicio de derechos de privacidad y reporte responsable de vulnerabilidades.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-100 border-b border-slate-200 px-6 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab("arco")}
            className={`py-2.5 px-4 border-b-2 transition-all flex items-center gap-2 ${activeTab === "arco" ? "border-teal-600 text-teal-900 bg-white rounded-t-lg shadow-2xs" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            <UserCheck size={15} />
            <span>Derechos ARCO+ (15 Días)</span>
          </button>
          
          <button
            onClick={() => setActiveTab("cvd")}
            className={`py-2.5 px-4 border-b-2 transition-all flex items-center gap-2 ${activeTab === "cvd" ? "border-indigo-600 text-indigo-900 bg-white rounded-t-lg shadow-2xs" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            <Radio size={15} />
            <span>Canal CVD Ético (Art. 12 ANCI)</span>
          </button>

          <button
            onClick={() => setActiveTab("transparency")}
            className={`py-2.5 px-4 border-b-2 transition-all flex items-center gap-2 ${activeTab === "transparency" ? "border-slate-800 text-slate-900 bg-white rounded-t-lg shadow-2xs" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            <ShieldCheck size={15} />
            <span>Gobernanza & Política RAT</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">

          {activeTab === "arco" ? (
            /* TAB 1: ARCO+ CITIZEN PORTAL */
            <div className="space-y-6">
              
              {/* Tracker Box */}
              <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <Search size={18} className="text-teal-700" />
                  <h3 className="font-bold text-sm text-teal-950">Rastreador Oficial de Solicitudes Ciudadanas (ARCO+)</h3>
                </div>

                <form onSubmit={handleArcoTrack} className="flex gap-2">
                  <input
                    type="text"
                    className="field text-xs bg-white font-mono uppercase"
                    placeholder="Ingresa tu Folio (ej. ARCO-CU-202608-001)..."
                    value={arcoSearchFolio}
                    onChange={(e) => setArcoSearchFolio(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={arcoTrackingLoading}
                    className="btn bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-4 shrink-0"
                  >
                    {arcoTrackingLoading ? "Buscando..." : "Consultar Folio"}
                  </button>
                </form>

                {arcoTrackingError && (
                  <p className="text-xs text-rose-700 font-bold">{arcoTrackingError}</p>
                )}

                {arcoTrackingResult && (
                  <div className="p-4 rounded-xl border border-teal-300 bg-white space-y-3 animate-fadeIn text-xs">
                    <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Titular:</span>
                        <p className="font-bold text-slate-800">{arcoTrackingResult.titular_nombre} ({arcoTrackingResult.titular_rut})</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Estado:</span>
                        <span className="font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800 block mt-0.5">
                          {arcoTrackingResult.estado}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-2 bg-slate-50 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold block">Derecho Ejercido:</span>
                        <span className="font-semibold text-teal-800">{arcoTrackingResult.tipo_derecho}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold block">Fecha Ingreso:</span>
                        <span className="font-semibold text-slate-700">{arcoTrackingResult.fecha_ingreso}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold block">Plazo Legal (15d):</span>
                        <span className={`font-bold ${arcoTrackingResult.dias_habiles_restantes < 3 ? "text-rose-700" : "text-emerald-700"}`}>
                          {arcoTrackingResult.dias_habiles_restantes} días hábiles restantes
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Resolución / Fundamento Institucional:</span>
                      <p className="text-slate-700 font-medium leading-relaxed">{arcoTrackingResult.fundamento_respuesta}</p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1">
                      <span>Sello de Integridad: {arcoTrackingResult.hash_integridad.substring(0, 24)}...</span>
                      <span className="text-slate-500 font-sans font-semibold">{arcoTrackingResult.oficial_dpo}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Inbound Submission Sandbox */}
              <div className="rounded-xl border border-line bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">Formulario de Ejercicio de Derechos Ciudadanos (ARCO+)</h3>
                    <p className="text-xs text-slate-400">Autenticación digital con ClaveÚnica del Estado (Art. 8 al 12 Ley N° 21.719).</p>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full">
                    <KeyRound size={12} />
                    ClaveÚnica Simulada
                  </span>
                </div>

                <form onSubmit={handleArcoSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="field-label text-[11px]" htmlFor="arc-nom">Nombre Completo</label>
                      <input
                        id="arc-nom"
                        className="field mt-1 text-xs"
                        required
                        value={arcoName}
                        onChange={(e) => setArcoName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="field-label text-[11px]" htmlFor="arc-rut">RUT Ciudadano</label>
                      <input
                        id="arc-rut"
                        className="field mt-1 text-xs font-mono"
                        required
                        value={arcoRut}
                        onChange={(e) => setArcoRut(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="field-label text-[11px]" htmlFor="arc-mail">Correo Electrónico</label>
                      <input
                        id="arc-mail"
                        type="email"
                        className="field mt-1 text-xs"
                        required
                        value={arcoEmail}
                        onChange={(e) => setArcoEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="field-label text-[11px]" htmlFor="arc-right">Derecho a Ejercer</label>
                    <select
                      id="arc-right"
                      className="field mt-1 text-xs font-semibold"
                      value={arcoRight}
                      onChange={(e) => setArcoRight(e.target.value)}
                    >
                      {TIPOS_DERECHOS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="field-label text-[11px]" htmlFor="arc-det">Detalle y Fundamentos de la Solicitud</label>
                    <textarea
                      id="arc-det"
                      className="field mt-1 text-xs h-20 py-2"
                      required
                      value={arcoDetails}
                      onChange={(e) => setArcoDetails(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <p className="text-[11px] text-slate-500 font-medium">
                      ⏱️ Plazo legal improrrogable: <strong className="text-teal-800">15 días hábiles</strong>.
                    </p>
                    <button
                      type="submit"
                      disabled={arcoSubmitting}
                      className="btn bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-5"
                    >
                      {arcoSubmitting ? "Radicando..." : "Radicar con ClaveÚnica"}
                    </button>
                  </div>
                </form>

                {arcoSubmitResult && (
                  <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-950 space-y-2 text-xs animate-fadeIn">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <CheckCircle size={18} className="text-emerald-600" />
                      <span>{arcoSubmitResult.message}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px] pt-1">
                      <span><strong>Folio Asignado:</strong> {arcoSubmitResult.folio}</span>
                      <span><strong>Plazo Límite:</strong> {arcoSubmitResult.fecha_limite_legal}</span>
                    </div>
                    <p className="text-[10px] text-emerald-800 font-mono">
                      Hash SHA-256: {arcoSubmitResult.hash_sha256}
                    </p>
                  </div>
                )}
              </div>

            </div>
          ) : activeTab === "cvd" ? (
            /* TAB 2: CVD ETHICAL CHANNEL */
            <div className="space-y-6">
              
              {/* Tracker Box CVD */}
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <Search size={18} className="text-indigo-700" />
                  <h3 className="font-bold text-sm text-indigo-950">Rastreador de Vulnerabilidades Éticas (CVD ANCI)</h3>
                </div>

                <form onSubmit={handleCvdTrack} className="flex gap-2">
                  <input
                    type="text"
                    className="field text-xs bg-white font-mono uppercase"
                    placeholder="Ingresa tu Folio CVD (ej. CVD-ANCI-202608-001)..."
                    value={cvdSearchFolio}
                    onChange={(e) => setCvdSearchFolio(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={cvdTrackingLoading}
                    className="btn bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold px-4 shrink-0"
                  >
                    {cvdTrackingLoading ? "Buscando..." : "Consultar CVD"}
                  </button>
                </form>

                {cvdTrackingError && (
                  <p className="text-xs text-rose-700 font-bold">{cvdTrackingError}</p>
                )}

                {cvdTrackingResult && (
                  <div className="p-4 rounded-xl border border-indigo-300 bg-white space-y-3 animate-fadeIn text-xs">
                    <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Vulnerabilidad:</span>
                        <p className="font-bold text-slate-800">{cvdTrackingResult.titulo}</p>
                      </div>
                      <span className="font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                        {cvdTrackingResult.estado}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-2 bg-slate-50 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold block">Investigador / Alias:</span>
                        <span className="font-semibold text-slate-800">{cvdTrackingResult.investigador_alias}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold block">Activo Evaluado:</span>
                        <span className="font-semibold text-slate-800 truncate block">{cvdTrackingResult.activo_afectado}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold block">Puntaje CVSS / Severidad:</span>
                        <span className="font-bold text-rose-700">{cvdTrackingResult.cvss_score} ({cvdTrackingResult.severidad})</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Plan de Acción / Remediación Aplicada:</span>
                      <p className="text-slate-700 font-medium leading-relaxed">{cvdTrackingResult.poa_remediacion}</p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1">
                      <span>Hash de Prueba: {cvdTrackingResult.hash_evidencia.substring(0, 24)}...</span>
                      <span>Fecha: {cvdTrackingResult.fecha_reporte}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* CVD Inbound Submission Form */}
              <div className="rounded-xl border border-line bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">Canal de Divulgación Coordinada de Vulnerabilidades (CVD)</h3>
                    <p className="text-xs text-slate-400">Conforme al Art. 12 de la Ley N° 21.663 para reporte ético y responsable.</p>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                    <Radio size={12} />
                    CSIRT / Safe Harbor
                  </span>
                </div>

                <form onSubmit={handleCvdSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="field-label text-[11px]" htmlFor="cvd-tit">Título de la Vulnerabilidad</label>
                      <input
                        id="cvd-tit"
                        className="field mt-1 text-xs font-semibold"
                        required
                        value={cvdTitle}
                        onChange={(e) => setCvdTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="field-label text-[11px]" htmlFor="cvd-act">Activo Afectado (RSIC / Endpoint)</label>
                      <input
                        id="cvd-act"
                        className="field mt-1 text-xs"
                        required
                        value={cvdAsset}
                        onChange={(e) => setCvdAsset(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="field-label text-[11px]" htmlFor="cvd-ali">Investigador (Alias)</label>
                      <input
                        id="cvd-ali"
                        className="field mt-1 text-xs font-mono"
                        required
                        value={cvdAlias}
                        onChange={(e) => setCvdAlias(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="field-label text-[11px]" htmlFor="cvd-mai">Correo Electrónico</label>
                      <input
                        id="cvd-mai"
                        type="email"
                        className="field mt-1 text-xs"
                        required
                        value={cvdEmail}
                        onChange={(e) => setCvdEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="field-label text-[11px]" htmlFor="cvd-cvss">CVSS Score (0.0 a 10.0)</label>
                      <input
                        id="cvd-cvss"
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        className="field mt-1 text-xs font-bold text-rose-700"
                        value={cvdCvss}
                        onChange={(e) => setCvdCvss(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="field-label text-[11px]" htmlFor="cvd-desc">Descripción Técnica & Vector de Reproducción</label>
                    <textarea
                      id="cvd-desc"
                      className="field mt-1 text-xs h-20 py-2 font-mono"
                      required
                      value={cvdDesc}
                      onChange={(e) => setCvdDesc(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="field-label text-[11px]" htmlFor="cvd-poa">Sugerencia de Mitigación / Remedio</label>
                    <input
                      id="cvd-poa"
                      className="field mt-1 text-xs"
                      value={cvdPoa}
                      onChange={(e) => setCvdPoa(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[11px] text-slate-500 font-medium">
                      🛡️ El reporte se cifra y sella con hash SHA-256 para asignación en el Hall of Fame institucional.
                    </span>
                    <button
                      type="submit"
                      disabled={cvdSubmitting}
                      className="btn bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold px-5"
                    >
                      {cvdSubmitting ? "Remitiendo..." : "Remitir Reporte Ético"}
                    </button>
                  </div>
                </form>

                {cvdSubmitResult && (
                  <div className="p-4 rounded-xl border border-indigo-300 bg-indigo-50 text-indigo-950 space-y-2 text-xs animate-fadeIn">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <CheckCircle size={18} className="text-indigo-600" />
                      <span>Reporte CVD recibido satisfactoriamente por el equipo CISO.</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px] pt-1">
                      <span><strong>Folio CVD:</strong> {cvdSubmitResult.folio}</span>
                      <span><strong>Severidad:</strong> {cvdSubmitResult.severidad} (CVSS {cvdSubmitResult.cvss_score})</span>
                    </div>
                    <p className="text-[10px] text-indigo-800 font-mono">
                      Hash SHA-256: {cvdSubmitResult.hash_evidencia}
                    </p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* TAB 3: TRANSPARENCY & RAT POLICY */
            <div className="space-y-6 text-xs">
              <div className="rounded-xl border border-line bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Transparencia Activa & Declaración de Privacidad (Art. 14 Ley 21.719)</h3>
                    <p className="text-xs text-slate-400">Información pública sobre las finalidades del tratamiento de datos y derechos ciudadanos.</p>
                  </div>
                </div>

                <div className="space-y-3 text-slate-700 leading-relaxed">
                  <p>
                    El presente Servicio Público trata datos personales en estricto apego a las bases de licitud establecidas en la <strong>Ley N° 21.719</strong> y garantiza el ejercicio gratuito y expedito de los derechos de Acceso, Rectificación, Cancelación, Oposición, Portabilidad y Bloqueo.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <span className="font-bold text-slate-900 block">Oficial DPO Responsable:</span>
                      <p className="text-slate-600">Delegado de Protección de Datos Institucional</p>
                      <p className="text-teal-700 font-mono text-[11px]">dpo@institucion.gob.cl</p>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <span className="font-bold text-slate-900 block">Canal de Contacto CISO / CSIRT:</span>
                      <p className="text-slate-600">Oficial de Seguridad de la Información (CISO)</p>
                      <p className="text-indigo-700 font-mono text-[11px]">soc-ciso@institucion.gob.cl</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">Documento oficial regulado conforme a la Ley N° 21.719.</span>
                  <a
                    href={`${API_URL.replace("/api", "")}/api/documents/privacy-policy-download?token=${token}`}
                    download
                    className="btn bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4"
                  >
                    Descargar Política de Privacidad (MD)
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>🛡️ Cifrado TLS 1.3 / SHA-256</span>
            <span>🇨🇱 Gobierno Digital & ClaveÚnica</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-50"
          >
            Cerrar Portal
          </button>
        </div>

      </div>
    </div>
  );
}
