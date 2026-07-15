import { Eye, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CrudPage } from "../components/CrudPage";
import { RiskBadge } from "../components/RiskBadge";
import { SectionCard } from "../components/SectionCard";
import { StatusBadge } from "../components/StatusBadge";
import { processingActivityConfig } from "../data/matrixCatalogConfigs";
import { dataMappingService, processingActivityService } from "../services/matrixCatalog";
import type { DataMappingEntry, ProcessingActivity } from "../types/matrixCatalog";

export function ProcessingActivitiesPage() {
  const [activities, setActivities] = useState<ProcessingActivity[]>([]);
  const [mapping, setMapping] = useState<DataMappingEntry[]>([]);
  const [filters, setFilters] = useState({ publication_status: "", risk_level: "", responsible_or_processor: "", international_transfer: "", profiling: "" });
  const [message, setMessage] = useState("");
  const [detail, setDetail] = useState<ProcessingActivity | null>(null);

  async function load() {
    const [nextActivities, nextMapping] = await Promise.all([processingActivityService.list(), dataMappingService.list()]);
    setActivities(nextActivities);
    setMapping(nextMapping);
  }

  useEffect(() => {
    load().catch((error) => setMessage(error instanceof Error ? error.message : "Error cargando catalogo"));
  }, []);

  const filtered = useMemo(
    () =>
      activities.filter((row) => {
        if (filters.publication_status && row.publication_status !== filters.publication_status) return false;
        if (filters.risk_level && row.risk_level !== filters.risk_level) return false;
        if (filters.responsible_or_processor && row.responsible_or_processor !== filters.responsible_or_processor) return false;
        if (filters.international_transfer && String(row.international_transfer) !== filters.international_transfer) return false;
        if (filters.profiling && String(row.profiling) !== filters.profiling) return false;
        return true;
      }),
    [activities, filters],
  );

  const responsibles = Array.from(new Set(activities.map((item) => item.responsible_or_processor)));

  async function generate() {
    const result = await processingActivityService.generateFromMapping();
    setMessage(`Actividades creadas desde matriz: ${result.created}`);
    await load();
  }

  async function publish(activity: ProcessingActivity) {
    await processingActivityService.update(activity.id, { publication_status: "publicado", status: "Activo" });
    setMessage("Actividad publicada");
    await load();
  }

  function sourceRows(activity: ProcessingActivity) {
    const ids = activity.source_mapping_entries.split(",").map((item) => Number(item.trim())).filter(Boolean);
    return mapping.filter((item) => ids.includes(item.id));
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Catalogo consolidado</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Catalogo de Actividades de Tratamiento</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Consolida registros validados de matriz en actividades editables antes de aprobacion y publicacion.</p>
      </div>

      <SectionCard title="Filtros y acciones">
        <div className="grid gap-3 md:grid-cols-5">
          {[
            ["publication_status", "Estado", ["borrador", "en_revision", "aprobado", "publicado"]],
            ["risk_level", "Riesgo", ["Bajo", "Medio", "Alto", "Critico"]],
            ["responsible_or_processor", "Responsable", responsibles],
            ["international_transfer", "Transferencia", ["true", "false"]],
            ["profiling", "Perfilamiento", ["true", "false"]],
          ].map(([name, label, options]) => (
            <label className="text-sm font-semibold text-slate-700" key={String(name)}>
              {String(label)}
              <select className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" value={String(filters[name as keyof typeof filters])} onChange={(event) => setFilters((current) => ({ ...current, [String(name)]: event.target.value }))}>
                <option value="">Todos</option>
                {(options as string[]).map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white" onClick={() => generate().catch((error) => setMessage(String(error)))} type="button">
            <Sparkles size={16} /> Generar desde Matriz
          </button>
          {message ? <span className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</span> : null}
        </div>
      </SectionCard>

      <CrudPage compactHeader config={processingActivityConfig} queryParams={filters} onChanged={load} />

      <SectionCard title={`Ficha ejecutiva (${filtered.length} filtradas)`}>
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((activity) => (
            <div className="rounded-lg border border-slate-200 bg-white p-4" key={activity.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{activity.activity_name}</p>
                  <p className="mt-1 text-sm text-slate-500">{activity.responsible_or_processor} / {activity.data_subject_universe}</p>
                </div>
                <RiskBadge level={activity.risk_level} />
              </div>
              <p className="mt-3 text-sm text-slate-600">{activity.treatment_purpose}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <StatusBadge status={activity.publication_status} />
                <button className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold" onClick={() => setDetail(activity)} type="button"><Eye className="mr-1 inline" size={15} />Ficha</button>
                <button className="rounded-md border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700" onClick={() => publish(activity).catch((error) => setMessage(String(error)))} type="button">Publicar</button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {detail ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="flex justify-between gap-4">
              <h2 className="text-xl font-semibold">{detail.activity_name}</h2>
              <button className="rounded-md border border-slate-200 px-3 py-2 text-sm" onClick={() => setDetail(null)} type="button">Cerrar</button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <SectionCard title="Ficha ejecutiva">
                <p className="text-sm text-slate-600">{detail.treatment_purpose}</p>
                <div className="mt-4 space-y-2 text-sm">
                  <p><b>Base legal:</b> {detail.legal_basis}</p>
                  <p><b>Retencion:</b> {detail.retention_period}</p>
                  <p><b>Categorias:</b> {detail.data_categories}</p>
                </div>
              </SectionCard>
              <SectionCard title="Fuente de datos">
                <div className="space-y-2">
                  {sourceRows(detail).map((row) => (
                    <div className="rounded-md bg-slate-50 p-3 text-sm" key={row.id}>
                      <p className="font-semibold">{row.field_name} / {row.system_name}</p>
                      <p className="text-slate-500">{row.area} / {row.data_category}</p>
                    </div>
                  ))}
                  {sourceRows(detail).length === 0 ? <p className="text-sm text-slate-500">Sin registros de matriz asociados.</p> : null}
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
