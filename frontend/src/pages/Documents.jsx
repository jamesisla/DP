import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Wand2, 
  Send, 
  MessageSquare, 
  CheckCircle, 
  ChevronRight, 
  HelpCircle, 
  Download, 
  Eye, 
  Edit3, 
  Columns, 
  Bold, 
  Heading1, 
  Heading2, 
  List, 
  Table, 
  ShieldCheck 
} from "lucide-react";
import { api, API_URL } from "../lib/api";

export function Documents({ documents = [], token, user, onReload }) {
  const [selectedDoc, setSelectedDoc] = useState(documents[0] || null);
  const [content, setContent] = useState("");
  const [commentText, setCommentText] = useState("");
  const [saving, setSaving] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [viewMode, setViewMode] = useState("split"); // 'split', 'editor', 'preview'

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
    if (!confirm("¿Deseas autocompletar este documento? Se inyectarán los datos consolidados de la Matriz de Levantamiento.")) return;
    
    setSaving(true);
    try {
      const updated = await api(`/documents/${selectedDoc.id}/autocomplete`, token, { method: "POST" });
      setSelectedDoc(updated);
      setContent(updated.contenido);
      if (onReload) onReload();
      alert("¡Autocompletado inteligente completado con éxito!");
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
    else if (selectedDoc.estado === "revision") confirmMsg = "¿Aprobar formalmente este documento y pasar a firma del Jefe de Servicio?";
    else if (selectedDoc.estado === "aprobado") confirmMsg = "¿Proceder con la firma digital y emisión oficial del documento?";
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

  // Insert token helper
  function insertToken(tokenTag) {
    setContent((prev) => prev + "\n" + tokenTag + "\n");
  }

  function insertFormatting(prefix, suffix = "") {
    setContent((prev) => prev + "\n" + prefix + "Texto de ejemplo" + suffix + "\n");
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

  // Simple Markdown renderer for preview
  function renderMarkdownPreview(md) {
    if (!md) return <p className="text-slate-400 italic">Borrador vacío.</p>;
    
    const lines = md.split("\n");
    return (
      <div className="space-y-3 text-slate-800 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith("# ")) return <h1 key={idx} className="text-lg font-black text-slate-900 border-b border-slate-200 pb-1 mt-4">{line.replace("# ", "")}</h1>;
          if (line.startsWith("## ")) return <h2 key={idx} className="text-sm font-bold text-teal-800 mt-3">{line.replace("## ", "")}</h2>;
          if (line.startsWith("### ")) return <h3 key={idx} className="text-xs font-bold text-slate-700 mt-2">{line.replace("### ", "")}</h3>;
          if (line.startsWith("- ")) return <li key={idx} className="ml-4 list-disc">{line.replace("- ", "")}</li>;
          if (line.startsWith("> ")) return <blockquote key={idx} className="border-l-4 border-teal-500 bg-teal-50/40 p-2 my-2 italic text-slate-700">{line.replace("> ", "")}</blockquote>;
          if (line.startsWith("|")) return <div key={idx} className="font-mono text-[11px] bg-slate-50 p-1 rounded border border-slate-200">{line}</div>;
          if (line.trim() === "---") return <hr key={idx} className="my-3 border-slate-200" />;
          if (!line.trim()) return <div key={idx} className="h-1.5" />;
          return <p key={idx}>{line}</p>;
        })}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      <div className="grid gap-6 lg:grid-cols-[260px_1fr_300px]">
        
        {/* Left column: List of documents */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Documentos y Plantillas</h3>
          
          <div className="space-y-2">
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all hover:bg-slate-50 ${selectedDoc?.id === doc.id ? "border-brand bg-teal-50/20 shadow-sm ring-1 ring-brand/30" : "border-slate-200 bg-white"}`}
              >
                <div className="min-w-0">
                  <p className="font-bold text-xs text-slate-800 truncate">{getDocumentLabel(doc.tipo)}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Versión {doc.version} · <span className="capitalize">{doc.estado}</span></p>
                </div>
                <ChevronRight size={14} className="text-slate-400 shrink-0" />
              </button>
            ))}
          </div>

          {/* Token helper card */}
          <div className="bg-teal-50/60 border border-teal-200 rounded-lg p-3 text-[11px] text-teal-900 space-y-2">
            <p className="font-bold flex items-center gap-1">
              <Wand2 size={13} className="text-brand" />
              Inserción de Marcadores:
            </p>
            <p className="text-[10px] text-slate-600">Haz clic para insertar tokens dinámicos en el cursor:</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { tag: "{{catalogo}}", label: "Catálogo (Tabla)" },
                { tag: "{{lista_datos_sensibles}}", label: "Datos Sensibles" },
                { tag: "{{finalidades}}", label: "Finalidades" },
                { tag: "{{medidas_seguridad}}", label: "Medidas Seguridad" }
              ].map(t => (
                <button
                  key={t.tag}
                  type="button"
                  onClick={() => insertToken(t.tag)}
                  className="bg-white border border-teal-300 hover:bg-teal-100/50 text-teal-800 text-[10px] font-mono px-2 py-0.5 rounded shadow-2xs font-semibold"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Web Privacy Policy Quick Download */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] space-y-2">
            <span className="font-bold text-slate-700 block">Instrumentos Mandatorios (Ley 21.719):</span>
            <p className="text-[10px] text-slate-500">Documentos rectores para la ciudadanía y auditorías de la Contraloría / DPO.</p>
            
            <a
              href={`${API_URL.replace("/api", "")}/api/documents/annual-privacy-plan?token=${token}`}
              download
              className="flex items-center justify-center gap-1.5 w-full bg-teal-800 hover:bg-teal-900 text-white font-bold text-[11px] py-1.5 rounded shadow-2xs transition-colors"
              title="Descargar Plan Anual Institucional de Protección de Datos Personales"
            >
              <Download size={12} />
              Plan Anual de Privacidad (MD)
            </a>

            <a
              href={`${API_URL.replace("/api", "")}/api/documents/web-privacy-policy?token=${token}`}
              download
              className="flex items-center justify-center gap-1.5 w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-[11px] py-1.5 rounded shadow-2xs transition-colors"
            >
              <Download size={12} className="text-teal-700" />
              Política de Privacidad Web (MD)
            </a>
          </div>
        </div>

        {/* Center column: Editor & Preview */}
        {selectedDoc ? (
          <div className="rounded-xl border border-line bg-white shadow-sm flex flex-col min-h-[550px]">
            
            {/* Editor Header */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50 rounded-t-xl">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-800 text-sm">{getDocumentLabel(selectedDoc.tipo)}</h3>
                  <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${getStateBadgeStyle(selectedDoc.estado)}`}>
                    {selectedDoc.estado}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Editor Inteligente Ley 21.719 · v{selectedDoc.version}</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* View Mode Toggle */}
                <div className="flex bg-slate-200/70 p-0.5 rounded-md border border-slate-300 text-xs">
                  <button
                    onClick={() => setViewMode("editor")}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${viewMode === "editor" ? "bg-white text-slate-800 shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Editor
                  </button>
                  <button
                    onClick={() => setViewMode("split")}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${viewMode === "split" ? "bg-white text-slate-800 shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Dividido
                  </button>
                  <button
                    onClick={() => setViewMode("preview")}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${viewMode === "preview" ? "bg-white text-slate-800 shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Vista Previa
                  </button>
                </div>

                <button
                  onClick={handleAutocomplete}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-brand/20 bg-brand/5 text-brand rounded text-xs font-bold hover:bg-brand/10 transition-colors shadow-2xs"
                  title="Inyectar datos consolidados de la matriz de levantamiento"
                >
                  <Wand2 size={13} />
                  Autocompletar
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1.5 border border-slate-200 bg-white text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>

                {selectedDoc.estado !== "firmado" && (
                  <button
                    onClick={handleApprove}
                    className="px-3 py-1.5 bg-brand text-white rounded text-xs font-bold hover:bg-opacity-95 transition-colors shadow-2xs flex items-center gap-1"
                  >
                    <CheckCircle size={13} />
                    {getApproveBtnText(selectedDoc.estado)}
                  </button>
                )}

                {(selectedDoc.estado === "aprobado" || selectedDoc.estado === "firmado") && (
                  <a
                    href={`${API_URL.replace("/api", "")}/api/documents/${selectedDoc.id}/acta?token=${token}`}
                    download
                    className="p-1.5 border border-slate-200 bg-white text-slate-600 rounded hover:bg-slate-50 shadow-2xs"
                    title="Descargar Acta de Aprobación"
                  >
                    <Download size={14} />
                  </a>
                )}
              </div>
            </div>

            {/* Quick Formatting Toolbar */}
            {viewMode !== "preview" && (
              <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/30 flex items-center gap-2 flex-wrap text-xs text-slate-600">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Formato:</span>
                <button type="button" onClick={() => insertFormatting("## ")} className="p-1 hover:bg-slate-200 rounded" title="Título H2"><Heading1 size={14} /></button>
                <button type="button" onClick={() => insertFormatting("### ")} className="p-1 hover:bg-slate-200 rounded" title="Subtítulo H3"><Heading2 size={14} /></button>
                <button type="button" onClick={() => insertFormatting("**", "**")} className="p-1 hover:bg-slate-200 rounded font-bold" title="Negrita"><Bold size={14} /></button>
                <button type="button" onClick={() => insertFormatting("- ")} className="p-1 hover:bg-slate-200 rounded" title="Lista"><List size={14} /></button>
                <button type="button" onClick={() => insertFormatting("> ")} className="p-1 hover:bg-slate-200 rounded italic" title="Cita Legal">Cita</button>
              </div>
            )}

            {/* Editor & Preview Workspace */}
            <div className="flex-1 p-4 grid gap-4 overflow-hidden" style={{ gridTemplateColumns: viewMode === "split" ? "1fr 1fr" : "1fr" }}>
              
              {/* Textarea Editor */}
              {viewMode !== "preview" && (
                <div className="relative flex flex-col h-full">
                  <textarea
                    className="w-full flex-1 min-h-[380px] p-3 text-slate-700 font-mono text-xs border border-slate-200 rounded-lg focus:border-brand focus:ring-1 focus:ring-brand outline-none resize-none leading-relaxed"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="# Escribe aquí el borrador en formato Markdown..."
                  />
                </div>
              )}

              {/* Formatted Preview Box */}
              {viewMode !== "editor" && (
                <div className="h-full min-h-[380px] p-4 bg-white border border-slate-200 rounded-lg overflow-y-auto shadow-2xs">
                  <div className="border-b border-teal-500 pb-2 mb-3 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Gobierno de Chile · SIGE-DP</p>
                      <p className="text-xs font-bold text-slate-800">{getDocumentLabel(selectedDoc.tipo)} (v{selectedDoc.version})</p>
                    </div>
                    <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded font-bold uppercase">{selectedDoc.estado}</span>
                  </div>
                  {renderMarkdownPreview(content)}
                </div>
              )}

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
        <div className="rounded-xl border border-line bg-white shadow-sm p-4 flex flex-col justify-between min-h-[550px]">
          
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <MessageSquare size={14} className="text-brand" />
              Observaciones del Comité ({selectedDoc?.comentarios?.length || 0})
            </h4>

            {selectedDoc ? (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {selectedDoc.comentarios && selectedDoc.comentarios.length > 0 ? (
                  selectedDoc.comentarios.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-50 rounded-lg border border-slate-150 space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                        <span>{c.usuario?.full_name || "Funcionario"}</span>
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
                placeholder="Escribe tu observación o sugerencia técnica..."
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
