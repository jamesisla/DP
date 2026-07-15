import { Download, Eye, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { CrudPage } from "../components/CrudPage";
import { RiskBadge } from "../components/RiskBadge";
import { SectionCard } from "../components/SectionCard";
import { StatusBadge } from "../components/StatusBadge";
import { dataMappingConfig } from "../data/matrixCatalogConfigs";
import { dataMappingService } from "../services/matrixCatalog";
import type { DataMappingEntry, DataMappingSummary } from "../types/matrixCatalog";

export function DataMappingPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [summary, setSummary] = useState<DataMappingSummary | null>(null);
  const [rows, setRows] = useState<DataMappingEntry[]>([]);
  const [detail, setDetail] = useState<DataMappingEntry | null>(null);
  const [filters, setFilters] = useState({ area: "", system_name: "", data_category: "", is_sensitive: "", validation_status: "" });
  const [message, setMessage] = useState("");

  async function load() {
    const [nextSummary, nextRows] = await Promise.all([dataMappingService.summary(), dataMappingService.list()]);
    setSummary(nextSummary);
    setRows(nextRows);
  }

  useEffect(() => {
    load().catch((error) => setMessage(error instanceof Error ? error.message : "Error cargando matriz"));
  }, []);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        if (filters.area && row.area !== filters.area) return false;
        if (filters.system_name && row.system_name !== filters.system_name) return false;
        if (filters.data_category && row.data_category !== filters.data_category) return false;
        if (filters.validation_status && row.validation_status !== filters.validation_status) return false;
        if (filters.is_sensitive && String(row.is_sensitive) !== filters.is_sensitive) return false;
        return true;
      }),
    [filters, rows],
  );

  const unique = (key: keyof DataMappingEntry) => Array.from(new Set(rows.map((row) => String(row[key] ?? "")).filter(Boolean)));

  async function handleImport(file?: File) {
    if (!file) return;
    const result = await dataMappingService.importCsv(file);
    setMessage(`Importados ${result.imported} registros`);
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Matriz granular</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Matriz de Levantamiento de Informacion</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Registra datos por sistema, campo, area, finalidad, riesgo y validacion. Esta matriz alimenta el catalogo consolidado.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-7">
        {summary
          ? Object.entries(summary).map(([key, value]) => (
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={key}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{key.replace(/_/g, " ")}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
              </div>
            ))
          : null}
      </div>

      <SectionCard title="Filtros y acciones">
        <div className="grid gap-3 md:grid-cols-5">
          {[
            ["area", "Area", unique("area")],
            ["system_name", "Sistema", unique("system_name")],
            ["data_category", "Categoria", unique("data_category")],
            ["is_sensitive", "Sensible", ["true", "false"]],
            ["validation_status", "Validacion", ["pendiente", "en_revision", "validado", "requiere_correccion"]],
          ].map(([name, label, options]) => (
            <label className="text-sm font-semibold text-slate-700" key={String(name)}>
              {String(label)}
              <select className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" value={String(filters[name as keyof typeof filters])} onChange={(event) => setFilters((current) => ({ ...current, [String(name)]: event.target.value }))}>
                <option value="">Todos</option>
                {(options as string[]).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <input ref={fileRef} className="hidden" type="file" accept=".csv" onChange={(event) => handleImport(event.target.files?.[0]).catch((error) => setMessage(String(error)))} />
          <button className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold" onClick={() => fileRef.current?.click()} type="button">
            <Upload size={16} /> Importar CSV
          </button>
          <button className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold" onClick={() => dataMappingService.exportCsv(filteredRows)} type="button">
            <Download size={16} /> Exportar CSV
          </button>
          {message ? <span className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</span> : null}
        </div>
      </SectionCard>

      <CrudPage compactHeader config={dataMappingConfig} queryParams={filters} onChanged={load} />

      <SectionCard title={`Vista detalle (${filteredRows.length} filtrados)`}>
        <div className="space-y-3">
          {filteredRows.slice(0, 8).map((row) => (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-3" key={row.id}>
              <div>
                <p className="font-semibold text-slate-950">{row.field_name} / {row.system_name}</p>
                <p className="text-sm text-slate-500">{row.area} / {row.treatment_purpose}</p>
              </div>
              <div className="flex items-center gap-2">
                {row.is_sensitive ? <RiskBadge level="Alto" /> : <RiskBadge level="Bajo" />}
                <StatusBadge status={row.validation_status} />
                <button className="rounded-md border border-slate-200 p-2" onClick={() => setDetail(row)} type="button"><Eye size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {detail ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="flex justify-between gap-4">
              <h2 className="text-xl font-semibold">{detail.field_name}</h2>
              <button className="rounded-md border border-slate-200 px-3 py-2 text-sm" onClick={() => setDetail(null)} type="button">Cerrar</button>
            </div>
            <dl className="mt-5 grid gap-4 md:grid-cols-2">
              {Object.entries(detail).map(([key, value]) => (
                <div className="rounded-md bg-slate-50 p-3" key={key}>
                  <dt className="text-xs font-semibold uppercase text-slate-500">{key}</dt>
                  <dd className="mt-1 text-sm text-slate-900">{String(value ?? "-")}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      ) : null}
    </div>
  );
}
