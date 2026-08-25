import React, { useState, useEffect } from "react";
import { 
  FileCode, 
  CheckCircle, 
  Download, 
  ChevronRight, 
  Edit3, 
  Save, 
  ShieldCheck 
} from "lucide-react";
import { api, API_URL } from "../../lib/api";

export function CyberPolicies({ policies = [], token, user, onReload }) {
  const [localPolicies, setLocalPolicies] = useState(policies);
  const [selectedPol, setSelectedPol] = useState(null);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState("split");

  useEffect(() => {
    if (policies && policies.length > 0) {
      setLocalPolicies(policies);
    } else if (token) {
      api("/cyber/policies", token).then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setLocalPolicies(data);
        }
      }).catch(console.error);
    }
  }, [policies, token]);

  useEffect(() => {
    if ((!selectedPol || !localPolicies.some(p => p.id === selectedPol.id)) && localPolicies && localPolicies.length > 0) {
      setSelectedPol(localPolicies[0]);
    }
  }, [localPolicies, selectedPol]);

  useEffect(() => {
    if (selectedPol) {
      setContent(selectedPol.contenido || "");
    }
  }, [selectedPol]);

  async function handleSave() {
    if (!selectedPol) return;
    setSaving(true);
    try {
      const payload = {
        tipo: selectedPol.tipo,
        titulo: selectedPol.titulo,
        contenido: content,
        version: selectedPol.version,
        estado: selectedPol.estado
      };

      const updated = await api(`/cyber/policies/${selectedPol.id}`, token, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      setSelectedPol(updated);
      setLocalPolicies(prev => prev.map(p => p.id === updated.id ? updated : p));
      if (onReload) onReload();
      alert("Política guardada con éxito.");
    } catch (err) {
      alert("Error al guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  function renderMarkdownPreview(md) {
    if (!md) return <p className="text-slate-400 italic">Borrador vacío.</p>;
    const lines = md.split("\n");
    return (
      <div className="space-y-3 text-slate-800 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith("# ")) return <h1 key={idx} className="text-lg font-black text-slate-900 border-b border-slate-200 pb-1 mt-4">{line.replace("# ", "")}</h1>;
          if (line.startsWith("## ")) return <h2 key={idx} className="text-sm font-bold text-indigo-800 mt-3">{line.replace("## ", "")}</h2>;
          if (line.startsWith("### ")) return <h3 key={idx} className="text-xs font-bold text-slate-700 mt-2">{line.replace("### ", "")}</h3>;
          if (line.startsWith("- ")) return <li key={idx} className="ml-4 list-disc">{line.replace("- ", "")}</li>;
          if (line.startsWith("> ")) return <blockquote key={idx} className="border-l-4 border-indigo-500 bg-indigo-50/40 p-2 my-2 italic text-slate-700">{line.replace("> ", "")}</blockquote>;
          if (line.trim() === "---") return <hr key={idx} className="my-3 border-slate-200" />;
          if (!line.trim()) return <div key={idx} className="h-1.5" />;
          return <p key={idx}>{line}</p>;
        })}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
            <FileCode size={26} />
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-indigo-600 tracking-wider">Gobernanza y Planes Obligatorios</span>
            <h2 className="text-xl font-bold text-slate-800 mt-0.5">Políticas de Seguridad & Plan de Respuesta a Incidentes (PRI)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Instrumentos normativos exigidos por el Art. 10 de la Ley 21.663 para organismos y prestadores de servicios esenciales.
            </p>
          </div>
        </div>

        <a
          href={`${API_URL.replace("/api", "")}/api/cyber/procurement-security-clauses?token=${token}`}
          download
          className="flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-900 hover:bg-indigo-100 shadow-2xs transition-colors shrink-0"
          title="Descargar Pliego y Cláusulas Tipo de Ciberseguridad para Bases de Licitación en Mercado Público / ChileCompra"
        >
          <span>📋 Pliego ChileCompra Ciberseguridad (MD)</span>
        </a>
      </div>

      {/* Grid: Policies List (Left) & Editor (Right) */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        
        {/* Left Column: Policies Selector */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Instrumentos Normativos</h3>

          <div className="space-y-2">
            {localPolicies.map((pol) => (
              <button
                key={pol.id}
                onClick={() => setSelectedPol(pol)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${selectedPol?.id === pol.id ? "border-indigo-600 bg-indigo-50/20 shadow-sm ring-1 ring-indigo-600/30" : "border-slate-200 bg-white hover:bg-slate-50"}`}
              >
                <div className="min-w-0">
                  <p className="font-bold text-xs text-slate-800 truncate">{pol.titulo}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">v{pol.version} · <span className="capitalize">{pol.estado}</span></p>
                </div>
                <ChevronRight size={14} className="text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Editor & Preview */}
        {selectedPol ? (
          <div className="rounded-xl border border-line bg-white shadow-sm flex flex-col min-h-[550px]">
            
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50 rounded-t-xl">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">{selectedPol.titulo}</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Editor Ley 21.663 · Versión {selectedPol.version}</p>
              </div>

              <div className="flex items-center gap-2">
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
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 shadow-2xs"
                >
                  <Save size={13} />
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 grid gap-4 overflow-hidden" style={{ gridTemplateColumns: viewMode === "split" ? "1fr 1fr" : "1fr" }}>
              {viewMode !== "preview" && (
                <textarea
                  className="w-full flex-1 min-h-[380px] p-3 text-slate-700 font-mono text-xs border border-slate-200 rounded-lg focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none resize-none leading-relaxed"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="# Escribe aquí el borrador de la política..."
                />
              )}

              {viewMode !== "editor" && (
                <div className="h-full min-h-[380px] p-4 bg-white border border-slate-200 rounded-lg overflow-y-auto shadow-2xs">
                  <div className="border-b border-indigo-500 pb-2 mb-3 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Gobierno de Chile · Ley 21.663</p>
                      <p className="text-xs font-bold text-slate-800">{selectedPol.titulo}</p>
                    </div>
                    <span className="text-[9px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase">{selectedPol.estado}</span>
                  </div>
                  {renderMarkdownPreview(content)}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="rounded-xl border border-line bg-white p-12 text-center text-slate-400">
            <FileCode size={36} className="mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-sm">Cargando políticas...</p>
          </div>
        )}

      </div>

    </div>
  );
}
