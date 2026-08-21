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
  TrendingUp
} from "lucide-react";
import { API_URL, api } from "../lib/api";

const TIPOS_CAMPANAS = [
  "Protección de Datos Ley 21.719",
  "Phishing Simulado ANCI",
  "Higiene de Contraseñas & MFA",
  "Respuesta a Incidentes & Reporte 3h",
  "Uso Seguro de Dispositivos y Teletrabajo"
];

const ESTADOS = [
  "Planificada",
  "En Ejecución",
  "Finalizada"
];

export function TrainingCampaigns({ campaigns = [], areas = [], token, user, onReload }) {
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("Todos");

  // Create modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState(TIPOS_CAMPANAS[0]);
  const [descripcion, setDescripcion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [totalConvocados, setTotalConvocados] = useState(150);
  const [totalCapacitados, setTotalCapacitados] = useState(0);
  const [porcentajeAprobacion, setPorcentajeAprobacion] = useState(90);
  const [tasaClicPhishing, setTasaClicPhishing] = useState(0.0);
  const [estado, setEstado] = useState("Planificada");
  const [instructor, setInstructor] = useState("DPO / CISO Institucional");
  const [areaId, setAreaId] = useState(areas[0] ? String(areas[0].id) : "");
  const [submitting, setSubmitting] = useState(false);

  const filtered = campaigns.filter((c) => {
    if (filterTipo !== "Todos" && c.tipo !== filterTipo) return false;
    if (search) {
      const q = search.toLowerCase();
      const target = `${c.titulo} ${c.tipo} ${c.instructor_o_plataforma}`.toLowerCase();
      if (!target.includes(q)) return false;
    }
    return true;
  });

  // Calculate Global KPIs
  const totalConvocadosSum = campaigns.reduce((acc, c) => acc + (c.total_convocados || 0), 0);
  const totalCapacitadosSum = campaigns.reduce((acc, c) => acc + (c.total_capacitados || 0), 0);
  const globalCoverage = totalConvocadosSum > 0 ? Math.round((totalCapacitadosSum / totalConvocadosSum) * 100) : 0;
  
  const phishingCampaigns = campaigns.filter(c => c.tipo.includes("Phishing") && c.tasa_clic_phishing > 0);
  const avgPhishingRate = phishingCampaigns.length > 0 
    ? (phishingCampaigns.reduce((acc, c) => acc + c.tasa_clic_phishing, 0) / phishingCampaigns.length).toFixed(1)
    : "0.0";

  function openCreate() {
    setTitulo("");
    setTipo(TIPOS_CAMPANAS[0]);
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
    setInstructor("DPO / CISO Institucional");
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
      alert("Error al registrar campaña: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("¿Deseas eliminar este registro de capacitación?")) return;
    try {
      await api(`/training/campaigns/${id}`, token, { method: "DELETE" });
      if (onReload) onReload();
    } catch (err) {
      alert("Error al eliminar: " + err.message);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100 shrink-0">
            <GraduationCap size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-teal-600 tracking-wider">Cultura & Concientización</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                Art. 14 L21.719 · Art. 8 L21.663
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mt-0.5">Capacitaciones del Personal & Phishing Simulado</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Gestión de talleres obligatorios de protección de datos, higiene digital y simulaciones de ingeniería social.
            </p>
          </div>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 shadow-sm"
        >
          <Plus size={15} />
          Nueva Campaña Formativa
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Campañas</span>
          <p className="text-2xl font-black text-slate-800 mt-1">{campaigns.length}</p>
          <span className="text-xs text-slate-400 font-medium">Ejecutadas y planificadas</span>
        </div>

        <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">Cobertura Institucional</span>
          <p className="text-2xl font-black text-teal-700 mt-1">{globalCoverage}%</p>
          <span className="text-xs text-teal-600 font-medium">{totalCapacitadosSum} de {totalConvocadosSum} funcionarios</span>
        </div>

        <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Vulnerabilidad a Phishing</span>
          <p className="text-2xl font-black text-rose-700 mt-1">{avgPhishingRate}%</p>
          <span className="text-xs text-slate-400 font-medium">Tasa promedio de clic en trampas</span>
        </div>

        <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Aprobación Evaluaciones</span>
          <p className="text-2xl font-black text-indigo-700 mt-1">92%</p>
          <span className="text-xs text-indigo-600 font-medium">Conformidad en test de conocimientos</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-line bg-white p-3.5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            className="field pl-9 text-xs h-8 min-h-0 py-0"
            placeholder="Buscar por título, temática, instructor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 w-full md:w-auto">
          <span>Temática:</span>
          <select
            className="field text-xs h-8 min-h-0 py-0"
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
          >
            <option value="Todos">Todas las temáticas</option>
            {TIPOS_CAMPANAS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Campaigns Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const coverage = c.total_convocados > 0 ? Math.round((c.total_capacitados / c.total_convocados) * 100) : 0;
            const isPhishing = c.tipo.includes("Phishing");

            return (
              <div
                key={c.id}
                className="rounded-xl border border-line bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                      {c.tipo}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${c.estado === "Finalizada" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : c.estado === "En Ejecución" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {c.estado}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-800 leading-snug">{c.titulo}</h4>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">
                      Instructor: <span className="text-slate-600">{c.instructor_o_plataforma}</span>
                    </p>
                    {c.descripcion && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded border border-slate-150">
                        {c.descripcion}
                      </p>
                    )}
                  </div>

                  {/* Metrics Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                      <span>Cobertura de Funcionarios</span>
                      <span className="font-bold text-teal-700">{c.total_capacitados} / {c.total_convocados} ({coverage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full ${coverage >= 80 ? "bg-teal-600" : "bg-amber-500"} transition-all`}
                        style={{ width: `${coverage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Phishing rate badge if applicable */}
                  {isPhishing && (
                    <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-lg flex justify-between items-center text-xs">
                      <span className="font-bold text-rose-900">Tasa de Clic en Trampa Phishing:</span>
                      <span className="font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded">{c.tasa_clic_phishing}%</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Calendar size={12} />
                    <span>Período: {new Date(c.fecha_inicio).toLocaleDateString()} al {new Date(c.fecha_fin).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs flex-wrap gap-2">
                  <a
                    href={`${API_URL.replace("/api", "")}/api/training/campaigns/${c.id}/certificate?token=${token}`}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded text-xs font-bold text-teal-900 hover:bg-teal-100 shadow-2xs transition-colors"
                  >
                    <Download size={13} />
                    Acta & Certificado (MD)
                  </a>

                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                    title="Eliminar campaña"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-350 p-12 text-center text-slate-400 bg-white">
          <GraduationCap size={40} className="mx-auto mb-2 opacity-40" />
          <p className="font-semibold text-sm">No hay campañas de capacitación registradas</p>
          <p className="text-xs mt-1">Haz clic en "Nueva Campaña Formativa" para programar talleres y simulaciones de phishing.</p>
        </div>
      )}

      {/* --- CREATE MODAL --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Registrar Campaña de Capacitación / Concientización</h3>
            <p className="text-xs text-slate-400 mb-4">Acreditación obligatoria de capacitación al personal (Art. 14 Ley 21.719 y Art. 8 Ley 21.663).</p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="camp-tit">Título de la Actividad Formativa</label>
                <input
                  id="camp-tit"
                  className="field mt-1 text-sm"
                  required
                  placeholder="Ej. Taller de Buenas Prácticas en Protección de Datos 2026"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="camp-tipo">Eje Temático</label>
                  <select
                    id="camp-tipo"
                    className="field mt-1 text-xs"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                  >
                    {TIPOS_CAMPANAS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="field-label" htmlFor="camp-est">Estado</label>
                  <select
                    id="camp-est"
                    className="field mt-1 text-xs"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                  >
                    {ESTADOS.map(est => (
                      <option key={est} value={est}>{est}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="camp-desc">Objetivos y Contenidos Clave</label>
                <textarea
                  id="camp-desc"
                  className="field mt-1 text-xs h-16 py-1.5"
                  placeholder="Descripción de los contenidos impartidos a los funcionarios..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="camp-ini">Fecha Inicio</label>
                  <input
                    id="camp-ini"
                    type="date"
                    className="field mt-1 text-xs"
                    required
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="camp-fin">Fecha Término</label>
                  <input
                    id="camp-fin"
                    type="date"
                    className="field mt-1 text-xs"
                    required
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="camp-conv">Total Convocados</label>
                  <input
                    id="camp-conv"
                    type="number"
                    min="1"
                    className="field mt-1 text-xs"
                    required
                    value={totalConvocados}
                    onChange={(e) => setTotalConvocados(e.target.value)}
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="camp-cap">Total Capacitados</label>
                  <input
                    id="camp-cap"
                    type="number"
                    min="0"
                    className="field mt-1 text-xs"
                    required
                    value={totalCapacitados}
                    onChange={(e) => setTotalCapacitados(e.target.value)}
                  />
                </div>
              </div>

              {tipo.includes("Phishing") && (
                <div>
                  <label className="field-label" htmlFor="camp-phish">Tasa de Clic en Phishing (%)</label>
                  <input
                    id="camp-phish"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="field mt-1 text-xs"
                    value={tasaClicPhishing}
                    onChange={(e) => setTasaClicPhishing(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="field-label" htmlFor="camp-inst">Instructor o Plataforma</label>
                <input
                  id="camp-inst"
                  className="field mt-1 text-xs"
                  placeholder="Ej. CISO / DPO Institucional"
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                />
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
                  {submitting ? "Registrando..." : "Guardar Campaña"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
