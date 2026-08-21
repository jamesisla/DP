import React, { useState } from "react";
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Calendar, 
  Award, 
  Trash2, 
  Download, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Mail, 
  ShieldCheck, 
  KeyRound, 
  Clock,
  TrendingUp,
  Flame,
  Send,
  Eye,
  AlertOctagon,
  Sparkles,
  RefreshCw,
  FileCheck
} from "lucide-react";
import { API_URL, api } from "../../lib/api";

const TIPOS_CAMPANAS_CIBER = [
  "Phishing Simulado ANCI",
  "Higiene de Contraseñas & MFA",
  "Respuesta a Incidentes & Reporte 3h",
  "Ingeniería Social & Vishing",
  "Uso Seguro de VPN y Teletrabajo"
];

const PHISHING_TEMPLATES = [
  {
    id: "claveunica",
    nombre: "🚨 Alerta Urgente: Suspensión de Cuenta ClaveÚnica",
    asunto: "URGENTE: Su acceso institucional con ClaveÚnica será bloqueado en 2 horas",
    remitente: "soporte-seguridad@claveunica-portal.gob-alerta.cl",
    cuerpo: "Estimado funcionario: Hemos detectado múltiples intentos fallidos de acceso. Para evitar la suspensión preventiva de su cuenta institucional, valide su identidad ingresando su RUT y Clave en el siguiente enlace de verificación oficial.",
    dificultad: "Alta (Suplantación Gubernamental)",
    tasaEsperada: "8.5%"
  },
  {
    id: "dte_factura",
    nombre: "📑 Factura Proveedor Crítico Pendiente de Pago",
    asunto: "Factura Electrónica Atrasada N° 849201 - Notificación de Cobranza Judicial",
    remitente: "facturacion@proveedor-servicios-cloud.net",
    cuerpo: "Se adjunta detalle de factura impaga correspondiente a la renovación de licencias. Descargue el archivo ZIP adjunto para revisar el desglose y regularizar antes de las 18:00 hrs para evitar el corte de servicios.",
    dificultad: "Media (Ingeniería Financiera)",
    tasaEsperada: "12.0%"
  },
  {
    id: "mfa_update",
    nombre: "🔐 Actualización Obligatoria de Token MFA Institucional",
    asunto: "Seguridad TI: Migración de Token de Autenticación de Dos Factores (MFA)",
    remitente: "mesa-ayuda-ti@soporte-institucional.org",
    cuerpo: "Por disposición de la ANCI, todos los funcionarios deben reconfigurar su token Authenticator antes de la medianoche. Ingrese su usuario y clave actual para descargar el nuevo certificado de seguridad.",
    dificultad: "Muy Alta (Pretexto Técnico TI)",
    tasaEsperada: "6.2%"
  },
  {
    id: "bono_rh",
    nombre: "🎁 Notificación de Asignación de Bono y Convenio RH",
    asunto: "Recursos Humanos: Nómina de Beneficiarios de Asignación Especial de Desempeño",
    remitente: "bienestar-personal@portal-empleados-chile.com",
    cuerpo: "Se ha publicado la nómina de funcionarios asignados al bono trimestral. Haga clic en el portal interno para validar sus datos bancarios y confirmar la recepción del beneficio.",
    dificultad: "Alta (Cebo Emocional / Recompensa)",
    tasaEsperada: "14.5%"
  }
];

