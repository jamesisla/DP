import React, { useState } from "react";
import { 
  CheckCircle2, 
  Clock, 
  Layers, 
  Sliders, 
  ToggleLeft, 
  ToggleRight, 
  Edit3, 
  ExternalLink, 
  Info, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle,
  FileCheck2
} from "lucide-react";
import { api } from "../../lib/api";

export function CyberPhases({ fases = [], token, user, onReload }) {
  const [selectedFaseId, setSelectedFaseId] = useState(fases[0]?.id || 1);
  const [editingTask, setEditingTask] = useState(null);
  const [taskState, setTaskState] = useState("Pendiente");
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  // Modular override modal
  const [modularModalOpen, setModularModalOpen] = useState(false);
  const [modularFase, setModularFase] = useState(null);
  const [isActivo, setIsActivo] = useState(true);
  const [isResueltoExterno, setIsResueltoExterno] = useState(false);
  const [notaExterna, setNotaExterna] = useState("");
  const [modularSubmitting, setModularSubmitting] = useState(false);

  const activeFase = fases.find(f => f.id === selectedFaseId) || fases[0];

  function openModularModal(f) {
    setModularFase(f);
    setIsActivo(f.activo !== false);
    setIsResueltoExterno(f.resuelto_externamente || false);
    setNotaExterna(f.nota_resolucion_externa || "");
    setModularModalOpen(true);
  }

  async function handleModularSubmit(e) {
    e.preventDefault();
    if (!modularFase) return;
    setModularSubmitting(true);
    try {
      await api(`/cyber/fases/${modularFase.id}/toggle-modular`, token, {
        method: "PUT",
        body: JSON.stringify({
          activo: isActivo,
          resuelto_externamente: isResueltoExterno,
          nota_resolucion_externa: notaExterna
        })
      });
      setModularModalOpen(false);
      if (onReload) onReload();
    } catch (err) {
      alert("Error al actualizar modularidad: " + err.message);
    } finally {
      setModularSubmitting(false);
    }
  }

  function openEditTask(t) {
    setEditingTask(t);
    setTaskState(t.estado);
  }

  async function handleTaskSubmit(e) {
    e.preventDefault();
    if (!editingTask) return;
    setTaskSubmitting(true);
    try {
      const payload = {
        nombre: editingTask.nombre,
        descripcion: editingTask.descripcion,
        fase_id: editingTask.fase_id,
        area_responsable_id: editingTask.area_responsable_id,
        usuario_asignado_id: editingTask.usuario_asignado_id,
        fecha_inicio: editingTask.fecha_inicio,
        fecha_fin: editingTask.fecha_fin,
        estado: taskState,
        resuelto_externamente: editingTask.resuelto_externamente || false,
        estandar_asociado: editingTask.estandar_asociado || "ANCI - Requisitos Mínimos"
      };

      await api(`/cyber/tareas/${editingTask.id}`, token, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      setEditingTask(null);
      if (onReload) onReload();
    } catch (err) {
      alert("Error al actualizar tarea: " + err.message);
    } finally {
      setTaskSubmitting(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-indigo-600 tracking-wider">Plan Director de Ciberseguridad</span>
          <h2 className="text-xl font-bold text-slate-800 mt-0.5">Ruta de Implementación Ley 21.663 (6 Fases)</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Guía metodológica modular desde la Gobernanza y CISO hasta la Certificación de Controles Técnicos Mínimos ante la ANCI.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
          <Info size={16} className="text-indigo-600 shrink-0" />
          <span>Cada fase es 100% modular y puede marcarse como <em>"Resuelta Externamente"</em>.</span>
        </div>
      </div>

      {/* Main Grid: Phase Tabs (Left) & Task Checklist (Right) */}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        
        {/* Left Column: 6 Phases Selector */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Fases del Marco ANCI</h3>

          <div className="space-y-2">
            {fases.map((f) => {
              const isSelected = activeFase?.id === f.id;
              const isResolvedExt = f.resuelto_externamente;
              const isInactive = !f.activo;

              return (
                <div
                  key={f.id}
                  onClick={() => setSelectedFaseId(f.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${isSelected ? "border-indigo-600 bg-indigo-50/20 shadow-sm ring-1 ring-indigo-600/30" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase">Fase {f.orden}</span>
                    {isResolvedExt ? (
                      <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">Resuelto Externo</span>
                    ) : isInactive ? (
                      <span className="text-[9px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded">Desactivado</span>
                    ) : (
                      <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">{f.progreso}%</span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-slate-800 leading-snug">{f.nombre}</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Ponderación: {f.ponderacion}%</p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[10px]">
                    <span className="text-slate-400 font-semibold">{f.tareas?.length || 0} tareas</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openModularModal(f); }}
                      className="text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Sliders size={11} />
                      Ajustar Alcance
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Phase Task Details */}
        {activeFase ? (
          <div className="rounded-xl border border-line bg-white shadow-sm p-6 space-y-6">
            
            {/* Active Phase Header Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    Fase {activeFase.orden}
                  </span>
                  <span className="text-xs font-bold text-slate-400">Ponderación: {activeFase.ponderacion}%</span>
                </div>
                <h3 className="text-base font-bold text-slate-800 mt-1.5">{activeFase.nombre}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{activeFase.descripcion}</p>
              </div>

              <button
                type="button"
                onClick={() => openModularModal(activeFase)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 shrink-0"
              >
                <Sliders size={13} />
                Configurar Modularidad
              </button>
            </div>

            {/* External Resolution Callout if marked */}
            {activeFase.resuelto_externamente && (
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs">
                <FileCheck2 className="text-blue-600 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="font-bold">Esta fase ha sido resuelta externamente por la institución</p>
                  <p className="mt-0.5 text-blue-700">{activeFase.nota_resolucion_externa || "La institución cuenta con acreditación o documentación previa que satisface este requerimiento."}</p>
                </div>
              </div>
            )}

            {/* Tasks Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tareas y Entregables de la Fase</h4>

              {activeFase.tareas && activeFase.tareas.length > 0 ? (
                <div className="space-y-3">
                  {activeFase.tareas.map((task) => {
                    const isDone = task.estado === "Completada" || task.estado === "Resuelto Externamente";
                    const isInProg = task.estado === "En progreso";

                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDone ? "border-emerald-200 bg-emerald-50/20" : "border-slate-200 bg-slate-50/50 hover:bg-white"}`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${isDone ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"}`}>
                              {isDone ? "✓" : "•"}
                            </span>
                            <h5 className="font-bold text-xs text-slate-800">{task.nombre}</h5>
                            <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-600 font-mono px-2 py-0.5 rounded">
                              {task.estandar_asociado}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 pl-7">{task.descripcion}</p>
                        </div>

                        <div className="flex items-center gap-3 pl-7 sm:pl-0 shrink-0">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${isDone ? "bg-emerald-50 text-emerald-700 border-emerald-200" : isInProg ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                            {task.estado}
                          </span>

                          <button
                            type="button"
                            onClick={() => openEditTask(task)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded border border-slate-200 hover:bg-slate-100"
                            title="Editar estado de la tarea"
                          >
                            <Edit3 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">No hay tareas asociadas a esta fase.</div>
              )}
            </div>

          </div>
        ) : null}

      </div>

      {/* --- MODULAR OVERRIDE MODAL --- */}
      {modularModalOpen && modularFase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Ajuste de Modularidad y Alcance</h3>
            <p className="text-xs text-slate-400 mb-4">{modularFase.nombre}</p>

            <form onSubmit={handleModularSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    checked={isActivo}
                    onChange={(e) => setIsActivo(e.target.checked)}
                  />
                  <span>Fase Activa en la Ruta Institucional</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    checked={isResueltoExterno}
                    onChange={(e) => setIsResueltoExterno(e.target.checked)}
                  />
                  <span>Marcar como "Resuelto Externamente" (ej. ISO 27001 o SGSI previo)</span>
                </label>
              </div>

              <div>
                <label className="field-label" htmlFor="mod-nota">Nota o Referencia Externa (Opcional)</label>
                <textarea
                  id="mod-nota"
                  className="field mt-1 text-xs h-24 py-2"
                  placeholder="Ej. Cumplido mediante Certificación ISO 27001 vigente hasta 2027 o SGSI implementado por empresa consultora..."
                  value={notaExterna}
                  onChange={(e) => setNotaExterna(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModularModalOpen(false)}
                  className="rounded border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modularSubmitting}
                  className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm"
                >
                  {modularSubmitting ? "Guardando..." : "Guardar Ajuste"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT TASK MODAL --- */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-md rounded-xl border border-line bg-white p-6 shadow-soft">
            <h3 className="text-base font-bold text-slate-800 mb-1">Actualizar Estado de Tarea</h3>
            <p className="text-xs text-slate-500 mb-4">{editingTask.nombre}</p>

            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="task-est">Estado Actual</label>
                <select
                  id="task-est"
                  className="field mt-1 text-xs"
                  value={taskState}
                  onChange={(e) => setTaskState(e.target.value)}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En progreso">En progreso</option>
                  <option value="Completada">Completada</option>
                  <option value="Resuelto Externamente">Resuelto Externamente</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="rounded border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={taskSubmitting}
                  className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm"
                >
                  {taskSubmitting ? "Guardando..." : "Guardar Estado"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
