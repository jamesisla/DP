import React, { useState } from "react";
import { Plus, Edit2, Trash2, ClipboardList } from "lucide-react";
import { Panel } from "../components/Panel";
import { api } from "../lib/api";

export function Findings({ findings, token, onReload }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("Media");
  const [status, setStatus] = useState("Abierto");
  const [recommendation, setRecommendation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openCreate() {
    setEditingItem(null);
    setTitle("");
    setSeverity("Media");
    setStatus("Abierto");
    setRecommendation("");
    setError("");
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditingItem(item);
    setTitle(item.title);
    setSeverity(item.severity);
    setStatus(item.status);
    setRecommendation(item.recommendation);
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = { title, severity, status, recommendation };
      if (editingItem) {
        await api(`/findings/${editingItem.id}`, token, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/findings", token, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setModalOpen(false);
      onReload();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("¿Está seguro de eliminar este hallazgo?")) return;
    try {
      await api(`/findings/${id}`, token, { method: "DELETE" });
      onReload();
    } catch (err) {
      alert("Error al eliminar: " + err.message);
    }
  }

  return (
    <div className="p-5 lg:p-8 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Informe de hallazgos</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded bg-brand px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-opacity-90"
        >
          <Plus size={16} />
          Nuevo Hallazgo
        </button>
      </div>

      <Panel title="Hallazgos identificados" icon={ClipboardList}>
        <div className="grid gap-4 xl:grid-cols-2">
          {findings.map((finding) => (
            <div className="item-card flex flex-col justify-between" key={finding.id}>
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="font-semibold text-ink">{finding.title}</p>
                  <span className="status">{finding.severity}</span>
                </div>
                <p className="text-sm text-slate-600 mb-4">{finding.recommendation}</p>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-line">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {finding.status}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(finding)}
                    className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(finding.id)}
                    className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-soft">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? "Editar Hallazgo" : "Nuevo Hallazgo"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="find-title">Título del hallazgo</label>
                <input
                  id="find-title"
                  className="field mt-1"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="find-severity">Severidad</label>
                <select
                  id="find-severity"
                  className="field mt-1"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                >
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                  <option value="Crítica">Crítica</option>
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="find-status">Estado</label>
                <select
                  id="find-status"
                  className="field mt-1"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Abierto">Abierto</option>
                  <option value="En progreso">En progreso</option>
                  <option value="Cerrado">Cerrado</option>
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="find-reco">Recomendación</label>
                <textarea
                  id="find-reco"
                  className="field mt-1 h-24"
                  required
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-90"
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
