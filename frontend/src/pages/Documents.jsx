import React, { useState, useEffect } from "react";
import { FileText, Wand2, Send, MessageSquare, CheckCircle, ChevronRight, HelpCircle, Download } from "lucide-react";
import { api } from "../lib/api";

export function Documents({ documents, token, user, onReload }) {
  const [selectedDoc, setSelectedDoc] = useState(documents[0] || null);
  const [content, setContent] = useState("");
  const [commentText, setCommentText] = useState("");
  const [saving, setSaving] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(false);

  // Sync editor content when selected document changes
  useEffect(() => {
    if (selectedDoc) {
      setContent(selectedDoc.contenido);
    }
  }, [selectedDoc]);

  async function reloadActiveDoc() {
    if (!selectedDoc) return;
    setLoadingDoc(true);
    try {
      const updated = await api(`/documents/${selectedDoc.id}`, token);
      setSelectedDoc(updated);
      setContent(updated.contenido);
    } catch (err) {
      console.error("Error al recargar documento:", err);
    } finally {
      setLoadingDoc(false);
    }
  }

  async function handleSave() {
    if (!selectedDoc) return;
    setSaving(true);
    try {
      const payload = {
        tipo: selectedDoc.tipo,
        contenido: content,
        version: selectedDoc.version,
        estado: selectedDoc.estado
      };
      const updated = await api(`/documents/${selectedDoc.id}`, token, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      setSelectedDoc(updated);
      if (onReload) onReload();
      alert("Borrador guardado con éxito.");
    } catch (err) {
      alert("Error al guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAutocomplete() {
    if (!selectedDoc) return;
    if (!confirm("¿Deseas autocompletar este documento? Se inyectarán los datos recopilados en la Matriz Maestra y sobrescribirá los marcadores {{variables}}.")) return;
    
    setSaving(true);
    try {
      const updated = await api(`/documents/${selectedDoc.id}/autocomplete`, token, { method: "POST" });
      setSelectedDoc(updated);
      setContent(updated.contenido);
      if (onReload) onReload();
      alert("¡Autocompletado inteligente finalizado al 70%!");
    } catch (err) {
      alert("Error al autocompletar: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!commentText.trim() || !selectedDoc) return;
    setCommenting(true);
    try {
      await api(`/documents/${selectedDoc.id}/comments`, token, {
        method: "POST",
        body: JSON.stringify({ texto: commentText })
      });
      setCommentText("");
      reloadActiveDoc();
      if (onReload) onReload();
    } catch (err) {
      alert("Error al enviar comentario: " + err.message);
    } finally {
      setCommenting(false);
    }
  }

  async function handleApprove() {
    if (!selectedDoc) return;
    let confirmMsg = "";
    if (selectedDoc.estado === "borrador") confirmMsg = "¿Enviar este borrador a revisión del Comité Ejecutivo?";
    else if (selectedDoc.estado === "revision") confirmMsg = "¿Aprobar formalmente este documento y pasar a firma del Jefe?";
    else if (selectedDoc.estado === "aprobado") confirmMsg = "¿Proceder con la firma final y emisión oficial?";
    else return;

    if (!confirm(confirmMsg)) return;

    try {
      const updated = await api(`/documents/${selectedDoc.id}/approve`, token, { method: "POST" });
      setSelectedDoc(updated);
      if (onReload) onReload();
      alert(`Estado del documento actualizado a: ${updated.estado.toUpperCase()}`);
    } catch (err) {
      alert("Error al actualizar flujo de aprobación: " + err.message);
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
      case "firmado": return "bg-emerald-500 text-white";
      case "aprobado": return "bg-teal-600 text-white";
      case "revision": return "bg-amber-500 text-white";
      default: return "bg-slate-500 text-white";
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

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      <div className="grid gap-6 lg:grid-cols-[250px_1fr_300px]">
        
        {/* Left column: List of documents */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Documentos</h3>
          
          <div className="space-y-2">
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all hover:bg-slate-50 ${selectedDoc?.id === doc.id ? "border-brand bg-teal-50/20 shadow-sm" : "border-slate-200 bg-white"}`}
              >
                <div className="min-w-0">
                  <p className="font-bold text-xs text-slate-800 truncate">{getDocumentLabel(doc.tipo)}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Versión {doc.version}</p>
                </div>
                <ChevronRight size={14} className="text-slate-400 shrink-0" />
              </button>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-150 rounded-lg p-3 text-[10px] sm:text-xs text-amber-800 space-y-1">
            <p className="font-bold flex items-center gap-1">
              <HelpCircle size={14} />
              Tokens de Autocompletado:
            </p>
            <p>Puedes usar marcadores en tus plantillas:</p>
            <ul className="list-disc list-inside mt-1 font-semibold text-slate-700">
              <li>{"{{lista_datos_sensibles}}"}</li>
              <li>{"{{finalidades}}"}</li>
              <li>{"{{medidas_seguridad}}"}</li>
              <li>{"{{catalogo}}"} (tabla)</li>
            </ul>
          </div>
        </div>

        {/* Center column: Editor space */}
        {selectedDoc ? (
          <div className="rounded-xl border border-line bg-white shadow-sm flex flex-col min-h-[500px]">
            
            {/* Editor Header */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 rounded-t-xl">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-800 text-sm">{getDocumentLabel(selectedDoc.tipo)}</h3>
                  <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${getStateBadgeStyle(selectedDoc.estado)}`}>
                    {selectedDoc.estado}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Editor de Plantilla Legislativa v{selectedDoc.version}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAutocomplete}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-brand/20 bg-brand/5 text-brand rounded text-xs font-bold hover:bg-brand/10 transition-colors shadow-sm"
                  title="Inyectar datos consolidados de la matriz"
                >
                  <Wand2 size={13} />
                  Autocompletar
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1.5 border border-slate-200 bg-white text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm"
                >
                  {saving ? "Guardando..." : "Guardar Borrador"}
                </button>

                {selectedDoc.estado !== "firmado" && (
                  <button
                    onClick={handleApprove}
                    className="px-3 py-1.5 bg-brand text-white rounded text-xs font-bold hover:bg-opacity-95 transition-colors shadow-sm flex items-center gap-1"
                  >
                    <CheckCircle size={13} />
                    {getApproveBtnText(selectedDoc.estado)}
                  </button>
                )}

                {/* Download Acta button if approved/signed */}
                {(selectedDoc.estado === "aprobado" || selectedDoc.estado === "firmado") && (
                  <a
                    href={`${import.meta.env.VITE_API_URL.replace("/api", "")}/api/documents/${selectedDoc.id}/acta?token=${token}`}
                    download
                    className="p-1.5 border border-slate-200 bg-white text-slate-600 rounded hover:bg-slate-50"
                    title="Descargar Acta de Aprobación"
                  >
                    <Download size={14} />
                  </a>
                )}
              </div>
            </div>

            {/* Editor Textarea */}
            <div className="flex-1 p-4 relative">
              {loadingDoc && (
                <div className="absolute inset-0 z-20 bg-white/70 flex items-center justify-center">
                  <div className="text-xs text-slate-500 font-bold">Cargando borrador...</div>
                </div>
              )}
              <textarea
                className="w-full h-full min-h-[380px] p-3 text-slate-700 font-mono text-xs border border-slate-200 rounded-lg focus:border-brand focus:ring-1 focus:ring-brand outline-none resize-none leading-relaxed"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="# Escribe aquí el borrador en formato Markdown..."
              />
            </div>
            
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-white shadow-sm flex items-center justify-center p-12 text-slate-400">
            <div className="text-center">
              <FileText className="mx-auto mb-2 opacity-40" size={36} />
              <p className="font-semibold text-sm">Selecciona un documento</p>
            </div>
          </div>
        )}

        {/* Right column: Comments thread sidebar */}
        <div className="rounded-xl border border-line bg-white shadow-sm p-4 flex flex-col justify-between min-h-[500px]">
          
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <MessageSquare size={14} className="text-brand" />
              Comentarios del Comité ({selectedDoc?.comentarios.length || 0})
            </h4>

            {selectedDoc ? (
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {selectedDoc.comentarios.length > 0 ? (
                  selectedDoc.comentarios.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-50 rounded-lg border border-slate-150 space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                        <span>{c.usuario.full_name}</span>
                        <span className="font-medium text-slate-400">{new Date(c.fecha).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                        {c.texto}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-[10px] text-slate-400">
                    No hay observaciones para este documento.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-[10px] text-slate-400">Selecciona un borrador.</div>
            )}
          </div>

          {/* Add comment form */}
          {selectedDoc && (
            <form onSubmit={handleAddComment} className="border-t border-slate-100 pt-3 mt-4 space-y-2">
              <textarea
                className="w-full text-xs p-2 border border-slate-200 rounded focus:border-brand focus:ring-1 focus:ring-brand outline-none resize-none h-16"
                placeholder="Escribe tu observación o duda..."
                required
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button
                type="submit"
                disabled={commenting || !commentText.trim()}
                className="w-full h-8 bg-slate-900 text-white rounded text-[11px] font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
              >
                <Send size={11} />
                {commenting ? "Enviando..." : "Comentar"}
              </button>
            </form>
          )}

        </div>

      </div>

    </div>
  );
}
