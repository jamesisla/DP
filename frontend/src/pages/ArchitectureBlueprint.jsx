import React, { useState } from "react";
import { 
  Layers, 
  Server, 
  Database, 
  Globe, 
  ShieldCheck, 
  Zap, 
  Cpu, 
  ArrowRight, 
  ArrowDown, 
  Lock, 
  Terminal, 
  CheckCircle2, 
  Activity, 
  Radio, 
  Key, 
  HardDrive, 
  FileText, 
  Download,
  Eye,
  GitBranch,
  Workflow
} from "lucide-react";
import { GuidanceBanner } from "../components/GuidanceBanner";
import { API_URL } from "../lib/api";

export function ArchitectureBlueprint({ token, isCyber = false, guidanceMode = true, onToggleGuidance }) {
  const [selectedLayer, setSelectedLayer] = useState("all");
  const [activeFlow, setActiveFlow] = useState("incident"); // 'incident', 'arco', 'backup'

  const layers = [
    { id: "all", label: "Visión Global 360°", icon: Layers },
    { id: "frontend", label: "Capa 1: Frontend SPA", icon: Globe },
    { id: "core", label: "Capa 2: Core GRC Hub", icon: Server },
    { id: "gateway", label: "Capa 3: API Gateway & Webhooks", icon: Zap },
    { id: "opensource", label: "Capa 4: Apps Open Source", icon: Cpu },
    { id: "citizen", label: "Capa 5: Portal Ciudadano & CVD", icon: Radio }
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Contextual Guidance Banner */}
      {guidanceMode && (
        <GuidanceBanner
          title="Arquitectura del Sistema & Ecosistema de Integración"
          legalBasis="Ley N° 21.719 & Ley N° 21.663 ANCI"
          objective="Conoce en detalle cómo opera la plataforma: las 5 capas arquitectónicas, cómo se conecta con herramientas Open Source (Wazuh, Presidio, MinIO, Keycloak) y cómo fluyen los datos en tiempo real."
          steps={[
            { title: "Explorar Capas", desc: "Selecciona una capa para ver sus componentes, protocolos y seguridad." },
            { title: "Ver Flujos Interactivos", desc: "Revisa cómo viaja un incidente desde Wazuh hasta el oficio ANCI." },
            { title: "Descargar Blueprint", desc: "Exporta la documentación técnica de arquitectura para auditorías." }
          ]}
          tip="LexApp actúa como el cerebro de gobierno central: no reemplaza tus herramientas técnicas, sino que las orquesta y traduce sus logs a cumplimiento legal formal."
          onClose={onToggleGuidance}
          isCyber={isCyber}
        />
      )}

      {/* Header Bar */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className={`grid h-12 w-12 place-items-center rounded-xl border shrink-0 ${
            isCyber ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-teal-50 text-teal-700 border-teal-200"
          }`}>
            <Layers size={26} />
          </div>
          <div>
            <span className={`text-xs uppercase font-bold tracking-wider ${isCyber ? "text-indigo-600" : "text-teal-600"}`}>
              Ingeniería &amp; PrivacyOps Blueprint
            </span>
            <h2 className="text-xl font-bold text-slate-800 mt-0.5">
              Arquitectura del Sistema &amp; Ecosistema Open Source
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Diagrama interactivo de capas, protocolos RESTful, ingesta de telemetría y correlación cruzada dual.
            </p>
          </div>
        </div>

        <a
          href={`${API_URL.replace("/api", "")}/api/documents/grc-consolidated-onepager?token=${token}`}
          download
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 shadow-sm transition-colors shrink-0 cursor-pointer"
          title="Descargar Ficha Técnica y Blueprint de Arquitectura (Markdown)"
        >
          <Download size={14} className="text-amber-400" />
          <span>Exportar Blueprint (MD)</span>
        </a>
      </div>

      {/* Layer Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {layers.map((l) => {
          const Icon = l.icon;
          const isSel = selectedLayer === l.id;
          return (
            <button
              key={l.id}
              onClick={() => setSelectedLayer(l.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap cursor-pointer ${
                isSel
                  ? isCyber
                    ? "bg-indigo-700 text-white border-indigo-700 shadow-sm"
                    : "bg-teal-800 text-white border-teal-800 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={14} />
              <span>{l.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 🗺️ INTERACTIVE ARCHITECTURE DIAGRAM CANVAS */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-slate-100 shadow-xl space-y-6 relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950 px-2.5 py-0.5 rounded border border-indigo-800">
              TOPOLOGÍA EN 5 CAPAS
            </span>
            <span className="text-xs font-bold text-slate-300">
              Flujo Transaccional &amp; Observabilidad Continua
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            ARQUITECTURA DE ALTO RENDIMIENTO (WAL / FASTAPI)
          </span>
        </div>

        {/* --- LAYER 1: CLIENT & USER INTERFACE --- */}
        {(selectedLayer === "all" || selectedLayer === "frontend") && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-teal-400">
              <span className="font-bold flex items-center gap-1.5">
                <Globe size={13} />
                CAPA 1: CLIENTES &amp; INTERFAZ DE USUARIO (SPA REACT + VITE)
              </span>
              <span className="text-slate-500">Puerto 443 (HTTPS / TLS 1.3)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-teal-500/30 bg-teal-950/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-teal-300">Consola DPO / Legal</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-teal-900/60 text-teal-300">Ley 21.719</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Matriz RAT, Gestor ARCO+, Asistente EIPD (9 criterios), Contratos DPA y Simulador de Multas.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-indigo-300">Consola CISO / Ciberdefensa</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-900/60 text-indigo-300">Ley 21.663</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Activos RSIC, Botón de Pánico (3h), Cadena Forense (L21.459), Resoluciones PRI/BCP y Mock Audit.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-300">Ventanilla Ciudadana &amp; CVD</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-300">Público / ClaveÚnica</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Radicación ARCO+ con Folio y Canal CVD Ético con Calculadora CVSS 3.1 sin login.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Down Arrow Connector */}
        {selectedLayer === "all" && (
          <div className="flex justify-center text-slate-600">
            <ArrowDown size={18} className="animate-bounce" />
          </div>
        )}

        {/* --- LAYER 2: CORE GRC HUB & BUSINESS LOGIC --- */}
        {(selectedLayer === "all" || selectedLayer === "core") && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-indigo-400">
              <span className="font-bold flex items-center gap-1.5">
                <Server size={13} />
                CAPA 2: CORE GRC HUB &amp; MOTOR REGULATORIO DUAL
              </span>
              <span className="text-slate-500">FastAPI (Python) / Chi Monolito (Go) · Puerto 8000</span>
            </div>

            <div className="p-4 rounded-xl border border-indigo-500/40 bg-slate-900/90 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                  <p className="font-bold text-slate-200">Motor Días Hábiles</p>
                  <p className="text-[10px] text-teal-400 mt-0.5">SLA 15d ARCO+ Excluye Feriados</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                  <p className="font-bold text-slate-200">Alerta Perentoria 3h</p>
                  <p className="text-[10px] text-rose-400 mt-0.5">Temporizador Legal ANCI</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                  <p className="font-bold text-slate-200">Heurística EIPD</p>
                  <p className="text-[10px] text-amber-400 mt-0.5">Matriz 9 Factores CEPD</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                  <p className="font-bold text-slate-200">Ledger SHA-256</p>
                  <p className="text-[10px] text-emerald-400 mt-0.5">Sellado Criptográfico Inmutable</p>
                </div>
              </div>

              {/* Data Persistence Sublayer */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="flex items-center gap-1.5">
                  <Database size={13} className="text-indigo-400" />
                  <strong>Persistencia Transaccional:</strong> SQLite con Write-Ahead Logging (WAL) o PostgreSQL + Bóveda de Archivos
                </span>
                <span className="text-emerald-400 font-bold">✓ Latencia &lt; 1ms</span>
              </div>
            </div>
          </div>
        )}

        {/* Down Arrow Connector */}
        {selectedLayer === "all" && (
          <div className="flex justify-center text-slate-600">
            <ArrowDown size={18} className="animate-bounce" />
          </div>
        )}

        {/* --- LAYER 3: API GATEWAY & WEBHOOKS INGESTION --- */}
        {(selectedLayer === "all" || selectedLayer === "gateway") && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-amber-400">
              <span className="font-bold flex items-center gap-1.5">
                <Zap size={13} />
                CAPA 3: GATEWAY DE INTEGRACIÓN TÉCNICA &amp; WEBHOOKS RESTFUL
              </span>
              <span className="text-slate-500">Endpoints `/api/gateways/*` · Autenticación Bearer / HMAC</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-rose-400 font-bold block">POST /wazuh-alert</span>
                <span className="text-[11px] text-slate-300">Ingesta alertas SIEM Nivel 10+</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-teal-400 font-bold block">POST /presidio-scan</span>
                <span className="text-[11px] text-slate-300">Reportes de auditoría PII NLP</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-indigo-400 font-bold block">POST /backup-heartbeat</span>
                <span className="text-[11px] text-slate-300">Certificación hash WORM</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-amber-400 font-bold block">POST /iam-event</span>
                <span className="text-[11px] text-slate-300">Trazabilidad MFA y logins</span>
              </div>
            </div>
          </div>
        )}

        {/* Down Arrow Connector */}
        {selectedLayer === "all" && (
          <div className="flex justify-center text-slate-600">
            <ArrowDown size={18} className="animate-bounce" />
          </div>
        )}

        {/* --- LAYER 4: OPEN SOURCE SECURITY & PRIVACY APPS --- */}
        {(selectedLayer === "all" || selectedLayer === "opensource") && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400">
              <span className="font-bold flex items-center gap-1.5">
                <Cpu size={13} />
                CAPA 4: ECOSISTEMA TÉCNICO OPEN SOURCE (SEGURIDAD &amp; PRIVACIDAD OPERATIVA)
              </span>
              <span className="text-slate-500">Agentes, Demonios y Servicios en Servidores RSIC</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/70 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-rose-400">Wazuh SIEM / XDR</span>
                  <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400">Integratord</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Monitoreo de integridad de archivos (FIM), detección de malware y fuerza bruta en RSIC.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/70 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-teal-400">MS Presidio NLP</span>
                  <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400">Python Engine</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Detección de RUTs, correos y datos sensibles no declarados en PostgreSQL/MySQL.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/70 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-indigo-400">MinIO / Restic S3</span>
                  <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400">WORM Storage</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Copias de seguridad inmutables con Object Lock 30d protegidas contra ransomware.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/70 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-400">Keycloak / Authentik</span>
                  <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400">IAM / MFA</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Autenticación multifactor forzada y Single Sign-On (SSO) para administradores.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 🔄 END-TO-END INTERACTIVE WORKFLOWS */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs uppercase font-bold text-teal-600 tracking-wider">Trazabilidad Extremo a Extremo</span>
            <h3 className="text-lg font-bold text-slate-800">¿Cómo viajan los datos en los 3 flujos críticos?</h3>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveFlow("incident")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeFlow === "incident" ? "bg-white text-rose-800 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              1. Ciberataque &amp; Alerta 3h
            </button>
            <button
              onClick={() => setActiveFlow("arco")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeFlow === "arco" ? "bg-white text-teal-800 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              2. Solicitud ARCO+ (15d)
            </button>
            <button
              onClick={() => setActiveFlow("backup")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeFlow === "backup" ? "bg-white text-indigo-800 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              3. Respaldo Inmutable WORM
            </button>
          </div>
        </div>

        {/* FLOW 1: CYBER ATTACK & 3H ALERT */}
        {activeFlow === "incident" && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              <strong>Escenario:</strong> Un atacante ejecuta un binario no autorizado en el servidor de base de datos (`RSIC-01`).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.2 rounded">PASO 1: DETECCIÓN</span>
                <p className="text-xs font-bold text-slate-800 mt-1">Wazuh SIEM detecta L12</p>
                <p className="text-[11px] text-slate-500">El módulo FIM registra alteración de `/usr/bin/sudo` y volcado de memoria.</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.2 rounded">PASO 2: INGESTA</span>
                <p className="text-xs font-bold text-slate-800 mt-1">Webhook RESTful a LexApp</p>
                <p className="text-[11px] text-slate-500">`wazuh-integratord` envía POST JSON a `/api/gateways/wazuh-alert`.</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[10px] font-black text-indigo-700 bg-indigo-100 px-2 py-0.2 rounded">PASO 3: CORRELACIÓN</span>
                <p className="text-xs font-bold text-slate-800 mt-1">Doble Temporizador Legal</p>
                <p className="text-[11px] text-slate-500">LexApp dispara Alerta ANCI (&lt;3h) y Brecha DPO (&lt;72h) vinculada al RAT.</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded">PASO 4: DOCUMENTACIÓN</span>
                <p className="text-xs font-bold text-slate-800 mt-1">Emisión de Oficios Oficiales</p>
                <p className="text-[11px] text-slate-500">Descarga del Oficio ANCI y Acta Judicial de Cadena de Custodia (L21.459).</p>
              </div>
            </div>
          </div>
        )}

        {/* FLOW 2: ARCO+ CITIZEN REQUEST */}
        {activeFlow === "arco" && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              <strong>Escenario:</strong> Un ciudadano solicita la portabilidad y rectificación de sus datos mediante el Portal Ciudadano.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[10px] font-black text-teal-700 bg-teal-100 px-2 py-0.2 rounded">PASO 1: RADICACIÓN</span>
                <p className="text-xs font-bold text-slate-800 mt-1">Ingreso con ClaveÚnica</p>
                <p className="text-[11px] text-slate-500">Generación de Folio Único y cálculo legal de 15 días hábiles (excluye feriados).</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[10px] font-black text-indigo-700 bg-indigo-100 px-2 py-0.2 rounded">PASO 2: ASIGNACIÓN</span>
                <p className="text-xs font-bold text-slate-800 mt-1">Derivación a División</p>
                <p className="text-[11px] text-slate-500">El DPO asigna la tarea al área responsable de la base de datos.</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.2 rounded">PASO 3: DICTAMEN DPO</span>
                <p className="text-xs font-bold text-slate-800 mt-1">Fundamento Legal Art. 10</p>
                <p className="text-[11px] text-slate-500">Redacción de respuesta fundada favorable o rechazo motivado.</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded">PASO 4: NOTIFICACIÓN</span>
                <p className="text-xs font-bold text-slate-800 mt-1">Sello SHA-256 Inmutable</p>
                <p className="text-[11px] text-slate-500">El ciudadano consulta el resultado con su folio y descarga la resolución firmada.</p>
              </div>
            </div>
          </div>
        )}

        {/* FLOW 3: IMMUTABLE BACKUP */}
        {activeFlow === "backup" && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              <strong>Escenario:</strong> Rutina nocturna automatizada de respaldo inmutable contra ransomware.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[10px] font-black text-indigo-700 bg-indigo-100 px-2 py-0.2 rounded">PASO 1: BACKUP S3</span>
                <p className="text-xs font-bold text-slate-800 mt-1">Restic hacia MinIO</p>
                <p className="text-[11px] text-slate-500">Copia de PostgreSQL hacia bucket S3 con Object Lock de 30 días activado.</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[10px] font-black text-teal-700 bg-teal-100 px-2 py-0.2 rounded">PASO 2: HASHING</span>
                <p className="text-xs font-bold text-slate-800 mt-1">Extracción SHA-256</p>
                <p className="text-[11px] text-slate-500">El script Bash extrae la firma del árbol de snapshot inmutable.</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.2 rounded">PASO 3: HEARTBEAT</span>
                <p className="text-xs font-bold text-slate-800 mt-1">Ingesta en LexApp</p>
                <p className="text-[11px] text-slate-500">POST a `/api/gateways/backup-heartbeat` con el comprobante criptográfico.</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded">PASO 4: AUDITORÍA ANCI</span>
                <p className="text-xs font-bold text-slate-800 mt-1">Tríada Técnica 100%</p>
                <p className="text-[11px] text-slate-500">El activo RSIC se certifica en verde en el Catálogo de Ciberseguridad.</p>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
