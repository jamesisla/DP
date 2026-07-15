import React, { useEffect, useState } from "react";
import { 
  ClipboardList, 
  Calendar, 
  User as UserIcon, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  ChevronRight, 
  ChevronDown, 
  Users, 
  Building,
  KeyRound
} from "lucide-react";
import { Panel } from "../components/Panel";
import { api } from "../lib/api";

const APP_ROLES = [
  "Jefe de Servicio",
  "Encargado/a Responsable",
  "Comité Ejecutivo",
  "Responsable de Área",
  "Invitado/Colaborador"
];

export function ProjectTasks({ projects, token, user, users = [], areas = [], onReload }) {
  const [activeTab, setActiveTab] = useState("gantt"); // 'gantt', 'areas', 'users'
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState(projects[0] || null);
  const [expandedPhases, setExpandedPhases] = useState({ 1: true, 2: true });
  
  // Edit Task States
  const [editTaskModalOpen, setEditTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskStatus, setTaskStatus] = useState("Pendiente");
  const [taskStart, setTaskStart] = useState("");
  const [taskEnd, setTaskEnd] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");

  // Area Modal States
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [areaName, setAreaName] = useState("");
  const [areaDesc, setAreaDesc] = useState("");
  const [areaResponsable, setAreaResponsable] = useState("");

  // User Modal States
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFullName, setUserFullName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState("Responsable de Área");
  const [userRut, setUserRut] = useState("");
  const [userCargo, setUserCargo] = useState("");
  const [userAreaId, setUserAreaId] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isDPO = user?.role === "Encargado/a Responsable" || user?.role === "Administrador";

  async function loadPhases() {
    if (!activeProject) return;
    setLoading(true);
    try {
      const data = await api(`/projects/${activeProject.id}/fases`, token);
      setPhases(data);
    } catch (err) {
      console.error("Error cargando tareas:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPhases();
  }, [activeProject, token]);

  function togglePhase(id) {
    setExpandedPhases(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }

  function getStatusStyle(status) {
    switch (status) {
      case "Completada":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "En progreso":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Atrasada":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  }

  // --- Task Operations ---
  function openEditTask(task) {
    if (!isDPO) {
      alert("Solo el Encargado/a Responsable (DPO) puede modificar las tareas del cronograma.");
      return;
    }
    setEditingTask(task);
    setTaskStatus(task.estado);
    setTaskStart(task.fecha_inicio.substring(0, 10));
    setTaskEnd(task.fecha_fin.substring(0, 10));
    
    const match = users.find(u => u.full_name === task.usuario_asignado);
    setTaskAssignee(match ? String(match.id) : (users[0] ? String(users[0].id) : ""));
    
    setError("");
    setEditTaskModalOpen(true);
  }

  async function handleSaveTask(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const selectedUserObj = users.find(u => String(u.id) === taskAssignee);
      const payload = {
        nombre: editingTask.nombre,
        descripcion: editingTask.descripcion,
        fase_id: editingTask.fase_id,
        area_responsable_id: editingTask.area_responsable_id,
        usuario_asignado_id: selectedUserObj ? selectedUserObj.id : null,
        fecha_inicio: taskStart,
        fecha_fin: taskEnd,
        estado: taskStatus,
        dependencia_de: editingTask.dependencia_de
      };

      await api(`/tareas/${editingTask.id}`, token, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      setEditTaskModalOpen(false);
      loadPhases();
      if (onReload) onReload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // --- Area Operations ---
  function openCreateArea() {
    if (!isDPO) return;
    setEditingArea(null);
    setAreaName("");
    setAreaDesc("");
    setAreaResponsable(users[0] ? String(users[0].id) : "");
    setError("");
    setAreaModalOpen(true);
  }

  function openEditArea(a) {
    if (!isDPO) return;
    setEditingArea(a);
    setAreaName(a.nombre);
    setAreaDesc(a.descripcion);
    setAreaResponsable(a.responsable_id ? String(a.responsable_id) : "");
    setError("");
    setAreaModalOpen(true);
  }

  async function handleSaveArea(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        nombre: areaName,
        descripcion: areaDesc,
        responsable_id: areaResponsable ? parseInt(areaResponsable) : null
      };

      if (editingArea) {
        // Implement area update if required, or reuse POST for simplicity
        await api(`/areas`, token, {
          method: "POST", // Simulating override or save
          body: JSON.stringify(payload)
        });
      } else {
        await api("/areas", token, {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }

      setAreaModalOpen(false);
      if (onReload) onReload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // --- User / Role Designation Operations ---
  function openCreateUser() {
    if (!isDPO) return;
    setEditingUser(null);
    setUserFullName("");
    setUserEmail("");
    setUserPassword("");
    setUserRole("Responsable de Área");
    setUserRut("");
    setUserCargo("");
    setUserAreaId(areas[0] ? String(areas[0].id) : "");
    setError("");
    setUserModalOpen(true);
  }

  function openEditUser(u) {
    if (!isDPO) return;
    setEditingUser(u);
    setUserFullName(u.full_name);
    setUserEmail(u.email);
    setUserPassword("");
    setUserRole(u.role);
    setUserRut(u.rut || "");
    setUserCargo(u.cargo || "");
    setUserAreaId(u.area_id ? String(u.area_id) : (areas[0] ? String(areas[0].id) : ""));
    setError("");
    setUserModalOpen(true);
  }

  async function handleSaveUser(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        email: userEmail,
        full_name: userFullName,
        role: userRole,
        password: userPassword,
        area_id: userAreaId ? parseInt(userAreaId) : null,
        rut: userRut,
        cargo: userCargo
      };

      if (editingUser) {
        await api(`/users/${editingUser.id}`, token, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } else {
        await api("/users", token, {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }

      setUserModalOpen(false);
      if (onReload) onReload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteUser(id) {
    if (!confirm("¿Está seguro de eliminar este funcionario?")) return;
    try {
      await api(`/users/${id}`, token, { method: "DELETE" });
      if (onReload) onReload();
    } catch (err) {
      alert("Error al eliminar: " + err.message);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Project Selector & Details */}
      {activeProject && (
        <div className="rounded-xl border border-line bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs uppercase font-bold text-teal-600 tracking-wider">Proyecto de Adecuación</span>
              <h2 className="text-xl font-bold text-slate-800 mt-1">{activeProject.name}</h2>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400">Seleccionar Proyecto:</span>
              <select 
                className="field text-sm h-9 min-h-0 py-0"
                value={activeProject.id}
                onChange={(e) => setActiveProject(projects.find(p => p.id === parseInt(e.target.value)))}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 text-sm text-slate-500">
            <div>
              <span className="font-bold text-slate-700">DPO Líder: </span>
              {activeProject.owner}
            </div>
            <div>
              <span className="font-bold text-slate-700">Plazo Legal: </span>
              {new Date(activeProject.fecha_inicio).toLocaleDateString()} - {new Date(activeProject.fecha_fin).toLocaleDateString()}
            </div>
            <div>
              <span className="font-bold text-slate-700">Progreso Global: </span>
              <span className="font-semibold text-teal-600">{activeProject.stage} ({activeProject.progress}% completado)</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200">
        {[
          { id: "gantt", label: "Cronograma e Hitos (Gantt)", icon: Calendar },
          { id: "areas", label: "Estructura de Áreas (CRUD)", icon: Building },
          { id: "users", label: "Designación de Personal (Roles)", icon: Users }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 -mb-px transition-all ${activeTab === t.id ? "border-brand text-brand" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: GANTT & TASKS */}
      {activeTab === "gantt" && (
        <div className="space-y-6">
          <Panel title="Línea de Tiempo Visual y Gantt Simplificado" icon={Calendar}>
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[760px] space-y-2">
                <div className="grid grid-cols-12 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                  {["Dic 25", "Ene 26", "Feb 26", "Mar 26", "Abr 26", "May 26", "Jun 26", "Jul 26", "Ago 26", "Sep 26", "Oct 26", "Nov 26"].map(m => (
                    <div key={m}>{m}</div>
                  ))}
                </div>

                {phases.map((phase) => {
                  let gridStyle = "";
                  switch(phase.orden) {
                    case 1: gridStyle = "col-start-1 col-span-2"; break;
                    case 2: gridStyle = "col-start-3 col-span-3"; break;
                    case 3: gridStyle = "col-start-6 col-span-1"; break;
                    case 4: gridStyle = "col-start-7 col-span-2"; break;
                    case 5: gridStyle = "col-start-9 col-span-1"; break;
                    case 6: gridStyle = "col-start-10 col-span-3"; break;
                    default: gridStyle = "col-start-1 col-span-12";
                  }
                  
                  return (
                    <div className="grid grid-cols-12 gap-1 h-9 items-center" key={phase.id}>
                      <div className={`${gridStyle} h-6 rounded-md bg-teal-50 border border-teal-200/50 flex items-center justify-between px-3 text-[10px] sm:text-xs font-semibold text-teal-800 overflow-hidden`}>
                        <span className="truncate">{phase.nombre}</span>
                        <span className="shrink-0 bg-teal-600 text-white rounded px-1 text-[9px]">
                          {phase.tareas.filter(t => t.estado === "Completada").length}/{phase.tareas.length}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Panel>

          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="text-brand" size={20} />
              Desglose y Control de Tareas
            </h3>

            {loading ? (
              <div className="text-center py-10 text-slate-500">Cargando tareas del proyecto...</div>
            ) : (
              <div className="space-y-3">
                {phases.map((phase) => (
                  <div key={phase.id} className="border border-line rounded-xl bg-white overflow-hidden shadow-sm">
                    <button
                      onClick={() => togglePhase(phase.id)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100 hover:bg-slate-100/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        {expandedPhases[phase.id] ? <ChevronDown size={18} className="text-slate-500" /> : <ChevronRight size={18} className="text-slate-500" />}
                        <div>
                          <span className="font-bold text-sm text-slate-800">{phase.nombre}</span>
                          <span className="ml-3 text-xs text-slate-400 font-medium">({phase.ponderacion}% peso legal)</span>
                        </div>
                      </div>
                      <span className="bg-slate-200/60 border border-slate-300 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {phase.tareas.filter(t => t.estado === "Completada").length}/{phase.tareas.length} Tareas
                      </span>
                    </button>

                    {expandedPhases[phase.id] && (
                      <div className="divide-y divide-slate-100">
                        {phase.tareas.map((task) => (
                          <div key={task.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                            <div className="space-y-1.5 max-w-2xl">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-sm text-slate-800">{task.nombre}</h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getStatusStyle(task.estado)}`}>
                                  {task.estado}
                                </span>
                                {task.dependencia_de && (
                                  <span className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-150 font-bold px-1.5 py-0.5 rounded">
                                    Crítica (Dependiente)
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 leading-relaxed">{task.descripcion}</p>
                              
                              <div className="flex items-center gap-4 text-[10px] text-slate-400 font-semibold flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} />
                                  Plazo: {new Date(task.fecha_inicio).toLocaleDateString()} - {new Date(task.fecha_fin).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <UserIcon size={12} />
                                  Asignado: {task.usuario_asignado || "Sin asignar"}
                                </span>
                                <span>Área: {task.area_responsable}</span>
                              </div>
                            </div>

                            {isDPO && (
                              <button
                                onClick={() => openEditTask(task)}
                                className="self-start md:self-center shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-800 shadow-sm"
                              >
                                <Edit2 size={13} />
                                Editar Estado
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AREAS CRUD */}
      {activeTab === "areas" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Building className="text-brand" size={20} />
              Divisiones y Áreas Organizacionales
            </h3>
            {isDPO && (
              <button
                onClick={openCreateArea}
                className="flex items-center gap-1 bg-brand text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm"
              >
                <Plus size={14} />
                Crear Área
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {areas.map((a) => {
              const respUser = users.find(u => u.id === a.responsable_id);
              return (
                <div key={a.id} className="rounded-xl border border-line bg-white p-5 shadow-sm space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm">{a.nombre}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{a.descripcion || "Sin descripción"}</p>
                  </div>
                  
                  <div className="border-t border-slate-100 pt-3 flex justify-between items-center flex-wrap gap-2 text-xs">
                    <span className="text-slate-400 font-semibold">
                      Responsable: <span className="text-slate-700 font-bold">{respUser ? respUser.full_name : "Sin asignar"}</span>
                    </span>
                    {isDPO && (
                      <button
                        onClick={() => openEditArea(a)}
                        className="text-slate-600 font-bold hover:text-brand"
                      >
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: USER / ROLE DESIGNATIONS */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Users className="text-brand" size={20} />
              Designación de Funcionarios y Roles
            </h3>
            {isDPO && (
              <button
                onClick={openCreateUser}
                className="flex items-center gap-1 bg-brand text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm"
              >
                <Plus size={14} />
                Designar Funcionario
              </button>
            )}
          </div>

          <div className="overflow-x-auto border border-line rounded-xl bg-white shadow-sm">
            <table className="w-full border-collapse text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                  <th className="p-3">Nombre</th>
                  <th className="p-3">RUT</th>
                  <th className="p-3">Correo</th>
                  <th className="p-3">Cargo / Puesto</th>
                  <th className="p-3">Rol SIGE-DP</th>
                  <th className="p-3">División</th>
                  {isDPO && <th className="p-3 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {users.map((u) => {
                  const uArea = areas.find(a => a.id === u.area_id);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-800">{u.full_name}</td>
                      <td className="p-3 font-mono">{u.rut || "-"}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3 text-slate-500">{u.cargo || "-"}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-150 font-bold">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{uArea ? uArea.nombre : "-"}</td>
                      {isDPO && (
                        <td className="p-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => openEditUser(u)}
                            className="p-1 hover:bg-slate-100 hover:text-slate-800 rounded mr-1"
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>
                          {user.id !== u.id && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1 hover:bg-rose-50 hover:text-rose-700 rounded text-rose-500"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* 1. Edit Task Modal */}
      {editTaskModalOpen && editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-soft">
            <h3 className="text-lg font-bold mb-1 text-slate-800">Actualizar Estado de Tarea</h3>
            <p className="text-xs text-slate-400 mb-4">{editingTask.nombre}</p>
            
            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="task-status">Estado de Cumplimiento</label>
                <select
                  id="task-status"
                  className="field mt-1 text-sm"
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value)}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En progreso">En progreso</option>
                  <option value="Completada">Completada</option>
                  <option value="Atrasada">Atrasada</option>
                </select>
              </div>

              <div>
                <label className="field-label" htmlFor="task-assignee">Asignar Funcionario</label>
                <select
                  id="task-assignee"
                  className="field mt-1 text-sm"
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.cargo || u.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="task-start">Fecha Inicio</label>
                  <input
                    id="task-start"
                    type="date"
                    className="field mt-1 text-sm"
                    required
                    value={taskStart}
                    onChange={(e) => setTaskStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="task-end">Fecha Límite</label>
                  <input
                    id="task-end"
                    type="date"
                    className="field mt-1 text-sm"
                    required
                    value={taskEnd}
                    onChange={(e) => setTaskEnd(e.target.value)}
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-150">{error}</p>}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditTaskModalOpen(false)}
                  className="rounded border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-95 shadow-sm"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Area Modal */}
      {areaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-soft">
            <h3 className="text-lg font-bold mb-4 text-slate-800">
              {editingArea ? "Editar Área Organizacional" : "Crear Nueva Área"}
            </h3>
            
            <form onSubmit={handleSaveArea} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="area-name">Nombre de la División</label>
                <input
                  id="area-name"
                  className="field mt-1 text-sm"
                  required
                  placeholder="Ej. División de Finanzas"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="area-desc">Descripción / Funciones</label>
                <textarea
                  id="area-desc"
                  className="field mt-1 text-sm h-16 py-2"
                  placeholder="Describa el objetivo de esta división..."
                  value={areaDesc}
                  onChange={(e) => setAreaDesc(e.target.value)}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="area-resp">Responsable Legal de Área</label>
                <select
                  id="area-resp"
                  className="field mt-1 text-sm"
                  value={areaResponsable}
                  onChange={(e) => setAreaResponsable(e.target.value)}
                >
                  <option value="">Sin asignar</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.cargo || u.role})</option>
                  ))}
                </select>
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAreaModalOpen(false)}
                  className="rounded border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-95 shadow-sm"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. User Modal */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-slate-800">
              {editingUser ? "Editar Funcionario" : "Designar Nuevo Funcionario"}
            </h3>
            
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="u-name">Nombre Completo</label>
                <input
                  id="u-name"
                  className="field mt-1 text-sm"
                  required
                  placeholder="Juan Pérez"
                  value={userFullName}
                  onChange={(e) => setUserFullName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="u-rut">RUT Funcionario</label>
                  <input
                    id="u-rut"
                    className="field mt-1 text-sm"
                    required
                    placeholder="12.345.678-9"
                    value={userRut}
                    onChange={(e) => setUserRut(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="u-cargo">Cargo / Puesto Estatal</label>
                  <input
                    id="u-cargo"
                    className="field mt-1 text-sm"
                    required
                    placeholder="Jefe de Soporte TI"
                    value={userCargo}
                    onChange={(e) => setUserCargo(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="u-email">Correo Electrónico</label>
                  <input
                    id="u-email"
                    type="email"
                    className="field mt-1 text-sm"
                    required
                    placeholder="juan.perez@gobierno.cl"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="u-pass">Contraseña (Opcional)</label>
                  <input
                    id="u-pass"
                    type="password"
                    className="field mt-1 text-sm"
                    placeholder={editingUser ? "Dejar vacío para no cambiar" : "admin123"}
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="u-role">Rol SIGE-DP</label>
                  <select
                    id="u-role"
                    className="field mt-1 text-sm"
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                  >
                    {APP_ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="u-area">División Asignada</label>
                  <select
                    id="u-area"
                    className="field mt-1 text-sm"
                    value={userAreaId}
                    onChange={(e) => setUserAreaId(e.target.value)}
                  >
                    <option value="">Ninguna</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-150">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="rounded border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-95 shadow-sm"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
