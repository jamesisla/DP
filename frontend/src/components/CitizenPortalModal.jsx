import React, { useState, useEffect } from "react";
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
  X,
  User,
  Mail,
  RefreshCw,
  Download,
  Key,
  Shield,
  CheckCircle2,
  FileCode
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

export function CitizenPortalModal({ isOpen, onClose, token, onReloadInternal }) {
  const [activeTab, setActiveTab] = useState("my_submissions"); // 'my_submissions', 'arco', 'cvd', 'track', 'transparency'
  
  // Auth Mode State: 'clave_unica' | 'simple_login'
  const [authMode, setAuthMode] = useState("clave_unica");
  
  // Active External User Profile
  const [externalUser, setExternalUser] = useState({
    nombre: "Camila Andrea Rojas Morales",
    rut: "16.892.415-K",
    email: "camila.rojas@gmail.com",
    role: "Ciudadana / Titular de Datos",
    authType: "ClaveÚnica"
  });

  // Simple Login Form State
  const [simpleIdentifier, setSimpleIdentifier] = useState("camila.rojas@gmail.com");
  const [simplePassword, setSimplePassword] = useState("demo123");
  const [simpleLoginLoading, setSimpleLoginLoading] = useState(false);
  const [simpleLoginSuccess, setSimpleLoginSuccess] = useState(true);

  // My Submissions (ARCO & CVD)
  const [mySubmissions, setMySubmissions] = useState({ arco_requests: [], cvd_reports: [] });
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // ARCO Submission State
  const [arcoName, setArcoName] = useState("Camila Andrea Rojas Morales");
  const [arcoRut, setArcoRut] = useState("16.892.415-K");
  const [arcoEmail, setArcoEmail] = useState("camila.rojas@gmail.com");
  const [arcoRight, setArcoRight] = useState("Acceso (Conocer mis datos)");
  const [arcoDetails, setArcoDetails] = useState("Solicito copia en formato abierto e interoperable de mi historial de trámites y datos personales registrados.");
  const [arcoSubmitting, setArcoSubmitting] = useState(false);
  const [arcoSubmitResult, setArcoSubmitResult] = useState(null);

  // CVD Submission State
  const [cvdTitle, setCvdTitle] = useState("Exposición de Endpoints de Autenticación sin Rate-Limiting");
  const [cvdAlias, setCvdAlias] = useState("SecResearcher_CL (Hacker Ético)");
  const [cvdEmail, setCvdEmail] = useState("researcher@cybersec.cl");
  const [cvdAsset, setCvdAsset] = useState("Portal de Pagos y Trámites Ciudadanos (RSIC-02)");
  const [cvdCvss, setCvdCvss] = useState(8.2);
  const [cvdDesc, setCvdDesc] = useState("El endpoint /api/auth no cuenta con limitador de intentos por IP, permitiendo ataques de fuerza bruta automatizados.");
  const [cvdPoa, setCvdPoa] = useState("Implementar rate limiting con Redis y bloquear temporalmente IPs con más de 5 fallos consecutivos.");
  const [cvdSubmitting, setCvdSubmitting] = useState(false);
  const [cvdSubmitResult, setCvdSubmitResult] = useState(null);

  // Folio Tracking State
  const [searchFolio, setSearchFolio] = useState("");
  const [trackingResult, setTrackingResult] = useState(null);
  const [trackingType, setTrackingType] = useState(""); // 'arco' or 'cvd'
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadMySubmissions(externalUser.email);
    }
  }, [isOpen, externalUser.email]);

  async function loadMySubmissions(emailOrRut) {
    setLoadingSubmissions(true);
    try {
      const data = await api(`/gateways/citizen-my-submissions?email_or_rut=${encodeURIComponent(emailOrRut || externalUser.email)}`, token);
      setMySubmissions(data);
    } catch (err) {
      console.error("Error cargando solicitudes ciudadanas:", err);
    } finally {
      setLoadingSubmissions(false);
    }
  }

  async function handleSimpleLogin(e) {
    e.preventDefault();
    setSimpleLoginLoading(true);
    try {
      const res = await api("/gateways/citizen-auth", token, {
        method: "POST",
        body: JSON.stringify({
          email_or_rut: simpleIdentifier,
          password: simplePassword
        })
      });

      const isResearcher = simpleIdentifier.toLowerCase().includes("researcher") || simpleIdentifier.toLowerCase().includes("cyber");
      const updatedUser = {
        nombre: res.nombre || (isResearcher ? "Investigador/a de Seguridad Ética" : "Usuario Ciudadano/a"),
        rut: simpleIdentifier.includes("-") ? simpleIdentifier : "18.442.109-3",
        email: simpleIdentifier.includes("@") ? simpleIdentifier : `${simpleIdentifier}@correo.cl`,
        role: isResearcher ? "Investigador/a Ético (CVD)" : "Ciudadano/a / Titular de Datos",
        authType: "Ingreso Simple"
      };

      setExternalUser(updatedUser);
      setArcoName(updatedUser.nombre);
      setArcoRut(updatedUser.rut);
      setArcoEmail(updatedUser.email);
      setCvdEmail(updatedUser.email);
      setCvdAlias(updatedUser.nombre);
      setSimpleLoginSuccess(true);
      loadMySubmissions(updatedUser.email);
      setActiveTab("my_submissions");
    } catch (err) {
      alert("Error en autenticación simple: " + err.message);
    } finally {
      setSimpleLoginLoading(false);
    }
  }

  function handleSwitchToClaveUnica() {
    setAuthMode("clave_unica");
    const cuUser = {
      nombre: "Camila Andrea Rojas Morales",
      rut: "16.892.415-K",
      email: "camila.rojas@gmail.com",
      role: "Ciudadana / Titular de Datos",
      authType: "ClaveÚnica"
    };
    setExternalUser(cuUser);
    setArcoName(cuUser.nombre);
    setArcoRut(cuUser.rut);
    setArcoEmail(cuUser.email);
    loadMySubmissions(cuUser.email);
  }

  function handleSwitchToResearcher() {
    setAuthMode("simple_login");
    const resUser = {
      nombre: "SecResearcher_CL (Hacker Ético)",
      rut: "19.321.884-2",
      email: "researcher@cybersec.cl",
      role: "Investigador Ético (Canal CVD)",
      authType: "Ingreso Simple"
    };
    setExternalUser(resUser);
    setCvdAlias(resUser.nombre);
    setCvdEmail(resUser.email);
    setSimpleIdentifier(resUser.email);
    loadMySubmissions(resUser.email);
  }

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
      loadMySubmissions(arcoEmail);
      if (onReloadInternal) onReloadInternal();
    } catch (err) {
      alert("Error al radicar solicitud ARCO+: " + err.message);
    } finally {
      setArcoSubmitting(false);
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
      loadMySubmissions(cvdEmail);
      if (onReloadInternal) onReloadInternal();
    } catch (err) {
      alert("Error al remitir reporte CVD: " + err.message);
    } finally {
      setCvdSubmitting(false);
    }
  }

  async function handleTrackSearch(e) {
    e.preventDefault();
    if (!searchFolio.trim()) return;
    setTrackingLoading(true);
    setTrackingError("");
    setTrackingResult(null);
    try {
      const isArco = searchFolio.toUpperCase().includes("ARCO");
      const endpoint = isArco 
        ? `/gateways/track-arco-citizen?folio=${encodeURIComponent(searchFolio.trim())}`
        : `/gateways/track-cvd-report?folio=${encodeURIComponent(searchFolio.trim())}`;
      
      const res = await api(endpoint, token);
      setTrackingResult(res);
      setTrackingType(isArco ? "arco" : "cvd");
    } catch (err) {
      setTrackingError(err.message || "No se encontró ningún registro con ese Folio.");
    } finally {
      setTrackingLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-indigo-950 text-white p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Portal Ciudadano &amp; CVD Ético
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Ley 21.719 &amp; Ley 21.663
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Acceso Externo Bidireccional
              </span>
            </div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <Globe size={22} className="text-teal-400" />
              Ventanilla Única Ciudadana &amp; Reporte de Seguridad
            </h2>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Quick Demo Switchers */}
            <div className="hidden lg:flex items-center gap-1 bg-white/10 p-1 rounded-lg text-[11px] font-bold">
              <button
                type="button"
                onClick={handleSwitchToClaveUnica}
                className={`px-2.5 py-1 rounded transition-colors ${authMode === "clave_unica" ? "bg-white text-slate-900 shadow-xs" : "text-slate-300 hover:text-white"}`}
                title="Simular acceso como Ciudadana con ClaveÚnica"
              >
                🇨🇱 ClaveÚnica
              </button>
              <button
                type="button"
                onClick={handleSwitchToResearcher}
                className={`px-2.5 py-1 rounded transition-colors ${authMode === "simple_login" ? "bg-white text-slate-900 shadow-xs" : "text-slate-300 hover:text-white"}`}
                title="Simular acceso como Hacker Ético / Investigador"
              >
                ⚡ Hacker Ético
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* User Identity & Auth Status Bar */}
        <div className="bg-slate-900 px-6 py-2.5 text-xs text-slate-300 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <div className="flex items-center gap-2">
              <User size={14} className="text-teal-400" />
              <span className="font-bold text-white">{externalUser.nombre}</span>
              <span className="text-slate-400">({externalUser.rut})</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 border border-slate-700 text-teal-300">
                {externalUser.authType}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-400">{externalUser.email}</span>
            <button
              onClick={() => loadMySubmissions(externalUser.email)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refrescar mis solicitudes"
            >
              <RefreshCw size={12} className={loadingSubmissions ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-100 border-b border-slate-200 px-6 pt-2 gap-2 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab("my_submissions")}
            className={`py-2.5 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "my_submissions" 
                ? "border-teal-700 text-teal-950 bg-white rounded-t-lg shadow-2xs" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <UserCheck size={15} />
            <span>Mis Solicitudes &amp; Reportes ({mySubmissions.arco_requests.length + mySubmissions.cvd_reports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("arco")}
            className={`py-2.5 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "arco" 
                ? "border-teal-700 text-teal-950 bg-white rounded-t-lg shadow-2xs" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Send size={14} />
            <span>Nueva Solicitud ARCO+ (15d)</span>
          </button>
          
          <button
            onClick={() => setActiveTab("cvd")}
            className={`py-2.5 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "cvd" 
                ? "border-indigo-700 text-indigo-950 bg-white rounded-t-lg shadow-2xs" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Radio size={14} />
            <span>Nuevo Reporte CVD Ético (ANCI)</span>
          </button>

          <button
            onClick={() => setActiveTab("track")}
            className={`py-2.5 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "track" 
                ? "border-slate-800 text-slate-900 bg-white rounded-t-lg shadow-2xs" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Search size={14} />
            <span>Consulta por Folio</span>
          </button>

          <button
            onClick={() => setActiveTab("auth_settings")}
            className={`py-2.5 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "auth_settings" 
                ? "border-amber-600 text-amber-950 bg-white rounded-t-lg shadow-2xs" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Key size={14} />
            <span>Cambiar de Usuario / Login Simple</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">

          {/* ========================================================================= */}
          {/* 📋 TAB 1: MY SUBMISSIONS (DASHBOARD DEL USUARIO EXTERNO) */}
          {/* ========================================================================= */}
          {activeTab === "my_submissions" && (
            <div className="space-y-6">
              
              <div className="rounded-xl border border-teal-200 bg-teal-50/80 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-bold text-sm text-teal-950">Bandeja de Respuestas y Trazabilidad Ciudadana</h3>
                  <p className="text-xs text-teal-800 mt-0.5">
                    Aquí puedes ver las respuestas formales emitidas por el Delegado de Protección de Datos (DPO) y el equipo de Ciberseguridad (CISO).
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab("arco")}
                    className="px-3 py-1.5 rounded-lg bg-teal-800 text-white font-bold text-xs hover:bg-teal-900 shadow-2xs"
                  >
                    + Nueva ARCO+
                  </button>
                  <button
                    onClick={() => setActiveTab("cvd")}
                    className="px-3 py-1.5 rounded-lg bg-indigo-700 text-white font-bold text-xs hover:bg-indigo-800 shadow-2xs"
                  >
                    + Reporte CVD
                  </button>
                </div>
              </div>

              {/* ARCO Requests List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck size={16} className="text-teal-600" />
                    Tus Solicitudes ARCO+ Radicadas ({mySubmissions.arco_requests.length})
                  </span>
                  <span className="text-[11px] text-slate-500">Plazo Legal: 15 Días Hábiles</span>
                </div>

                {mySubmissions.arco_requests.length > 0 ? (
                  <div className="grid gap-3">
                    {mySubmissions.arco_requests.map((req) => (
                      <div key={req.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-teal-50 text-teal-900 border border-teal-200">
                              {req.folio}
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              Derecho de {req.tipo_derecho}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              · Ingresada el {req.fecha_ingreso}
                            </span>
                          </div>

                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            req.estado === "Respondida favorable" 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : req.estado === "Rechazada fundada"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}>
                            {req.estado}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                          <strong>Tu Solicitud:</strong> {req.descripcion_solicitud}
                        </div>

                        {/* DPO Formal Response */}
                        <div className={`p-3 rounded-lg border text-xs space-y-1 ${
                          req.estado.includes("Respondida") || req.estado.includes("Rechazada")
                            ? "bg-emerald-50/50 border-emerald-200 text-emerald-950"
                            : "bg-amber-50/50 border-amber-200 text-amber-950"
                        }`}>
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck size={14} className="text-teal-700" />
                              Dictamen del Delegado de Protección de Datos (DPO):
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">Sello SHA-256 Verificado</span>
                          </div>
                          <p className="text-xs leading-relaxed text-slate-700">{req.fundamento_respuesta}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 text-xs">
                    No tienes solicitudes ARCO+ registradas actualmente con este correo ({externalUser.email}).
                  </div>
                )}
              </div>

              {/* CVD Reports List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Radio size={16} className="text-indigo-600" />
                    Tus Reportes de Vulnerabilidad CVD ({mySubmissions.cvd_reports.length})
                  </span>
                  <span className="text-[11px] text-slate-500">Canal CVD Art. 12 ANCI</span>
                </div>

                {mySubmissions.cvd_reports.length > 0 ? (
                  <div className="grid gap-3">
                    {mySubmissions.cvd_reports.map((cvd) => (
                      <div key={cvd.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-900 border border-indigo-200">
                              {cvd.folio}
                            </span>
                            <span className="text-xs font-bold text-slate-800">{cvd.titulo}</span>
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              CVSS {cvd.cvss_score} · {cvd.severidad}
                            </span>
                          </div>

                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            cvd.estado === "Resuelto"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-indigo-50 text-indigo-700 border-indigo-200"
                          }`}>
                            {cvd.estado}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                          <strong>Activo Afectado:</strong> {cvd.activo_afectado}
                        </div>

                        {/* CISO Triage & Remediation Plan */}
                        <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/40 text-xs space-y-1 text-indigo-950">
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1.5">
                              <Shield size={14} className="text-indigo-700" />
                              Respuesta Técnica del Equipo CISO / SOC:
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">Divulgación Responsable</span>
                          </div>
                          <p className="text-xs leading-relaxed text-slate-700">{cvd.poa_remediacion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 text-xs">
                    No tienes reportes de seguridad CVD registrados con este correo.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 📝 TAB 2: NUEVA SOLICITUD ARCO+ */}
          {/* ========================================================================= */}
          {activeTab === "arco" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/70 text-xs text-teal-950 space-y-1">
                <span className="font-bold text-teal-900 flex items-center gap-1.5 text-sm">
                  <UserCheck size={16} />
                  Formulario de Ejercicio de Derechos ARCO+ (Ley N° 21.719)
                </span>
                <p>
                  El organismo tiene un plazo legal estricto de <strong>15 días hábiles</strong> para responder a tu requerimiento.
                </p>
              </div>

              {arcoSubmitResult ? (
                <div className="p-6 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-950 space-y-3 text-center">
                  <CheckCircle2 size={40} className="mx-auto text-emerald-600" />
                  <h3 className="font-bold text-base">¡Solicitud ARCO+ Radicada Exitosamente!</h3>
                  <p className="text-xs text-slate-600">
                    Tu requerimiento ha sido registrado en el sistema con el siguiente número de seguimiento:
                  </p>
                  <div className="inline-block font-mono text-lg font-black bg-white px-4 py-2 rounded-lg border border-emerald-300 shadow-xs text-emerald-900">
                    {arcoSubmitResult.folio}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Fecha Límite Legal de Respuesta: <strong>{arcoSubmitResult.fecha_limite_legal}</strong> (15 días hábiles).
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => { setArcoSubmitResult(null); setActiveTab("my_submissions"); }}
                      className="px-4 py-2 rounded-lg bg-teal-800 text-white font-bold text-xs hover:bg-teal-900 shadow-sm cursor-pointer"
                    >
                      Ver en Mis Solicitudes
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleArcoSubmit} className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="field-label text-xs">Nombre Completo del Titular</label>
                      <input
                        type="text"
                        className="field mt-1 text-xs"
                        value={arcoName}
                        onChange={(e) => setArcoName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="field-label text-xs">RUT del Titular</label>
                      <input
                        type="text"
                        className="field mt-1 text-xs"
                        value={arcoRut}
                        onChange={(e) => setArcoRut(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="field-label text-xs">Correo Electrónico de Notificación</label>
                      <input
                        type="email"
                        className="field mt-1 text-xs"
                        value={arcoEmail}
                        onChange={(e) => setArcoEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="field-label text-xs">Tipo de Derecho a Ejercer</label>
                    <select
                      className="field mt-1 text-xs font-bold text-teal-900"
                      value={arcoRight}
                      onChange={(e) => setArcoRight(e.target.value)}
                    >
                      {TIPOS_DERECHOS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="field-label text-xs">Detalle y Fundamentación de la Solicitud</label>
                    <textarea
                      className="field mt-1 text-xs h-24 py-2"
                      value={arcoDetails}
                      onChange={(e) => setArcoDetails(e.target.value)}
                      placeholder="Indica con precisión los datos que deseas conocer, rectificar o eliminar..."
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={arcoSubmitting}
                      className="px-5 py-2.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Send size={14} />
                      {arcoSubmitting ? "Radicando Solicitud..." : "Radicar Solicitud ARCO+ Formal"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ⚡ TAB 3: NUEVO REPORTE CVD ÉTICO */}
          {/* ========================================================================= */}
          {activeTab === "cvd" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/70 text-xs text-indigo-950 space-y-1">
                <span className="font-bold text-indigo-900 flex items-center gap-1.5 text-sm">
                  <Radio size={16} />
                  Canal de Divulgación Coordinada de Vulnerabilidades (Art. 12 Ley 21.663)
                </span>
                <p>
                  Canal seguro y confidencial para investigadores de ciberseguridad. Los reportes reciben acuse de recibo inmediato y protección de buena fe.
                </p>
              </div>

              {cvdSubmitResult ? (
                <div className="p-6 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-950 space-y-3 text-center">
                  <CheckCircle2 size={40} className="mx-auto text-emerald-600" />
                  <h3 className="font-bold text-base">¡Reporte CVD Recibido por el Equipo CISO!</h3>
                  <p className="text-xs text-slate-600">
                    Tu hallazgo de seguridad ha sido registrado formalmente bajo el folio:
                  </p>
                  <div className="inline-block font-mono text-lg font-black bg-white px-4 py-2 rounded-lg border border-indigo-300 shadow-xs text-indigo-900">
                    {cvdSubmitResult.folio}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Severidad Asignada: <strong>{cvdSubmitResult.severidad} (CVSS {cvdSubmitResult.cvss_score})</strong>
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => { setCvdSubmitResult(null); setActiveTab("my_submissions"); }}
                      className="px-4 py-2 rounded-lg bg-indigo-700 text-white font-bold text-xs hover:bg-indigo-800 shadow-sm cursor-pointer"
                    >
                      Ver en Mis Reportes
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCvdSubmit} className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="field-label text-xs">Título de la Vulnerabilidad / Hallazgo</label>
                      <input
                        type="text"
                        className="field mt-1 text-xs"
                        value={cvdTitle}
                        onChange={(e) => setCvdTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="field-label text-xs">Activo o Endpoint RSIC Afectado</label>
                      <input
                        type="text"
                        className="field mt-1 text-xs"
                        value={cvdAsset}
                        onChange={(e) => setCvdAsset(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="field-label text-xs">Puntaje CVSS v3.1 (1.0 - 10.0)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1.0"
                        max="10.0"
                        className="field mt-1 text-xs font-bold font-mono text-rose-700"
                        value={cvdCvss}
                        onChange={(e) => setCvdCvss(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="field-label text-xs">Alias del Investigador / Hacker Ético</label>
                      <input
                        type="text"
                        className="field mt-1 text-xs"
                        value={cvdAlias}
                        onChange={(e) => setCvdAlias(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="field-label text-xs">Correo Electrónico de Contacto</label>
                      <input
                        type="email"
                        className="field mt-1 text-xs"
                        value={cvdEmail}
                        onChange={(e) => setCvdEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="field-label text-xs">Descripción Técnica y Prueba de Concepto (PoC)</label>
                    <textarea
                      className="field mt-1 text-xs h-24 py-2"
                      value={cvdDesc}
                      onChange={(e) => setCvdDesc(e.target.value)}
                      placeholder="Explica los pasos para reproducir la vulnerabilidad sin causar disrupción de servicios..."
                      required
                    />
                  </div>

                  <div>
                    <label className="field-label text-xs">Recomendación Técnica de Parche / Remediación</label>
                    <textarea
                      className="field mt-1 text-xs h-16 py-2"
                      value={cvdPoa}
                      onChange={(e) => setCvdPoa(e.target.value)}
                      placeholder="Sugerencias de código o configuración para mitigar el riesgo..."
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={cvdSubmitting}
                      className="px-5 py-2.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Send size={14} />
                      {cvdSubmitting ? "Remitiendo..." : "Remitir Reporte CVD de Buena Fe"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 🔍 TAB 4: CONSULTA DIRECTA POR FOLIO */}
          {/* ========================================================================= */}
          {activeTab === "track" && (
            <div className="space-y-4">
              <form onSubmit={handleTrackSearch} className="flex gap-2">
                <input
                  type="text"
                  className="field text-xs font-mono"
                  placeholder="Ej: ARCO-CU-202609-001 o CVD-ANCI-202609-001"
                  value={searchFolio}
                  onChange={(e) => setSearchFolio(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={trackingLoading}
                  className="px-5 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 shadow-sm shrink-0 cursor-pointer"
                >
                  {trackingLoading ? "Buscando..." : "Consultar Folio"}
                </button>
              </form>

              {trackingError && (
                <div className="p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 text-xs">
                  {trackingError}
                </div>
              )}

              {trackingResult && (
                <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="font-mono text-sm font-bold text-teal-800">{trackingResult.folio}</span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800">
                      Estado: {trackingResult.estado}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700">
                    <strong>Asunto / Derecho:</strong> {trackingResult.tipo_derecho || trackingResult.titulo}
                  </p>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-150 text-xs space-y-1">
                    <span className="font-bold text-slate-800 block">Respuesta Oficial Institucional:</span>
                    <p className="text-slate-600">{trackingResult.fundamento_respuesta || trackingResult.poa_remediacion}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 🔑 TAB 5: CAMBIO DE USUARIO / INGRESO SIMPLE */}
          {/* ========================================================================= */}
          {activeTab === "auth_settings" && (
            <div className="space-y-6 max-w-xl mx-auto py-4">
              <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 text-xs space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-sm">
                  <KeyRound size={16} />
                  Modalidad de Ingreso Simple Ciudadano / Investigador
                </span>
                <p>
                  Permite autenticarte rápidamente con cualquier correo electrónico o RUT para radicar solicitudes y consultar tus respuestas.
                </p>
              </div>

              <form onSubmit={handleSimpleLogin} className="space-y-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <label className="field-label text-xs">Correo Electrónico o RUT</label>
                  <input
                    type="text"
                    className="field mt-1 text-xs"
                    value={simpleIdentifier}
                    onChange={(e) => setSimpleIdentifier(e.target.value)}
                    placeholder="ej: camila.rojas@gmail.com o researcher@cybersec.cl"
                    required
                  />
                </div>

                <div>
                  <label className="field-label text-xs">Contraseña de Acceso</label>
                  <input
                    type="password"
                    className="field mt-1 text-xs"
                    value={simplePassword}
                    onChange={(e) => setSimplePassword(e.target.value)}
                    required
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setSimpleIdentifier("camila.rojas@gmail.com"); setSimplePassword("demo123"); }}
                      className="text-[11px] text-teal-700 underline font-bold"
                    >
                      Demo Ciudadana
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSimpleIdentifier("researcher@cybersec.cl"); setSimplePassword("demo123"); }}
                      className="text-[11px] text-indigo-700 underline font-bold"
                    >
                      Demo Hacker Ético
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={simpleLoginLoading}
                    className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 shadow-sm cursor-pointer"
                  >
                    {simpleLoginLoading ? "Ingresando..." : "Ingresar con Usuario & Clave"}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
