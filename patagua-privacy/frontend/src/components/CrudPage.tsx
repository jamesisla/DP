import { Edit2, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { createCrudService } from "../services/crud";
import type { CrudField, CrudModuleConfig, CrudRecord } from "../types/crud";
import { ConfirmDialog } from "./ConfirmDialog";
import { DataTable } from "./DataTable";
import { EmptyState } from "./EmptyState";
import { FormModal } from "./FormModal";
import { DateInput } from "./inputs/DateInput";
import { SelectInput } from "./inputs/SelectInput";
import { TextArea } from "./inputs/TextArea";
import { TextInput } from "./inputs/TextInput";
import { ToggleInput } from "./inputs/ToggleInput";
import { PageHeader } from "./PageHeader";
import { SectionCard } from "./SectionCard";

type FormState = Record<string, string | number | boolean | null>;

type CrudPageProps = {
  config: CrudModuleConfig;
  compactHeader?: boolean;
  queryParams?: Record<string, string | number | boolean | null | undefined>;
  onChanged?: () => Promise<void> | void;
};

function initialValue(field: CrudField) {
  if (field.type === "toggle") return false;
  if (field.type === "number") return "";
  return "";
}

function normalizeDateValue(value: unknown, includeTime = false) {
  if (!value || typeof value !== "string") return "";
  if (includeTime) return value.slice(0, 16);
  return value.slice(0, 10);
}

function buildInitialState(fields: CrudField[], record?: CrudRecord | null): FormState {
  return fields.reduce<FormState>((state, field) => {
    const raw = record?.[field.name];
    if (field.type === "date") state[field.name] = normalizeDateValue(raw);
    else if (field.type === "datetime") state[field.name] = normalizeDateValue(raw, true);
    else if (field.type === "toggle") state[field.name] = Boolean(raw);
    else state[field.name] = raw == null ? initialValue(field) : raw;
    return state;
  }, {});
}

function cleanPayload(fields: CrudField[], values: FormState) {
  return fields.reduce<FormState>((payload, field) => {
    const value = values[field.name];
    if ((field.type === "date" || field.type === "datetime" || field.type === "number") && value === "") {
      payload[field.name] = null;
      return payload;
    }
    if (field.type === "number") {
      payload[field.name] = value === null ? null : Number(value);
      return payload;
    }
    payload[field.name] = value;
    return payload;
  }, {});
}

function formatCell(record: CrudRecord, key: string) {
  const value = record[key];
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return String(value);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);
  return String(value);
}

export function CrudPage({ config, compactHeader = false, queryParams, onChanged }: CrudPageProps) {
  const service = useMemo(() => createCrudService<CrudRecord>(config.endpoint), [config.endpoint]);
  const queryKey = JSON.stringify(queryParams ?? {});
  const [records, setRecords] = useState<CrudRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CrudRecord | null>(null);
  const [form, setForm] = useState<FormState>(() => buildInitialState(config.fields));
  const [deleting, setDeleting] = useState<CrudRecord | null>(null);

  async function loadRecords() {
    setLoading(true);
    setError("");
    try {
      setRecords(await service.list(queryParams));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los registros");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, [service, queryKey]);

  function openCreate() {
    setEditing(null);
    setForm(buildInitialState(config.fields));
    setModalOpen(true);
  }

  function openEdit(record: CrudRecord) {
    setEditing(record);
    setForm(buildInitialState(config.fields, record));
    setModalOpen(true);
  }

  function updateField(name: string, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function saveRecord() {
    setSaving(true);
    setError("");
    try {
      const payload = cleanPayload(config.fields, form);
      if (editing) await service.update(editing.id, payload);
      else await service.create(payload);
      setModalOpen(false);
      await loadRecords();
      await onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setSaving(true);
    setError("");
    try {
      await service.remove(deleting.id);
      setDeleting(null);
      await loadRecords();
      await onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar");
    } finally {
      setSaving(false);
    }
  }

  const rows = records.map((record) => config.columns.map((column) => formatCell(record, column.key)));
  const riskColumns = config.columns.map((column, index) => (column.type === "risk" ? index : -1)).filter((index) => index >= 0);
  const statusColumns = config.columns.map((column, index) => (column.type === "status" ? index : -1)).filter((index) => index >= 0);
  const booleanColumns = config.columns.map((column, index) => (column.type === "boolean" ? index : -1)).filter((index) => index >= 0);

  return (
    <>
      {compactHeader ? null : <PageHeader eyebrow="Mantenedor" title={config.title} description={config.description} />}

      <SectionCard
        action={
          <button className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white" onClick={openCreate} type="button">
            <Plus size={17} />
            Nuevo
          </button>
        }
        title={compactHeader ? config.title : "Registros"}
      >
        {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        {loading ? (
          <div className="rounded-md bg-slate-50 p-6 text-sm text-slate-500">Cargando registros...</div>
        ) : records.length === 0 ? (
          <EmptyState icon={Plus} title="Sin registros" description="Crea el primer registro para comenzar a gestionar este modulo." />
        ) : (
          <DataTable
            actions={records.map((record) => (
              <div className="inline-flex gap-2" key={record.id}>
                <button className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" onClick={() => openEdit(record)} title="Editar" type="button">
                  <Edit2 size={16} />
                </button>
                <button className="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50" onClick={() => setDeleting(record)} title="Eliminar" type="button">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            booleanColumns={booleanColumns}
            columns={config.columns.map((column) => column.label)}
            riskColumns={riskColumns}
            rows={rows}
            statusColumns={statusColumns}
          />
        )}
      </SectionCard>

      <FormModal open={modalOpen} saving={saving} title={editing ? `Editar ${config.title}` : `Nuevo ${config.title}`} onClose={() => setModalOpen(false)} onSubmit={saveRecord}>
        <div className="grid gap-4 md:grid-cols-2">
          {config.fields.map((field) => {
            const className = field.span === "full" ? "md:col-span-2" : "";
            const value = form[field.name];
            if (field.type === "textarea") {
              return (
                <div className={className} key={field.name}>
                  <TextArea label={field.label} name={field.name} required={field.required} value={String(value ?? "")} onChange={updateField} />
                </div>
              );
            }
            if (field.type === "select") {
              return (
                <div className={className} key={field.name}>
                  <SelectInput label={field.label} name={field.name} options={field.options ?? []} required={field.required} value={String(value ?? "")} onChange={updateField} />
                </div>
              );
            }
            if (field.type === "date" || field.type === "datetime") {
              return (
                <div className={className} key={field.name}>
                  <DateInput includeTime={field.type === "datetime"} label={field.label} name={field.name} required={field.required} value={String(value ?? "")} onChange={updateField} />
                </div>
              );
            }
            if (field.type === "toggle") {
              return (
                <div className={className} key={field.name}>
                  <ToggleInput checked={Boolean(value)} label={field.label} name={field.name} onChange={updateField} />
                </div>
              );
            }
            return (
              <div className={className} key={field.name}>
                <TextInput label={field.label} name={field.name} required={field.required} type={field.type === "number" ? "number" : field.type} value={String(value ?? "")} onChange={updateField} />
              </div>
            );
          })}
        </div>
      </FormModal>

      <ConfirmDialog
        confirming={saving}
        description="Esta accion eliminara el registro seleccionado. Los datos no podran recuperarse desde esta interfaz."
        open={Boolean(deleting)}
        title="Eliminar registro"
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
