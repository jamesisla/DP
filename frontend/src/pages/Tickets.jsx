import React, { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { TablePage } from "../components/TablePage";
import { api } from "../lib/api";

export function Tickets({ tickets, token, onReload }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("Nuevo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openCreate() {
    setEditingItem(null);
    setSubject("");
    setCategory("");
    setStatus("Nuevo");
    setError("");
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditingItem(item);
    setSubject(item.subject);
    setCategory(item.category);
    setStatus(item.status);
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = { subject, category, status };
      if (editingItem) {
        await api(`/tickets/${editingItem.id}`, token, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/tickets", token, {
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
    if (!confirm("¿Está seguro de eliminar este caso?")) return;
    try {
      await api(`/tickets/${id}`, token, { method: "DELETE" });
      onReload();
    } catch (err) {
      alert("Error al eliminar: " + err.message);
    }
  }

  return (
    <div className="relative">
      <div className="flex justify-end px-5 pt-5 lg:px-8">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded bg-brand px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-opacity-90"
        >
          <Plus size={16} />
          Nuevo Caso / Ticket
        </button>
      </div>

      <TablePage
        title="Casos y tickets ligeros"
        columns={["Caso", "Categoría", "Estado"]}
        rows={tickets.map((item) => [
          item.subject,
          item.category,
          item.status,
        ])}
        actions={(idx) => {
          const item = tickets[idx];
          return (
            <div className="flex justify-end gap-2">
              <button
                onClick={() => openEdit(item)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                title="Editar"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        }}
      />

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-soft">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? "Editar Caso" : "Nuevo Caso / Ticket"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="tkt-sub">Asunto / Caso</label>
                <input
                  id="tkt-sub"
                  className="field mt-1"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="tkt-cat">Categoría</label>
                <input
                  id="tkt-cat"
                  className="field mt-1"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="tkt-status">Estado</label>
                <select
                  id="tkt-status"
                  className="field mt-1"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Nuevo">Nuevo</option>
                  <option value="En revisión">En revisión</option>
                  <option value="En trámite">En trámite</option>
                  <option value="Resuelto">Resuelto</option>
                  <option value="Cerrado">Cerrado</option>
                </select>
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
