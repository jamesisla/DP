import React, { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { TablePage } from "../components/TablePage";
import { api } from "../lib/api";

export function Consents({ consents, token, onReload }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [dataSubject, setDataSubject] = useState("");
  const [channel, setChannel] = useState("");
  const [purpose, setPurpose] = useState("");
  const [status, setStatus] = useState("Vigente");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openCreate() {
    setEditingItem(null);
    setDataSubject("");
    setChannel("");
    setPurpose("");
    setStatus("Vigente");
    setError("");
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditingItem(item);
    setDataSubject(item.data_subject);
    setChannel(item.channel);
    setPurpose(item.purpose);
    setStatus(item.status);
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = { data_subject: dataSubject, channel, purpose, status };
      if (editingItem) {
        await api(`/consents/${editingItem.id}`, token, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/consents", token, {
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
    if (!confirm("¿Está seguro de eliminar este consentimiento?")) return;
    try {
      await api(`/consents/${id}`, token, { method: "DELETE" });
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
          Nuevo Consentimiento
        </button>
      </div>

      <TablePage
        title="Consentimientos"
        columns={["Titular", "Canal", "Finalidad", "Estado"]}
        rows={consents.map((item) => [
          item.data_subject,
          item.channel,
          item.purpose,
          item.status,
        ])}
        actions={(idx) => {
          const item = consents[idx];
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
              {editingItem ? "Editar Consentimiento" : "Nuevo Consentimiento"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="con-subject">Titular del dato</label>
                <input
                  id="con-subject"
                  className="field mt-1"
                  required
                  value={dataSubject}
                  onChange={(e) => setDataSubject(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="con-channel">Canal / Medio</label>
                <input
                  id="con-channel"
                  className="field mt-1"
                  required
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="con-purpose">Finalidad autorizada</label>
                <textarea
                  id="con-purpose"
                  className="field mt-1 h-20"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="con-status">Estado</label>
                <select
                  id="con-status"
                  className="field mt-1"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Vigente">Vigente</option>
                  <option value="Revocado">Revocado</option>
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
