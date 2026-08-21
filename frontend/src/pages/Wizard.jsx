import React, { useState, useEffect } from "react";
import { ClipboardList, Plus, Trash2, Edit3, ArrowRight, Share2, HelpCircle } from "lucide-react";
import { Panel } from "../components/Panel";
import { api } from "../lib/api";

const BASE_LEGAL_OPTIONS = [
  "Consentimiento del titular",
  "Obligación legal / Mandato legal",
  "Ejecución contractual",
  "Interés legítimo del responsable",
  "Funciones propias de la Administración del Estado"
];

export function Wizard({ myMatrix, masterMatrix, areas, user, token, onReload }) {
  const [selectedAreaId, setSelectedAreaId] = useState(user.area_id || (areas[0] ? areas[0].id : null));
  const [treatments, setTreatments] = useState([]);
  const [completada, setCompletada] = useState(false);
  const [activeTab, setActiveTab] = useState("list"); // 'list' or 'form'
  const [editingIndex, setEditingIndex] = useState(null);

  // Form states for the 14-field survey
  const [proceso, setProceso] = useState("");
  const [tipoDatos, setTipoDatos] = useState("");
  const [datosSensibles, setDatosSensibles] = useState("No");
  const [finalidad, setFinalidad] = useState("");
  const [baseLegal, setBaseLegal] = useState(BASE_LEGAL_OPTIONS[4]);
  const [origen, setOrigen] = useState("");
  const [almacenamiento, setAlmacenamiento] = useState("");
  const [acceso, setAcceso] = useState("");
  const [transInter, setTransInter] = useState("No");
  const [encargado, setEncargado] = useState("");
  const [medidasSeguridad, setMedidasSeguridad] = useState("");
  const [plazoConservacion, setPlazoConservacion] = useState("");
  const [usoIa, setUsoIa] = useState("No");
  const [volumen, setVolumen] = useState("");

  // Visual Node Map local states (Origin -> Process -> Storage -> Destination)
  const [nodeOrigin, setNodeOrigin] = useState("Formulario Web");
  const [nodeProcess, setNodeProcess] = useState("Registro de Solicitud");
  const [nodeStorage, setNodeStorage] = useState("Base de Datos Local");
  const [nodeDest, setNodeDest] = useState("Sin transferencia externa");
  const [showNodeMap, setShowNodeMap] = useState(false);

  const isDPO = user.role === "Encargado/a Responsable" || user.role === "Administrador";
  
  // Load treatments for selected area
  useEffect(() => {
    if (isDPO) {
      // Find the matrix for the selected area from master
      const matrixForArea = masterMatrix.filter(m => m.id !== undefined); 
      // Fetch specifically or filter masterMatrix
      const areaMatrix = masterMatrix.filter(item => {
        // Find by area name match or fetch myMatrix if active is user area
        const selectedAreaObj = areas.find(a => a.id === selectedAreaId);
        return selectedAreaObj ? item.area === selectedAreaObj.nombre : false;
      });
      
      // Map back to structured formats
      if (areaMatrix.length > 0) {
        setTreatments(areaMatrix.map(m => ({
          proceso: m.proceso,
          tipo_datos: m.tipo_datos,
          datos_sensibles: m.datos_sensibles,
          finalidad: m.finalidad,
          base_legal: m.base_legal,
          origen: m.origen,
          almacenamiento: m.almacenamiento,
          acceso: m.acceso,
          transferencia_internacional: m.transferencia_internacional,
          encargado: m.encargado,
          medidas_seguridad: m.medidas_seguridad,
          plazo_conservacion: m.plazo_conservacion,
          uso_ia: m.uso_ia,
          volumen: m.volumen
        })));
        setCompletada(true);
      } else {
        setTreatments([]);
        setCompletada(false);
      }
    } else {
      // Load current user's area matrix
      if (myMatrix.length > 0) {
        setTreatments(myMatrix[0].datos_json || []);
        setCompletada(myMatrix[0].completada || false);
      } else {
        setTreatments([]);
        setCompletada(false);
      }
    }
  }, [selectedAreaId, myMatrix, masterMatrix, areas, isDPO]);

  // Sync Visual Map nodes with Form Inputs
  useEffect(() => {
    if (showNodeMap) {
      setOrigen(nodeOrigin);
      setProceso(nodeProcess);
      setAlmacenamiento(nodeStorage);
      setTransInter(nodeDest === "Sin transferencia externa" ? "No" : "Sí");
      setEncargado(nodeDest === "Sin transferencia externa" ? "Interno" : nodeDest);
    }
  }, [nodeOrigin, nodeProcess, nodeStorage, nodeDest, showNodeMap]);

  function openCreate() {
    setEditingIndex(null);
    setProceso("");
    setTipoDatos("");
    setDatosSensibles("No");
    setFinalidad("");
    setBaseLegal(BASE_LEGAL_OPTIONS[4]);
    setOrigen("Formulario Web");
    setAlmacenamiento("Base de Datos Local");
    setAcceso("Funcionarios del departamento");
    setTransInter("No");
    setEncargado("Interno");
    setMedidasSeguridad("Control de credenciales");
    setPlazoConservacion("5 años");
    setUsoIa("No");
    setVolumen("1,000 registros");
    
    // Init flow node states
    setNodeOrigin("Formulario Web");
    setNodeProcess("Registro de Trámite");
    setNodeStorage("Base de Datos Local");
    setNodeDest("Sin transferencia externa");
    setShowNodeMap(false);
    
    setActiveTab("form");
  }

  function openEdit(index) {
    const t = treatments[index];
    setEditingIndex(index);
    setProceso(t.proceso);
    setTipoDatos(t.tipo_datos);
    setDatosSensibles(t.datos_sensibles);
    setFinalidad(t.finalidad);
    setBaseLegal(t.base_legal);
    setOrigen(t.origen);
    setAlmacenamiento(t.almacenamiento);
    setAcceso(t.acceso);
    setTransInter(t.transferencia_internacional);
    setEncargado(t.encargado);
    setMedidasSeguridad(t.medidas_seguridad);
    setPlazoConservacion(t.plazo_conservacion);
    setUsoIa(t.uso_ia);
    setVolumen(t.volumen);

    // Sync flow node states
    setNodeOrigin(t.origen || "Formulario Web");
    setNodeProcess(t.proceso || "Registro de Trámite");
    setNodeStorage(t.almacenamiento || "Base de Datos Local");
    setNodeDest(t.transferencia_internacional === "Sí" ? (t.encargado || "Proveedor Nube") : "Sin transferencia externa");
    setShowNodeMap(false);

    setActiveTab("form");
  }

  function handleDelete(index) {
    if (!confirm("¿Está seguro de eliminar esta actividad de tratamiento?")) return;
    const next = [...treatments];
    next.splice(index, 1);
    setTreatments(next);
    saveMatrix(next, completada);
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    
    const item = {
      proceso,
      tipo_datos: tipoDatos,
      datos_sensibles: datosSensibles,
      finalidad,
      base_legal: baseLegal,
      origen,
      almacenamiento,
      acceso,
      transferencia_internacional: transInter,
      encargado,
      medidas_seguridad: medidasSeguridad,
      plazo_conservacion: plazoConservacion,
      uso_ia: usoIa,
      volumen
    };

    const next = [...treatments];
    if (editingIndex !== null) {
      next[editingIndex] = item;
    } else {
      next.push(item);
    }

    setTreatments(next);
    setActiveTab("list");
    saveMatrix(next, completada);
  }

  async function saveMatrix(updatedTreatments, isComplete) {
    try {
      // DPO can edit any matrix, responsibles only their own
      const targetAreaId = isDPO ? selectedAreaId : user.area_id;
      if (!targetAreaId) return;

      await api("/matrix", token, {
        method: "POST",
        body: JSON.stringify({
          treatments: updatedTreatments,
          completada: isComplete
        })
      });
      
      if (onReload) onReload();
    } catch (err) {
      alert("Error al guardar matriz: " + err.message);
    }
  }

  function toggleComplete() {
    const nextVal = !completada;
    setCompletada(nextVal);
    saveMatrix(treatments, nextVal);
  }

  const selectedAreaObj = areas.find(a => a.id === selectedAreaId);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Area Selector for DPO */}
      {isDPO && (
        <div className="rounded-xl border border-line bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Monitoreo de Matrices por División</h3>
            <p className="text-xs text-slate-500 mt-0.5">Permisos DPO: Revisa y valida la recopilación de datos de cada área.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="field text-sm h-9 min-h-0 py-0"
              value={selectedAreaId || ""}
              onChange={(e) => setSelectedAreaId(parseInt(e.target.value))}
            >
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main Panel */}
      <Panel
        title={`Matriz de Levantamiento - ${selectedAreaObj ? selectedAreaObj.nombre : "Mi División"}`}
        icon={ClipboardList}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("list")}
                className={`px-3 py-1.5 rounded text-xs font-semibold border ${activeTab === "list" ? "bg-slate-100 border-slate-300 text-slate-800" : "bg-white border-slate-200 text-slate-500"}`}
              >
                Lista de Tratamientos ({treatments.length})
              </button>
              <button
                onClick={() => setActiveTab("lifecycle")}
                className={`px-3 py-1.5 rounded text-xs font-semibold border ${activeTab === "lifecycle" ? "bg-teal-50 border-teal-300 text-teal-900" : "bg-white border-slate-200 text-slate-500"}`}
              >
                Ciclo de Vida & Flujo del Dato
              </button>
              {activeTab === "form" && (
                <span className="px-3 py-1.5 rounded text-xs font-semibold bg-brand/5 border border-brand/20 text-brand">
                  {editingIndex !== null ? "Editando Tratamiento" : "Nueva Encuesta"}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleComplete}
                className={`px-3 py-1.5 rounded text-xs font-bold border transition-colors ${completada ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100"}`}
              >
                {completada ? "✓ Matriz Finalizada" : "Marcar como Finalizada"}
              </button>
              
              {activeTab === "list" && (
                <button
                  onClick={openCreate}
                  className="flex items-center gap-1.5 rounded bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-opacity-95 shadow-sm"
                >
                  <Plus size={14} />
                  Añadir Tratamiento
                </button>
              )}
            </div>
          </div>

          {activeTab === "list" ? (
            /* TREATMENTS LIST TAB */
            <div className="overflow-x-auto">
              {treatments.length > 0 ? (
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-line bg-slate-50 font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-3">Proceso</th>
                      <th className="p-3">Datos Tratados</th>
                      <th className="p-3">Sensibles</th>
                      <th className="p-3">Base Legal</th>
                      <th className="p-3">Medidas Seguridad</th>
                      <th className="p-3">Volumen</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {treatments.map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-800">{t.proceso}</td>
                        <td className="p-3 text-slate-600 max-w-xs truncate" title={t.tipo_datos}>{t.tipo_datos}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded font-bold ${t.datos_sensibles === "Sí" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-slate-100 text-slate-600"}`}>
                            {t.datos_sensibles}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 max-w-xs truncate" title={t.base_legal}>{t.base_legal}</td>
                        <td className="p-3 text-slate-500 max-w-xs truncate" title={t.medidas_seguridad}>{t.medidas_seguridad}</td>
                        <td className="p-3 text-slate-600">{t.volumen}</td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => openEdit(idx)}
                            className="p-1 text-slate-500 hover:text-brand hover:bg-slate-100 rounded inline-block mr-1"
                            title="Editar"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(idx)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded inline-block"
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <ClipboardList size={40} className="mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-sm">No se han registrado actividades de tratamiento</p>
                  <p className="text-xs mt-1">Haz clic en "Añadir Tratamiento" para rellenar la encuesta interactiva.</p>
                </div>
              )}
            </div>
          ) : activeTab === "lifecycle" ? (
            /* DATA LIFECYCLE PIPELINE VIEW */
            <div className="space-y-6">
              <div className="border-b border-slate-150 pb-3">
                <span className="text-[10px] uppercase font-bold text-teal-600 tracking-wider">Trazabilidad de Extremo a Extremo</span>
                <h3 className="text-sm font-bold text-slate-800">Ciclo de Vida de los Datos Personales (Art. 13 a 28 Ley N° 21.719)</h3>
                <p className="text-xs text-slate-400">Visualización de las 5 etapas operacionales por las que transita la información ciudadana e institucional.</p>
              </div>

              {/* 5 Stages Grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  {
                    step: "1. Captura & Origen",
                    color: "border-sky-300 bg-sky-50/50 text-sky-900",
                    badge: "Formularios / ClaveÚnica",
                    desc: "Recolección con deber de información (Art. 14). Consentimiento explícito o mandato legal."
                  },
                  {
                    step: "2. Almacenamiento",
                    color: "border-indigo-300 bg-indigo-50/50 text-indigo-900",
                    badge: "PostgreSQL AES-256",
                    desc: "Cifrado en reposo y en tránsito. Aislamiento lógico y control de accesos MFA."
                  },
                  {
                    step: "3. Tratamiento / Uso",
                    color: "border-teal-300 bg-teal-50/50 text-teal-900",
                    badge: "Base Legal RAT (Art. 15)",
                    desc: "Procesamiento estricto conforme a la finalidad declarada. Prohibición de desvío de fines."
                  },
                  {
                    step: "4. Encargados / Nube",
                    color: "border-amber-300 bg-amber-50/50 text-amber-900",
                    badge: "Contratos DPA (Art. 16)",
                    desc: "Proveedores regulados con SLA de notificación <24h y servidores en países adecuados."
                  },
                  {
                    step: "5. Supresión / Archivo",
                    color: "border-rose-300 bg-rose-50/50 text-rose-900",
                    badge: "Anonimización Presidio",
                    desc: "Destrucción segura certificada al vencer el plazo de conservación o anonimización irreversible."
                  }
                ].map((s, i) => (
                  <div key={i} className={`p-3.5 rounded-xl border ${s.color} space-y-2 flex flex-col justify-between`}>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider block">{s.step}</span>
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 shadow-2xs font-mono">
                        {s.badge}
                      </span>
                      <p className="text-[11px] leading-relaxed pt-1 text-slate-700">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Treatments mapping in lifecycle */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Actividades de Tratamiento Mapeadas ({treatments.length})</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {treatments.map((t, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h5 className="font-bold text-xs text-slate-800">{t.proceso}</h5>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${t.datos_sensibles === "Sí" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-teal-50 text-teal-800 border border-teal-200"}`}>
                          {t.datos_sensibles === "Sí" ? "Datos Sensibles" : "Datos Generales"}
                        </span>
                      </div>

                      <div className="grid gap-2 grid-cols-2 text-[11px] p-2 bg-slate-50 rounded-lg border border-slate-150">
                        <div>
                          <span className="text-slate-400 font-bold block">Base Legal:</span>
                          <span className="text-slate-700 font-medium truncate block">{t.base_legal}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block">Conservación:</span>
                          <span className="text-slate-700 font-medium">{t.plazo_conservacion || "5 años"}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 truncate" title={t.tipo_datos}>
                        <strong>Datos:</strong> {t.tipo_datos}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* SURVEY FORM WITH INTEGRATED VISUAL FLOW MAP */
            <form onSubmit={handleFormSubmit} className="space-y-6">
              
              {/* Form Navigation Tab (Form vs Node Map) */}
              <div className="border-b border-slate-150 pb-2 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowNodeMap(false)}
                  className={`text-xs font-bold pb-2 border-b-2 transition-all ${!showNodeMap ? "border-brand text-brand" : "border-transparent text-slate-400"}`}
                >
                  1. Formulario de Preguntas
                </button>
                <button
                  type="button"
                  onClick={() => setShowNodeMap(true)}
                  className={`text-xs font-bold pb-2 border-b-2 transition-all flex items-center gap-1.5 ${showNodeMap ? "border-brand text-brand" : "border-transparent text-slate-400"}`}
                >
                  <Share2 size={14} />
                  2. Mapa de Flujo Visual (SVG)
                </button>
              </div>

              {!showNodeMap ? (
                /* SURVEY STANDARD FORM FIELDS */
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <label className="field-label" htmlFor="w-proceso">1. Nombre del Proceso Administrativo</label>
                      <input
                        id="w-proceso"
                        className="field mt-1 text-sm"
                        required
                        placeholder="Ej. Registro Social de Hogares, Pago de Patentes"
                        value={proceso}
                        onChange={(e) => setProceso(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="w-tipodatos">2. Categorías de Datos Personales Tratados</label>
                      <input
                        id="w-tipodatos"
                        className="field mt-1 text-sm"
                        required
                        placeholder="Ej. RUT, Nombre completo, Correo electrónico"
                        value={tipoDatos}
                        onChange={(e) => setTipoDatos(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="w-sensibles">3. ¿Trata Datos Sensibles? (Salud, etnia, filiación, etc.)</label>
                      <select
                        id="w-sensibles"
                        className="field mt-1 text-sm"
                        value={datosSensibles}
                        onChange={(e) => setDatosSensibles(e.target.value)}
                      >
                        <option value="No">No trata datos sensibles</option>
                        <option value="Sí">Sí, trata datos de carácter sensible</option>
                      </select>
                    </div>
                    <div>
                      <label className="field-label" htmlFor="w-finalidad">4. Finalidad específica del Tratamiento</label>
                      <textarea
                        id="w-finalidad"
                        className="field mt-1 text-sm h-16 py-2"
                        required
                        placeholder="Describa para qué fines específicos se recopila esta información..."
                        value={finalidad}
                        onChange={(e) => setFinalidad(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="w-baselegal">5. Base de Licitud Legal</label>
                      <select
                        id="w-baselegal"
                        className="field mt-1 text-sm"
                        value={baseLegal}
                        onChange={(e) => setBaseLegal(e.target.value)}
                      >
                        {BASE_LEGAL_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="field-label" htmlFor="w-origen">6. Origen de los Datos</label>
                        <input
                          id="w-origen"
                          className="field mt-1 text-sm"
                          required
                          placeholder="Formulario Web"
                          value={origen}
                          onChange={(e) => setOrigen(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="field-label" htmlFor="w-almacenamiento">7. Almacenamiento físico/lógico</label>
                        <input
                          id="w-almacenamiento"
                          className="field mt-1 text-sm"
                          required
                          placeholder="Base de datos local"
                          value={almacenamiento}
                          onChange={(e) => setAlmacenamiento(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="field-label" htmlFor="w-trans">9. Transferencia Internacional</label>
                        <select
                          id="w-trans"
                          className="field mt-1 text-sm"
                          value={transInter}
                          onChange={(e) => setTransInter(e.target.value)}
                        >
                          <option value="No">No</option>
                          <option value="Sí">Sí (Transferencia a servidores externos)</option>
                        </select>
                      </div>
                      <div>
                        <label className="field-label" htmlFor="w-encargado">10. Tercero/Encargado</label>
                        <input
                          id="w-encargado"
                          className="field mt-1 text-sm"
                          placeholder="Ej. AWS, Interno"
                          value={encargado}
                          onChange={(e) => setEncargado(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="field-label" htmlFor="w-acceso">8. Acceso y Perfiles de Usuarios</label>
                      <input
                        id="w-acceso"
                        className="field mt-1 text-sm"
                        placeholder="Ej. Solo analistas de división"
                        value={acceso}
                        onChange={(e) => setAcceso(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="field-label" htmlFor="w-plazo">12. Plazo de Conservación</label>
                        <input
                          id="w-plazo"
                          className="field mt-1 text-sm"
                          placeholder="5 años"
                          value={plazoConservacion}
                          onChange={(e) => setPlazoConservacion(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="field-label" htmlFor="w-vol">14. Volumen estimado</label>
                        <input
                          id="w-vol"
                          className="field mt-1 text-sm"
                          placeholder="10,000 registros"
                          value={volumen}
                          onChange={(e) => setVolumen(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="field-label" htmlFor="w-ia">13. ¿Usa Inteligencia Artificial?</label>
                        <select
                          id="w-ia"
                          className="field mt-1 text-sm"
                          value={usoIa}
                          onChange={(e) => setUsoIa(e.target.value)}
                        >
                          <option value="No">No</option>
                          <option value="Sí">Sí</option>
                        </select>
                      </div>
                      <div>
                        <label className="field-label" htmlFor="w-medidas">11. Medidas de Seguridad</label>
                        <input
                          id="w-medidas"
                          className="field mt-1 text-sm"
                          placeholder="Cifrado, Doble factor"
                          value={medidasSeguridad}
                          onChange={(e) => setMedidasSeguridad(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* INTERACTIVE SVG VISUAL FLOW MAP */
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
                    <HelpCircle className="mt-0.5 shrink-0" size={16} />
                    <div>
                      <p className="font-bold">Modelador de Nodos Visuales</p>
                      <p className="mt-0.5">Escribe dentro de los bloques para dibujar el flujo de datos. Tus cambios se guardarán automáticamente en los campos correspondientes de la encuesta.</p>
                    </div>
                  </div>

                  {/* SVG Canvas Board */}
                  <div className="border border-line bg-slate-900 rounded-xl p-6 relative overflow-x-auto min-h-[180px]">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                      {/* Connection Arrows between node blocks */}
                      <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="#0f766e" />
                        </marker>
                      </defs>
                    </svg>

                    <div className="relative z-10 flex items-center justify-between gap-6 min-w-[700px] py-4 px-2">
                      
                      {/* Node 1: Origen */}
                      <div className="w-40 bg-slate-800 border-2 border-teal-500 rounded-lg p-3 text-center text-white">
                        <span className="text-[9px] uppercase font-bold text-teal-400 tracking-wider">1. Origen de Datos</span>
                        <input
                          className="w-full text-xs font-semibold text-center bg-transparent border-b border-teal-600 focus:border-teal-400 mt-2 text-white outline-none"
                          value={nodeOrigin}
                          onChange={(e) => setNodeOrigin(e.target.value)}
                          placeholder="Formulario Web"
                        />
                      </div>

                      <ArrowRight className="text-teal-500 shrink-0 animate-pulse" size={24} />

                      {/* Node 2: Proceso */}
                      <div className="w-40 bg-slate-800 border-2 border-teal-500 rounded-lg p-3 text-center text-white">
                        <span className="text-[9px] uppercase font-bold text-teal-400 tracking-wider">2. Proceso</span>
                        <input
                          className="w-full text-xs font-semibold text-center bg-transparent border-b border-teal-600 focus:border-teal-400 mt-2 text-white outline-none"
                          value={nodeProcess}
                          onChange={(e) => setNodeProcess(e.target.value)}
                          placeholder="Registro de Usuario"
                        />
                      </div>

                      <ArrowRight className="text-teal-500 shrink-0 animate-pulse" size={24} />

                      {/* Node 3: Almacenamiento */}
                      <div className="w-40 bg-slate-800 border-2 border-teal-500 rounded-lg p-3 text-center text-white">
                        <span className="text-[9px] uppercase font-bold text-teal-400 tracking-wider">3. Almacenamiento</span>
                        <input
                          className="w-full text-xs font-semibold text-center bg-transparent border-b border-teal-600 focus:border-teal-400 mt-2 text-white outline-none"
                          value={nodeStorage}
                          onChange={(e) => setNodeStorage(e.target.value)}
                          placeholder="Base de datos local"
                        />
                      </div>

                      <ArrowRight className="text-teal-500 shrink-0 animate-pulse" size={24} />

                      {/* Node 4: Destinatario */}
                      <div className="w-40 bg-slate-800 border-2 border-teal-500 rounded-lg p-3 text-center text-white">
                        <span className="text-[9px] uppercase font-bold text-teal-400 tracking-wider">4. Destinatario / Nube</span>
                        <input
                          className="w-full text-xs font-semibold text-center bg-transparent border-b border-teal-600 focus:border-teal-400 mt-2 text-white outline-none"
                          value={nodeDest}
                          onChange={(e) => setNodeDest(e.target.value)}
                          placeholder="Sin transferencia externa"
                        />
                      </div>

                    </div>
                  </div>

                  <div className="text-xs text-slate-500 p-2 text-center">
                    Los valores especificados arriba alimentan los campos de origen, proceso, almacenamiento y transferencia internacional automáticamente.
                  </div>
                </div>
              )}

              {/* Form buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab("list")}
                  className="rounded border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-95 shadow-sm"
                >
                  {editingIndex !== null ? "Guardar Cambios" : "Agregar a la Matriz"}
                </button>
              </div>

            </form>
          )}

        </div>
      </Panel>

    </div>
  );
}
