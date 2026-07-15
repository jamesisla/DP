import { CheckCircle2, Eye, FileDown, FileText, Pencil, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { ConfirmDialog } from "../components/ConfirmDialog";
import { FormModal } from "../components/FormModal";
import { RiskBadge } from "../components/RiskBadge";
import { SectionCard } from "../components/SectionCard";
import { StatusBadge } from "../components/StatusBadge";
import { SelectInput } from "../components/inputs/SelectInput";
import { TextArea } from "../components/inputs/TextArea";
import { TextInput } from "../components/inputs/TextInput";
import { findingsReportService, listApi } from "../services/reports";
import type { FindingsReport } from "../types/reports";

type FindingRow = { id: number; title: string; category: string; risk_level: string; status: string; recommendation: string };
type RiskRow = { id: number; title: string; priority: string; owner: string; status: string };
type ActionRow = { id: number; title: string; owner: string; due_date: string | null; status: string };

const statusOptions = ["borrador", "en_revision", "aprobado", "emitido"];

export function FindingsReportsPage() {
  const [reports, setReports] = useState<FindingsReport[]>([]);
  const [selected, setSelected] = useState<FindingsReport | null>(null);
  const [editing, setEditing] = useState<FindingsReport | null>(null);
  const [deleting, setDeleting] = useState<FindingsReport | null>(null);
  const [risks, setRisks] = useState<RiskRow[]>([]);
  const [findings, setFindings] = useState<FindingRow[]>([]);
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [nextReports, nextRisks, nextFindings, nextActions] = await Promise.all([
      findingsReportService.list(),
      listApi<RiskRow>("/risks"),
      listApi<FindingRow>("/findings"),
      listApi<ActionRow>("/actions"),
    ]);
    setReports(nextReports);
    setRisks(nextRisks);
    setFindings(nextFindings);
    setActions(nextActions);
    setSelected((current) => (current ? nextReports.find((item) => item.id === current.id) ?? null : nextReports[0] ?? null));
    setLoading(false);
  }

  useEffect(() => {
    load().catch((error) => {
      setMessage(error instanceof Error ? error.message : "Error cargando informes");
      setLoading(false);
    });
  }, []);

  async function generateReport() {
    setSaving(true);
    const result = await findingsReportService.generate();
    setMessage("Informe generado en estado borrador");
    setSelected(result.report);
    setSaving(false);
    await load();
  }

  async function approveReport(report: FindingsReport) {
    setSaving(true);
    const approved = await findingsReportService.update(report.id, { status: "aprobado", approved_by: "Comite Ejecutivo" });
    setSelected(approved);
    setMessage("Informe aprobado");
    setSaving(false);
    await load();
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    const updated = await findingsReportService.update(editing.id, {
      title: editing.title,
      version: editing.version,
      status: editing.status,
      executive_summary: editing.executive_summary,
      main_conclusions: editing.main_conclusions,
      approved_by: editing.approved_by,
    });
    setEditing(null);
    setSelected(updated);
    setSaving(false);
    await load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setSaving(true);
    await findingsReportService.remove(deleting.id);
    setDeleting(null);
    setSelected(null);
    setSaving(false);
    await load();
  }

  function updateEdit(name: string, value: string) {
    setEditing((current) => (current ? { ...current, [name]: value } : current));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Informe ejecutivo</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Informe de Hallazgos</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Genera, revisa y aprueba informes para Comite Ejecutivo desde matriz, catalogo, riesgos, brechas, acciones y checklist Articulo 14 ter.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} onClick={() => generateReport().catch((error) => setMessage(String(error)))} type="button">
          <Sparkles size={17} /> Generar informe
        </button>
      </div>

      {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.3fr)]">
        <SectionCard title="Informes generados">
          {loading ? (
            <div className="rounded-md bg-slate-50 p-6 text-sm text-slate-500">Cargando informes...</div>
          ) : reports.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 p-8 text-center">
              <FileText className="mx-auto text-slate-400" size={34} />
              <p className="mt-3 font-semibold">Sin informes generados</p>
              <p className="mt-1 text-sm text-slate-500">Genera el primer informe desde los datos existentes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div className={`rounded-lg border p-4 ${selected?.id === report.id ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200 bg-white"}`} key={report.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{report.title}</p>
                      <p className="mt-1 text-sm text-slate-500">Generado: {report.generated_at?.slice(0, 10) ?? "-"} / Version {report.version}</p>
                    </div>
                    <RiskBadge level={report.global_risk_level} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge status={report.status} />
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">14 ter: {report.article_14ter_score}%</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold" onClick={() => setSelected(report)} type="button"><Eye size={15} /> Ver informe</button>
                    <button className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold" onClick={() => setEditing(report)} type="button"><Pencil size={15} /> Editar</button>
                    <button className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700" onClick={() => approveReport(report).catch((error) => setMessage(String(error)))} type="button"><CheckCircle2 size={15} /> Aprobar</button>
                    <a className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold" href={`/findings-reports/${report.id}/print`} target="_blank" rel="noreferrer"><FileDown size={15} /> Exportar PDF</a>
                    <button className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-600" onClick={() => setDeleting(report)} type="button"><Trash2 size={15} /> Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Vista detalle del informe">
          {selected ? (
            <div className="space-y-5">
              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold uppercase text-slate-500">Portada ejecutiva</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">{selected.title}</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <Metric label="Score 14 ter" value={`${selected.article_14ter_score}%`} />
                  <Metric label="Riesgo global" value={selected.global_risk_level} risk />
                  <Metric label="Estado" value={selected.status} status />
                  <Metric label="Aprobador" value={selected.approved_by || "-"} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <SectionCard title="Resumen ejecutivo"><p className="whitespace-pre-line text-sm leading-6 text-slate-600">{selected.executive_summary}</p></SectionCard>
                <SectionCard title="Conclusiones"><p className="whitespace-pre-line text-sm leading-6 text-slate-600">{selected.main_conclusions}</p></SectionCard>
              </div>

              <SectionCard title="Secciones automaticas">
                <div className="space-y-3">
                  {selected.sections.map((section) => (
                    <details className="rounded-md border border-slate-200 bg-white p-4" key={section.id} open={section.order_index <= 2}>
                      <summary className="cursor-pointer font-semibold text-slate-950">{section.order_index}. {section.title}</summary>
                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{section.content}</p>
                    </details>
                  ))}
                </div>
              </SectionCard>

              <div className="grid gap-4 xl:grid-cols-2">
                <MiniTable title="Tabla de riesgos" rows={risks.slice(0, 5).map((risk) => [risk.title, risk.priority, risk.owner, risk.status])} columns={["Riesgo", "Prioridad", "Responsable", "Estado"]} />
                <MiniTable title="Tabla de brechas" rows={findings.slice(0, 5).map((finding) => [finding.title, finding.risk_level, finding.category, finding.status])} columns={["Brecha", "Riesgo", "Categoria", "Estado"]} />
              </div>
              <MiniTable title="Plan de accion" rows={actions.slice(0, 6).map((action) => [action.title, action.owner, action.due_date?.slice(0, 10) ?? "-", action.status])} columns={["Accion", "Responsable", "Vence", "Estado"]} />
            </div>
          ) : (
            <div className="rounded-md bg-slate-50 p-8 text-center text-sm text-slate-500">Selecciona o genera un informe para revisar su contenido.</div>
          )}
        </SectionCard>
      </div>

      <FormModal open={Boolean(editing)} saving={saving} title="Editar informe" onClose={() => setEditing(null)} onSubmit={saveEdit}>
        {editing ? (
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput label="Titulo" name="title" value={editing.title} onChange={updateEdit} />
            <TextInput label="Version" name="version" value={editing.version} onChange={updateEdit} />
            <SelectInput label="Estado" name="status" options={statusOptions} value={editing.status} onChange={updateEdit} />
            <TextInput label="Aprobado por" name="approved_by" value={editing.approved_by} onChange={updateEdit} />
            <div className="md:col-span-2"><TextArea label="Resumen ejecutivo" name="executive_summary" value={editing.executive_summary} onChange={updateEdit} /></div>
            <div className="md:col-span-2"><TextArea label="Conclusiones principales" name="main_conclusions" value={editing.main_conclusions} onChange={updateEdit} /></div>
          </div>
        ) : null}
      </FormModal>

      <ConfirmDialog open={Boolean(deleting)} confirming={saving} title="Eliminar informe" description="Esta accion eliminara el informe y sus secciones." onCancel={() => setDeleting(null)} onConfirm={() => confirmDelete().catch((error) => setMessage(String(error)))} />
    </div>
  );
}

function Metric({ label, value, risk = false, status = false }: { label: string; value: string; risk?: boolean; status?: boolean }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <div className="mt-2 text-lg font-semibold text-slate-950">{risk ? <RiskBadge level={value} /> : status ? <StatusBadge status={value} /> : value}</div>
    </div>
  );
}

function MiniTable({ title, columns, rows }: { title: string; columns: string[]; rows: string[][] }) {
  return (
    <SectionCard title={title}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>{columns.map((column) => <th className="px-3 py-2" key={column}>{column}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.length ? rows.map((row, index) => (
              <tr key={`${title}-${index}`}>{row.map((cell, cellIndex) => <td className="px-3 py-2 text-slate-700" key={`${cell}-${cellIndex}`}>{cell}</td>)}</tr>
            )) : <tr><td className="px-3 py-4 text-slate-500" colSpan={columns.length}>Sin registros.</td></tr>}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
