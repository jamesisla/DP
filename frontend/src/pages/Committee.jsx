import React, { useState } from "react";
import { UsersRound, CheckCircle, MessageSquare, Download, ShieldAlert, Award } from "lucide-react";
import { Panel } from "../components/Panel";
import { api } from "../lib/api";

export function Committee({ documents, token, user, onReload }) {
  const [commentingId, setCommentingId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleApprove(id, currentStatus) {
    let confirmMsg = "";
    if (currentStatus === "borrador") confirmMsg = "¿Enviar este borrador a revisión del Comité Ejecutivo?";
    else if (currentStatus === "revision") confirmMsg = "¿Aprobar formalmente este documento y pasar a firma del Jefe?";
    else if (currentStatus === "aprobado") confirmMsg = "¿Proceder con la firma final y emisión oficial?";
    else return;

    if (!confirm(confirmMsg)) return;

    try {
      await api(`/documents/${id}/approve`, token, { method: "POST" });
      if (onReload) onReload();
      alert("Estado de aprobación actualizado.");
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  async function handleAddComment(e, docId) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await api(`/documents/${docId}/comments`, token, {
        method: "POST",
        body: JSON.stringify({ texto: commentText })
      });
      setCommentText("");
      setCommentingId(null);
      if (onReload) onReload();
    } catch (err) {
      alert("Error al enviar comentario: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function getDocumentLabel(tipo) {
    switch (tipo) {
      case "politica": return "Política de Privacidad";
      case "catalogo": return "Catálogo Nacional de Datos";
      case "anexo": return "Anexo de Contratos";
      default: return "Protocolo de Seguridad";
    }
  }

  function getStateBadgeStyle(estado) {
    switch (estado) {
      case "firmado": return "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold";
      case "aprobado": return "bg-teal-100 text-teal-800 border-teal-300 font-bold";
      case "revision": return "bg-amber-100 text-amber-800 border-amber-300 font-bold";
      default: return "bg-slate-100 text-slate-600 border-slate-300 font-bold";
    }
  }

  function getApproveBtnText(estado) {
    switch (estado) {
      case "borrador": return "Enviar a Comité";
      case "revision": return "Aprobar Documento";
      case "aprobado": return "Firmar / Emitir";
      default: return "Firmado / Publicado";
    }
  }

  const isCommitteeOrDPO = user.role === "Comité Ejecutivo" || user.role === "Encargado/a Responsable" || user.role === "Administrador";

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Committee header */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm space-y-2">
        <span className="text-xs uppercase font-bold text-teal-600 tracking-wider">Módulo de Gobierno Colectivo</span>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <UsersRound className="text-brand animate-pulse" size={24} />
          Comité Ejecutivo de Protección de Datos
        </h2>
        <p className="text-xs text-slate-400">
          Espacio colaborativo integrado por TI, Legal y Control de Gestión para el debate, observaciones y aprobaciones formales de los entregables del proyecto.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        
        {/* Left Panel: Committee Status & Tasks */}
        <div className="space-y-6">
          
          <Panel title="Constitución del Comité" icon={Award}>
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-700">Estado de Constitución:</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">Consolidador F3</span>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-slate-600 uppercase tracking-widest text-[9px]">Miembros Activos:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-500 font-medium">
                  <li>DPO Demo (Encargado)</li>
                  <li>Jefe de Servicio (Aprobador Final)</li>
                  <li>Responsable de TI (Comité)</li>
                  <li>Responsable Legal (Comité)</li>
                </ul>
              </div>
              <p className="text-slate-400 mt-2 italic leading-relaxed">
                El quórum del Comité Ejecutivo es obligatorio para avanzar los entregables de las Fases 4, 5 y 6.
              </p>
            </div>
          </Panel>

          <div className="bg-amber-50 border border-amber-150 rounded-xl p-4 text-xs text-amber-800 flex gap-2">
            <ShieldAlert className="shrink-0 mt-0.5" size={16} />
            <div>
              <p className="font-bold">Regla de Cumplimiento</p>
              <p className="mt-1 leading-relaxed">
                Todas las actas de aprobación del Comité Ejecutivo son auditadas y se empaquetan en el ZIP final de evidencias para fiscalizaciones gubernamentales.
              </p>
            </div>
          </div>
          
        </div>

        {/* Right Panel: Active Documents under Review */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Borradores en Flujo de Aprobación</h3>

          <div className="space-y-4">
            {documents.map((doc) => (
              <div 
                key={doc.id}
                className="rounded-xl border border-line bg-white p-5 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                {/* Header of doc card */}
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{getDocumentLabel(doc.tipo)}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Versión {doc.version} · Actualizado: {new Date(doc.updated_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-[10px] uppercase px-2.5 py-0.5 rounded-full border ${getStateBadgeStyle(doc.estado)}`}>
                    {doc.estado}
                  </span>
                </div>

                {/* Document comments list summary */}
                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <MessageSquare size={12} />
                    Observaciones Registradas ({doc.comentarios.length})
                  </p>
                  
                  {doc.comentarios.length > 0 ? (
                    <div className="space-y-2 max-h-[140px] overflow-y-auto bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      {doc.comentarios.map((c) => (
                        <div key={c.id} className="text-xs">
                          <span className="font-bold text-slate-700">{c.usuario.full_name}:</span>{" "}
                          <span className="text-slate-600 font-medium">{c.texto}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No hay comentarios en este borrador.</p>
                  )}
                </div>

                {/* Actions row */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-100 flex-wrap gap-2">
                  
                  {isCommitteeOrDPO && doc.estado !== "firmado" ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(doc.id, doc.estado)}
                        className="inline-flex items-center gap-1 rounded bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-opacity-95 shadow-sm"
                      >
                        <CheckCircle size={13} />
                        {getApproveBtnText(doc.estado)}
                      </button>

                      <button
                        onClick={() => setCommentingId(commentingId === doc.id ? null : doc.id)}
                        className="inline-flex items-center gap-1 rounded border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-sm"
                      >
                        <MessageSquare size={13} />
                        Opinar
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 font-medium">Lectura / Firma finalizada</div>
                  )}

                  {/* Acta download if approved / signed */}
                  {(doc.estado === "aprobado" || doc.estado === "firmado") && (
                    <a
                      href={`${import.meta.env.VITE_API_URL.replace("/api", "")}/api/documents/${doc.id}/acta?token=${token}`}
                      download
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-800 shadow-sm"
                    >
                      <Download size={13} />
                      Descargar Acta de Firmas
                    </a>
                  )}

                </div>

                {/* Comment dialog */}
                {commentingId === doc.id && (
                  <form onSubmit={(e) => handleAddComment(e, doc.id)} className="space-y-2 pt-2 border-t border-slate-100 animate-fadeIn">
                    <textarea
                      className="w-full text-xs p-2 border border-slate-200 rounded focus:border-brand focus:ring-1 focus:ring-brand outline-none resize-none h-14"
                      placeholder="Escribe tu opinión técnica, observaciones o votación..."
                      required
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setCommentingId(null)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded bg-white"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-3 py-1 bg-slate-900 text-white rounded text-[11px] font-bold hover:bg-slate-800"
                      >
                        {submitting ? "Enviando..." : "Enviar Comentario"}
                      </button>
                    </div>
                  </form>
                )}

              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
