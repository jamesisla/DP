import { CheckCircle2, Database, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { RiskBadge } from "../components/RiskBadge";
import { SectionCard } from "../components/SectionCard";
import { StatusBadge } from "../components/StatusBadge";
import { article14TerService } from "../services/reports";
import type { Article14TerChecklistItem, ChecklistScore } from "../types/reports";

const statusOptions = ["cumple", "parcial", "no_cumple", "no_aplica"] as const;
const priorityOptions = ["Baja", "Media", "Alta", "Critica"];

export function Checklist14TerPage() {
  const [items, setItems] = useState<Article14TerChecklistItem[]>([]);
  const [score, setScore] = useState<ChecklistScore | null>(null);
  const [editing, setEditing] = useState<Record<number, Partial<Article14TerChecklistItem>>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    const [nextItems, nextScore] = await Promise.all([article14TerService.list(), article14TerService.score()]);
    setItems(nextItems);
    setScore(nextScore);
    setLoading(false);
  }

  useEffect(() => {
    load().catch((error) => {
      setMessage(error instanceof Error ? error.message : "Error cargando checklist");
      setLoading(false);
    });
  }, []);

  const editedItems = useMemo(
    () => items.map((item) => ({ ...item, ...(editing[item.id] ?? {}) })),
    [editing, items],
  );

  function updateDraft(id: number, field: keyof Article14TerChecklistItem, value: string) {
    setEditing((current) => ({ ...current, [id]: { ...(current[id] ?? {}), [field]: value } }));
  }

  async function saveItem(item: Article14TerChecklistItem) {
    await article14TerService.update(item.id, editing[item.id] ?? {});
    setEditing((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });
    setMessage("Control actualizado");
    await load();
  }

  async function seedDefaults() {
    const result = await article14TerService.seedDefaults();
    setMessage(`Checklist base cargado. Nuevos: ${result.created}; existentes: ${result.existing}`);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Articulo 14 ter</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Checklist de Transparencia</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Controla evidencias, brechas y responsables para alimentar el Informe de Hallazgos.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => seedDefaults().catch((error) => setMessage(String(error)))} type="button">
          <Database size={17} /> Cargar checklist base
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:col-span-2">
          <p className="text-sm font-semibold text-slate-500">Score automatico</p>
          <p className="mt-2 text-4xl font-semibold text-slate-950">{score?.score_porcentaje ?? 0}%</p>
        </div>
        {score
          ? [
              ["Cumple", score.cumple],
              ["Parcial", score.parcial],
              ["No cumple", score.no_cumple],
              ["No aplica", score.no_aplica],
            ].map(([label, value]) => (
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={String(label)}>
                <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
              </div>
            ))
          : null}
      </div>

      {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div> : null}

      <SectionCard title="Controles editables">
        {loading ? (
          <div className="rounded-md bg-slate-50 p-6 text-sm text-slate-500">Cargando controles...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-3">Control</th>
                  <th className="px-3 py-3">Estado</th>
                  <th className="px-3 py-3">Evidencia</th>
                  <th className="px-3 py-3">Brecha</th>
                  <th className="px-3 py-3">Recomendacion</th>
                  <th className="px-3 py-3">Responsable</th>
                  <th className="px-3 py-3">Prioridad</th>
                  <th className="px-3 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {editedItems.map((item) => (
                  <tr key={item.id}>
                    <td className="max-w-72 px-3 py-3 align-top">
                      <p className="font-semibold text-slate-950">{item.code}</p>
                      <p className="mt-1 text-slate-600">{item.requirement}</p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <select className="h-10 rounded-md border border-slate-300 bg-white px-2" value={item.status} onChange={(event) => updateDraft(item.id, "status", event.target.value)}>
                        {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </td>
                    {(["evidence", "gap_description", "recommendation", "responsible_area"] as const).map((field) => (
                      <td className="px-3 py-3 align-top" key={field}>
                        <textarea className="min-h-20 w-52 rounded-md border border-slate-300 px-2 py-2" value={String(item[field] ?? "")} onChange={(event) => updateDraft(item.id, field, event.target.value)} />
                      </td>
                    ))}
                    <td className="px-3 py-3 align-top">
                      <select className="h-10 rounded-md border border-slate-300 bg-white px-2" value={item.priority} onChange={(event) => updateDraft(item.id, "priority", event.target.value)}>
                        {priorityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-3 text-right align-top">
                      <button className="inline-flex items-center gap-2 rounded-md border border-emerald-200 px-3 py-2 font-semibold text-emerald-700" onClick={() => saveItem(item).catch((error) => setMessage(String(error)))} type="button">
                        <Save size={15} /> Guardar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 ? (
              <div className="grid place-items-center rounded-md border border-dashed border-slate-300 p-10 text-center">
                <CheckCircle2 className="text-slate-400" size={32} />
                <p className="mt-3 font-semibold">Sin controles cargados</p>
                <p className="mt-1 text-sm text-slate-500">Usa el boton de checklist base para crear los controles minimos.</p>
              </div>
            ) : null}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Lectura ejecutiva">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">Estado predominante</p>
            <div className="mt-2"><StatusBadge status={(score?.no_cumple ?? 0) > 0 ? "no_cumple" : "cumple"} /></div>
          </div>
          <div className="rounded-md bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">Prioridad sugerida</p>
            <div className="mt-2"><RiskBadge level={(score?.score_porcentaje ?? 0) < 65 ? "Alto" : "Medio"} /></div>
          </div>
          <div className="rounded-md bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">Items evaluados</p>
            <p className="mt-2 text-2xl font-semibold">{score?.total_items ?? 0}</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