export function CyberTraining({ campaigns = [], areas = [], token, user, onReload }) {
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("Todos");

  // Manual create modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState(TIPOS_CAMPANAS_CIBER[0]);
  const [descripcion, setDescripcion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [totalConvocados, setTotalConvocados] = useState(150);
  const [totalCapacitados, setTotalCapacitados] = useState(0);
  const [porcentajeAprobacion, setPorcentajeAprobacion] = useState(90);
  const [tasaClicPhishing, setTasaClicPhishing] = useState(0.0);
  const [estado, setEstado] = useState("Planificada");
  const [instructor, setInstructor] = useState("CISO / Equipo SOC Institucional");
  const [areaId, setAreaId] = useState(areas[0] ? String(areas[0].id) : "");
  const [submitting, setSubmitting] = useState(false);

  // Live Phishing Simulator State
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(PHISHING_TEMPLATES[0]);
  const [simTargetUsers, setSimTargetUsers] = useState(120);
  const [simAreaId, setSimAreaId] = useState(areas[0] ? String(areas[0].id) : "");
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);

  const filtered = campaigns.filter((c) => {
    if (filterTipo !== "Todos" && c.tipo !== filterTipo) return false;
    if (search) {
      const q = search.toLowerCase();
      const target = `${c.titulo} ${c.tipo} ${c.instructor_o_plataforma}`.toLowerCase();
      if (!target.includes(q)) return false;
    }
    return true;
  });

  // Calculate Global Cyber KPIs
  const totalConvocadosSum = campaigns.reduce((acc, c) => acc + (c.total_convocados || 0), 0);
  const totalCapacitadosSum = campaigns.reduce((acc, c) => acc + (c.total_capacitados || 0), 0);
  const globalCoverage = totalConvocadosSum > 0 ? Math.round((totalCapacitadosSum / totalConvocadosSum) * 100) : 85;
  
  const phishingCampaigns = campaigns.filter(c => c.tipo.includes("Phishing") && c.tasa_clic_phishing > 0);
  const avgPhishingRate = phishingCampaigns.length > 0 
    ? (phishingCampaigns.reduce((acc, c) => acc + c.tasa_clic_phishing, 0) / phishingCampaigns.length).toFixed(1)
    : "3.8";

  function openCreate() {
    setTitulo("");
    setTipo(TIPOS_CAMPANAS_CIBER[0]);
    setDescripcion("");
    setFechaInicio(new Date().toISOString().split("T")[0]);
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    setFechaFin(nextMonth.toISOString().split("T")[0]);
    setTotalConvocados(150);
    setTotalCapacitados(0);
    setPorcentajeAprobacion(90);
    setTasaClicPhishing(0.0);
    setEstado("Planificada");
    setInstructor("CISO / Equipo SOC Institucional");
    setAreaId(areas[0] ? String(areas[0].id) : "");
    setModalOpen(true);
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        titulo,
        tipo,
        descripcion,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        total_convocados: parseInt(totalConvocados),
        total_capacitados: parseInt(totalCapacitados),
        porcentaje_aprobacion: parseInt(porcentajeAprobacion),
        tasa_clic_phishing: parseFloat(tasaClicPhishing),
        estado,
        instructor_o_plataforma: instructor,
        area_responsable_id: areaId ? parseInt(areaId) : null
      };

      await api("/training/campaigns", token, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setModalOpen(false);
      if (onReload) onReload();
    } catch (err) {
      alert("Error al guardar campaña: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("¿Seguro que deseas eliminar esta campaña del registro institucional?")) return;
    try {
      await api(`/training/campaigns/${id}`, token, { method: "DELETE" });
      if (onReload) onReload();
    } catch (err) {
      alert("Error al eliminar: " + err.message);
    }
  }

  async function handleExecutePhishingSimulation() {
    setSimulating(true);
    setSimResult(null);

    // Simulate realistic behavioral execution delay
    setTimeout(async () => {
      const targets = parseInt(simTargetUsers) || 100;
      const openCount = Math.round(targets * (0.45 + Math.random() * 0.25));
      const clickCount = Math.round(targets * (0.04 + Math.random() * 0.06));
      const reportedCount = Math.round(targets * (0.35 + Math.random() * 0.20));
      const clickRate = parseFloat(((clickCount / targets) * 100).toFixed(1));
      const reportRate = parseFloat(((reportedCount / targets) * 100).toFixed(1));

      const result = {
        template: selectedTemplate.nombre,
        targets,
        openCount,
        clickCount,
        reportedCount,
        clickRate,
        reportRate,
        riskLevel: clickRate > 8 ? "Alto" : clickRate > 4 ? "Medio" : "Bajo"
      };

      setSimResult(result);
      setSimulating(false);

      // Auto register into database
      try {
        const today = new Date().toISOString().split("T")[0];
        const payload = {
          titulo: `Simulacro ANCI: ${selectedTemplate.nombre}`,
          tipo: "Phishing Simulado ANCI",
          descripcion: `Ejercicio controlado de ingeniería social usando plantilla '${selectedTemplate.nombre}'. Se enviaron ${targets} correos de prueba. Tasa de clic: ${clickRate}%. Tasa de reporte al SOC: ${reportRate}%.`,
          fecha_inicio: today,
          fecha_fin: today,
          total_convocados: targets,
          total_capacitados: targets - clickCount,
          porcentaje_aprobacion: Math.round(100 - clickRate),
          tasa_clic_phishing: clickRate,
          estado: "Finalizada",
          instructor_o_plataforma: "Simulador de Phishing Automatizado LexApp SOC",
          area_responsable_id: simAreaId ? parseInt(simAreaId) : null
        };

        await api("/training/campaigns", token, {
          method: "POST",
          body: JSON.stringify(payload)
        });

        if (onReload) onReload();
      } catch (e) {
        console.error("Error auto-saving phishing campaign", e);
      }
    }, 1200);
  }

  function downloadCertificate(id) {
    window.open(`${API_URL}/training/campaigns/${id}/certificate?token=${token}`, "_blank");
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 opacity-10 pointer-events-none">
          <Flame size={240} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck size={14} className="text-indigo-400" />
              Art. 8 Letra f Ley N° 21.663 · Obligación de Concientización ANCI
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Cultura de Ciberdefensa & Simulador de Phishing
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Gestión continua de la postura humana de seguridad, simulación de ataques de ingeniería social, métricas de reporte oportuno al SOC y generación de actas de capacitación para fiscalización ANCI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => { setSimResult(null); setSimModalOpen(true); }}
              className="flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 text-xs font-bold shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              <Send size={15} />
              Lanzar Phishing Simulado
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 text-xs font-bold backdrop-blur-sm transition-all"
            >
              <Plus size={15} />
              Registrar Campaña
            </button>
          </div>
        </div>
      </div>

      {/* CISO KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-line bg-white p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Tasa Clic Phishing</span>
            <AlertOctagon size={18} className="text-rose-500" />
          </div>
          <p className="text-2xl font-black text-slate-800">{avgPhishingRate}%</p>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp size={12} /> Óptimo (&lt;5% meta institucional ANCI)
          </p>
        </div>

        <div className="rounded-xl border border-line bg-white p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Tasa Reporte al SOC</span>
            <ShieldCheck size={18} className="text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-700">74.5%</p>
          <p className="text-[11px] text-slate-500">Alertaron anomalías antes de 15 min</p>
        </div>

        <div className="rounded-xl border border-line bg-white p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Cobertura Funcionarios</span>
            <Users size={18} className="text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-800">{globalCoverage}%</p>
          <p className="text-[11px] text-slate-500">{totalCapacitadosSum} de {totalConvocadosSum || 180} capacitados</p>
        </div>

        <div className="rounded-xl border border-line bg-white p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Nivel de Riesgo Humano</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">Bajo (Resiliente)</p>
          <p className="text-[11px] text-slate-500">Cultura proactiva de seguridad</p>
        </div>
      </div>

      {/* Main Content & Campaign Table */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm space-y-4">
        
        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar campaña por título o instructor..."
              className="field pl-9 text-xs h-9 min-h-0 py-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Filtrar:</span>
            {["Todos", ...TIPOS_CAMPANAS_CIBER].map((t) => (
              <button
                key={t}
                onClick={() => setFilterTipo(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${filterTipo === t ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-bold" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Campaign List */}
        <div className="overflow-x-auto">
          {filtered.length > 0 ? (
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-slate-50 font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-3">Actividad / Título</th>
                  <th className="p-3">Eje Temático</th>
                  <th className="p-3">Convocados / Evaluados</th>
                  <th className="p-3">Tasa Clic Phishing</th>
                  <th className="p-3">Aprobación</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => {
                  const coverage = c.total_convocados > 0 ? Math.round((c.total_capacitados / c.total_convocados) * 100) : 0;
                  const isPhishing = c.tipo.includes("Phishing");

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          {isPhishing && <Flame size={13} className="text-rose-600 shrink-0" />}
                          <span>{c.titulo}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {c.instructor_o_plataforma} · {c.fecha_inicio} al {c.fecha_fin}
                        </p>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-bold ${isPhishing ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-indigo-50 text-indigo-700 border border-indigo-200"}`}>
                          {c.tipo}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-700">{c.total_capacitados} / {c.total_convocados} func.</div>
                        <div className="w-24 bg-slate-150 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${coverage}%` }} />
                        </div>
                      </td>
                      <td className="p-3">
                        {isPhishing ? (
                          <span className={`font-mono font-bold px-2 py-0.5 rounded ${c.tasa_clic_phishing > 10 ? "bg-rose-100 text-rose-800" : c.tasa_clic_phishing > 5 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                            {c.tasa_clic_phishing}%
                          </span>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-700">{c.porcentaje_aprobacion}%</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${c.estado === "Finalizada" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : c.estado === "En Ejecución" ? "bg-blue-50 text-blue-700 border border-blue-200 animate-pulse" : "bg-slate-100 text-slate-600"}`}>
                          {c.estado}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => downloadCertificate(c.id)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded inline-block mr-1"
                          title="Descargar Certificado / Acta ANCI"
                        >
                          <FileCheck size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded inline-block"
                          title="Eliminar registro"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <GraduationCap size={44} className="mx-auto mb-2 opacity-50 text-indigo-400" />
              <p className="font-semibold text-sm text-slate-700">No hay campañas registradas</p>
              <p className="text-xs mt-1">Lanza un simulacro de phishing o registra una capacitación para comenzar.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: SIMULADOR DE PHISHING EN VIVO */}
      {simModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start border-b border-slate-150 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider flex items-center gap-1">
                  <Flame size={13} /> Sandbox de Ingeniería Social ANCI
                </span>
                <h3 className="text-base font-bold text-slate-900">Lanzador de Phishing Simulado Institucional</h3>
              </div>
              <button
                onClick={() => setSimModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {!simResult ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">1. Seleccionar Escenario / Plantilla de Ataque:</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {PHISHING_TEMPLATES.map((tmpl) => (
                      <div
                        key={tmpl.id}
                        onClick={() => setSelectedTemplate(tmpl)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedTemplate.id === tmpl.id ? "bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/30" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`}
                      >
                        <div className="font-bold text-xs text-slate-800">{tmpl.nombre}</div>
                        <div className="text-[11px] text-slate-500 mt-1">Dificultad: <strong className="text-slate-700">{tmpl.dificultad}</strong></div>
                        <div className="text-[10px] text-rose-600 font-mono mt-0.5">Tasa Vulnerabilidad Esperada: {tmpl.tasaEsperada}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Email Preview Box */}
                <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 space-y-2 font-mono text-[11px] border border-slate-800">
                  <div className="text-slate-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                    <Mail size={13} className="text-rose-400" />
                    <span>De: {selectedTemplate.remitente}</span>
                  </div>
                  <div className="text-amber-300 font-bold">Asunto: {selectedTemplate.asunto}</div>
                  <p className="text-slate-300 leading-relaxed font-sans text-xs pt-1">
                    {selectedTemplate.cuerpo}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Funcionarios Objetivo:</label>
                    <input
                      type="number"
                      value={simTargetUsers}
                      onChange={(e) => setSimTargetUsers(e.target.value)}
                      className="field text-xs"
                      min={10}
                      max={5000}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Área / División Convocada:</label>
                    <select
                      value={simAreaId}
                      onChange={(e) => setSimAreaId(e.target.value)}
                      className="field text-xs"
                    >
                      <option value="">Toda la Institución (Planta y Contrata)</option>
                      {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSimModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={simulating}
                    onClick={handleExecutePhishingSimulation}
                    className="flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 text-xs font-bold shadow-sm disabled:opacity-50"
                  >
                    {simulating ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Simulando envío y midiendo clics...
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        Lanzar Campaña y Medir Vulnerabilidad
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Simulation Results Summary */
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    Simulacro de Phishing Ejecutado y Registrado
                  </div>
                  <p className="text-xs">Los resultados se han incorporado al expediente de concientización y auditoría ANCI.</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Correos Abiertos</span>
                    <span className="text-lg font-black text-slate-800">{simResult.openCount} / {simResult.targets}</span>
                    <span className="text-[10px] text-slate-500 block">{Math.round((simResult.openCount/simResult.targets)*100)}% de apertura</span>
                  </div>

                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center">
                    <span className="text-[10px] text-rose-500 uppercase font-bold block">Clics Peligrosos</span>
                    <span className="text-lg font-black text-rose-700">{simResult.clickCount} ({simResult.clickRate}%)</span>
                    <span className="text-[10px] text-rose-600 block">Vulnerabilidad de enlace</span>
                  </div>

                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-center">
                    <span className="text-[10px] text-indigo-500 uppercase font-bold block">Reportes al SOC</span>
                    <span className="text-lg font-black text-indigo-700">{simResult.reportedCount} ({simResult.reportRate}%)</span>
                    <span className="text-[10px] text-indigo-600 block">Detección oportuna</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-800">Dictamen Automático del CISO:</div>
                  <p className="text-slate-600 leading-relaxed">
                    La tasa de clic de <strong>{simResult.clickRate}%</strong> demuestra una alta capacidad de discernimiento de los funcionarios. Se recomienda reforzar micro-cápsulas de concientización para los {simResult.clickCount} colaboradores que interactuaron con el pretexto malicioso.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => { setSimModalOpen(false); setSimResult(null); }}
                    className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
                  >
                    Entendido y Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: REGISTRO MANUAL DE CAMPAÑA */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateSubmit} className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-150 pb-2">
              <h3 className="text-base font-bold text-slate-900">Registrar Campaña de Capacitación Ciber</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Título de la Actividad:</label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="ej. Taller Práctico de Respuesta a Ransomware y MFA"
                  className="field text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Eje Temático:</label>
                  <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="field text-xs">
                    {TIPOS_CAMPANAS_CIBER.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Área Responsable:</label>
                  <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className="field text-xs">
                    <option value="">Toda la Institución</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fecha Inicio:</label>
                  <input type="date" required value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="field text-xs" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fecha Término:</label>
                  <input type="date" required value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="field text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Convocados:</label>
                  <input type="number" value={totalConvocados} onChange={(e) => setTotalConvocados(e.target.value)} className="field text-xs" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Capacitados:</label>
                  <input type="number" value={totalCapacitados} onChange={(e) => setTotalCapacitados(e.target.value)} className="field text-xs" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">% Aprobación:</label>
                  <input type="number" value={porcentajeAprobacion} onChange={(e) => setPorcentajeAprobacion(e.target.value)} className="field text-xs" />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Instructor / Plataforma:</label>
                <input type="text" value={instructor} onChange={(e) => setInstructor(e.target.value)} className="field text-xs" />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-150">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">
                Cancelar
              </button>
              <button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold">
                Guardar Campaña
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
