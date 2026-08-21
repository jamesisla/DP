import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Server, 
  Activity, 
  ListTodo, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Download, 
  FileCode, 
  Lock, 
  Flame,
  FileText,
  Calendar
} from "lucide-react";
import { API_URL } from "../../lib/api";
import { ComplianceTimeline } from "../../components/ComplianceTimeline";

export function CyberDashboard({ data, onReload, onNavigate, token }) {
  if (!data) return <div className="p-8 text-slate-500">Cargando Dashboard de Ciberseguridad...</div>;

  const metrics = data.metrics || [];
  const phases = data.phases || [];
  const maturity = data.maturity || null;
  const assetsStats = data.assets_stats || { total: 0, criticos: 0, conformes: 0 };
  const urgent3h = data.urgent_3h_count || 0;

  function getProgressColor(prog) {
    if (prog === 100) return "bg-emerald-500";
    if (prog > 50) return "bg-indigo-600";
    if (prog > 0) return "bg-amber-500";
    return "bg-slate-300";
  }

  function getProgressBadge(prog, resueltoExterno) {
    if (resueltoExterno) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Resuelto Externo</span>;
    }
    if (prog === 100) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">100% Completo</span>;
    }
    if (prog > 50) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">{prog}%</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">{prog}%</span>;
  }

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Top Action Bar */}
      <div className="rounded-xl border border-line bg-white p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-indigo-600 tracking-wider">Centro de Ciberdefensa & ANCI</span>
          <h2 className="text-lg font-bold text-slate-800">Panel Ejecutivo de Ciberseguridad (Ley N° 21.663)</h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`${API_URL.replace("/api", "")}/api/cyber/executive-onepager-cyber?token=${token}`}
            download
            className="inline-flex items-center gap-1.5 rounded border border-indigo-300 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-900 hover:bg-indigo-100 shadow-2xs transition-colors shrink-0"
            title="Descargar Informe Ejecutivo de 1 Página de Ciberdefensa para el Directorio"
          >
            <FileText size={14} className="text-indigo-700" />
            Informe Directorio (1P)
          </a>

          <a
            href={`${API_URL.replace("/api", "")}/api/cyber/annual-cybersecurity-plan?token=${token}`}
            download
            className="inline-flex items-center gap-2 rounded bg-indigo-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-800 shadow-sm transition-colors shrink-0"
            title="Descargar Plan Anual Institucional de Ciberseguridad y Resiliencia (2026-2027)"
          >
            <FileText size={14} />
            Plan Anual de Ciberseguridad (MD)
          </a>
        </div>
      </div>

      {/* 3h Alert Warning Banner if active */}
      {urgent3h > 0 && (
        <div 
          onClick={() => onNavigate && onNavigate("cyber_incidents")}
          className="flex items-start justify-between gap-4 rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-900 shadow-sm cursor-pointer hover:bg-rose-100/70 transition-all animate-pulse"
        >
          <div className="flex items-start gap-3">
            <Radio className="mt-0.5 text-rose-600 shrink-0 animate-bounce" size={22} />
            <div>
              <h4 className="font-bold text-sm tracking-tight">ALERTA ANCI: {urgent3h} INCIDENTE(S) PENDIENTE(S) DE ALERTA TEMPRANA (3 HORAS)</h4>
              <p className="mt-0.5 text-xs text-rose-800 font-medium leading-relaxed">
                El Artículo 12 de la Ley N° 21.663 exige remitir la notificación preliminar a la Agencia Nacional de Ciberseguridad antes de las 3 horas de detectado el ataque.
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-rose-500 shrink-0 self-center" />
        </div>
      )}

      {/* Main KPI Grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, idx) => (
          <div 
            className="rounded-xl border border-line bg-white p-5 shadow-sm hover:shadow-md transition-shadow cursor-default" 
            key={idx}
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{metric.label}</p>
            <div className="mt-3 flex items-baseline justify-between">
              <p className="text-2xl font-black text-slate-800 tracking-tight">{metric.value}</p>
              <span className="rounded-full bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                {metric.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Grid: NIST Maturity Gauges & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* Maturity Breakdown (5 Domains NIST/ANCI) */}
        <div className="rounded-xl border border-line bg-white p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Marco Nacional de Ciberseguridad</span>
              <h3 className="text-base font-bold text-slate-800">Diagnóstico de Madurez por Dominios</h3>
            </div>
            <button
              onClick={() => onNavigate && onNavigate("cyber_maturity")}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Ver Detalle</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {maturity ? (
            <div className="space-y-3 pt-1">
              {[
                { label: "1. Identificar (Gestión de Activos y Riesgos)", val: maturity.porcentaje_identificar, color: "bg-blue-600" },
                { label: "2. Proteger (Controles, Cifrado, MFA, Parches)", val: maturity.porcentaje_proteger, color: "bg-indigo-600" },
                { label: "3. Detectar (Monitoreo, SIEM, Detección de Anomalías)", val: maturity.porcentaje_detectar, color: "bg-purple-600" },
                { label: "4. Responder (Plan de Respuesta a Incidentes PRI)", val: maturity.porcentaje_responder, color: "bg-amber-600" },
                { label: "5. Recuperar (Continuidad BCP/DRP y Backups)", val: maturity.porcentaje_recuperar, color: "bg-emerald-600" },
              ].map((domain, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{domain.label}</span>
                    <span className="font-bold">{domain.val}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className={`h-full ${domain.color} transition-all duration-700`} style={{ width: `${domain.val}%` }}></div>
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Índice Global Ponderado:</span>
                <span className="text-base font-black text-indigo-700">{maturity.madurez_global}% Madurez</span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No hay evaluación de madurez registrada. Haz clic en "Ver Detalle" para autoevaluar tu institución.
            </div>
          )}
        </div>

        {/* Essential Services & Fast Action Box */}
        <div className="rounded-xl border border-line bg-white p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cumplimiento Operacional</span>
            <h3 className="text-base font-bold text-slate-800">Servicios Esenciales & Controles Técnicos</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              La Ley 21.663 cataloga a los organismos del Estado y proveedores estratégicos como <strong>Prestadores de Servicios Esenciales (PSE)</strong> o <strong>Operadores de Importancia Vital (OIV)</strong>.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-[10px] font-bold uppercase text-slate-400">Activos Críticos OIV</p>
                <p className="text-xl font-black text-slate-800 mt-1">{assetsStats.criticos}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Sistemas indispensables</p>
              </div>

              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg">
                <p className="text-[10px] font-bold uppercase text-emerald-700">Controles Mínimos</p>
                <p className="text-xl font-black text-emerald-800 mt-1">{assetsStats.conformes} / {assetsStats.total}</p>
                <p className="text-[10px] text-emerald-600 mt-0.5">Con MFA y Cifrado</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <a
              href={`${API_URL.replace("/api", "")}/api/cyber/executive-dossier?token=${token}`}
              download
              className="w-full sm:flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-indigo-200 bg-indigo-50 text-indigo-900 rounded-lg text-xs font-bold hover:bg-indigo-100 shadow-2xs transition-colors"
              title="Descargar Informe Ejecutivo Dual de Protección de Datos y Ciberseguridad"
            >
              <FileCode size={14} className="text-indigo-600" />
              Dossier Ejecutivo GRC (MD)
            </a>

            <a
              href={`${API_URL.replace("/api", "")}/api/cyber/evidence-zip?token=${token}`}
              download
              className="w-full sm:flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 shadow-2xs transition-colors"
            >
              <Download size={14} />
              Expediente ANCI (ZIP)
            </a>
          </div>
        </div>

      </div>

      {/* 6 Methodological Phases */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ListTodo className="text-indigo-600" size={18} />
            <h3 className="text-base font-bold text-slate-800">Ruta Metodológica Ley 21.663 (6 Fases)</h3>
          </div>
          <button
            onClick={() => onNavigate && onNavigate("cyber_phases")}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Gestionar Tareas y Módulos</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {phases.map((phase) => (
            <div
              key={phase.id}
              onClick={() => onNavigate && onNavigate("cyber_phases")}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Fase {phase.orden}</span>
                  {getProgressBadge(phase.progreso, phase.resuelto_externamente)}
                </div>
                <h4 className="font-bold text-xs text-slate-800 leading-snug">{phase.nombre}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{phase.descripcion}</p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-150">
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full ${getProgressColor(phase.progreso)} transition-all`} style={{ width: `${phase.progreso}%` }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>Tareas: {phase.tareas_completadas}/{phase.total_tareas}</span>
                  <span>Ponderación: {phase.ponderacion}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unified Regulatory Timeline */}
      <ComplianceTimeline token={token} />

    </div>
  );
}
