import React, { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { TablePage } from "../components/TablePage";
import { api } from "../lib/api";

export function Activities({ activities, token, onReload }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [purpose, setPurpose] = useState("");
  const [legalBasis, setLegalBasis] = useState("");
  const [riskLevel, setRiskLevel] = useState("Medio");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openCreate() {
    setEditingItem(null);
    setName("");
    setArea("");
    setPurpose("");
    setLegalBasis("");
    setRiskLevel("Medio");
    setError("");
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditingItem(item);
    setName(item.name);
    setArea(item.area);
    setPurpose(item.purpose);
    setLegalBasis(item.legal_basis);
    setRiskLevel(item.risk_level);
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = { name, area, purpose, legal_basis: legalBasis, risk_level: riskLevel };
      if (editingItem) {
        await api(`/activities/${editingItem.id}`, token, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/activities", token, {
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
    if (!confirm("¿Está seguro de eliminar esta actividad?")) return;
    try {
      await api(`/activities/${id}`, token, { method: "DELETE" });
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
          Nueva Actividad
        </button>
      </div>

      <TablePage
        title="Catálogo de actividades de tratamiento"
        columns={["Actividad", "Área", "Finalidad", "Base de licitud", "Riesgo"]}
        rows={activities.map((item) => [
          item.name,
          item.area,
          item.purpose,
          item.legal_basis,
          item.risk_level,
        ])}
        actions={(idx) => {
          const item = activities[idx];
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
              {editingItem ? "Editar Actividad" : "Nueva Actividad de Tratamiento"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="act-name">Nombre de actividad</label>
                <input
                  id="act-name"
                  className="field mt-1"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="act-area">Área responsable</label>
                <input
                  id="act-area"
                  className="field mt-1"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="act-purpose">Finalidad del tratamiento</label>
                <textarea
                  id="act-purpose"
                  className="field mt-1 h-20"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="act-basis">Base de licitud</label>
                <input
                  id="act-basis"
                  className="field mt-1"
                  required
                  value={legalBasis}
                  onChange={(e) => setLegalBasis(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="act-risk">Nivel de riesgo</label>
                <select
                  id="act-risk"
                  className="field mt-1"
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value)}
                >
                  <option value="Bajo">Bajo</option>
                  <option value="Medio">Medio</option>
                  <option value="Alto">Alto</option>
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
