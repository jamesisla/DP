import { useEffect, useState } from "react";

import { findingsReportService, article14TerService, listApi } from "../services/reports";
import type { Article14TerChecklistItem, ChecklistScore, FindingsReport } from "../types/reports";

type FindingRow = { id: number; title: string; risk_level: string; recommendation: string; status: string };
type RiskRow = { id: number; title: string; priority: string; owner: string; status: string };
type ActionRow = { id: number; title: string; owner: string; due_date: string | null; status: string };

export function FindingsReportPrintPage({ reportId }: { reportId: number }) {
  const [report, setReport] = useState<FindingsReport | null>(null);
  const [checklist, setChecklist] = useState<Article14TerChecklistItem[]>([]);
  const [score, setScore] = useState<ChecklistScore | null>(null);
  const [risks, setRisks] = useState<RiskRow[]>([]);
  const [findings, setFindings] = useState<FindingRow[]>([]);
  const [actions, setActions] = useState<ActionRow[]>([]);

  useEffect(() => {
    Promise.all([
      findingsReportService.get(reportId),
      article14TerService.list(),
      article14TerService.score(),
      listApi<RiskRow>("/risks"),
      listApi<FindingRow>("/findings"),
      listApi<ActionRow>("/actions"),
    ]).then(([nextReport, nextChecklist, nextScore, nextRisks, nextFindings, nextActions]) => {
      setReport(nextReport);
      setChecklist(nextChecklist);
      setScore(nextScore);
      setRisks(nextRisks);
      setFindings(nextFindings);
      setActions(nextActions);
    });
  }, [reportId]);

  if (!report) return <div className="p-8 text-slate-600">Cargando informe...</div>;

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          section { break-inside: avoid; }
        }
      `}</style>
      <div className="mx-auto max-w-5xl px-8 py-8">
        <div className="no-print mb-6 flex justify-end">
          <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" onClick={() => window.print()} type="button">Imprimir / guardar PDF</button>
        </div>

        <header className="border-b border-slate-300 pb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Patagua Privacy</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">{report.title}</h1>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <PrintMetric label="Version" value={report.version} />
            <PrintMetric label="Estado" value={report.status} />
            <PrintMetric label="Score 14 ter" value={`${report.article_14ter_score}%`} />
            <PrintMetric label="Riesgo global" value={report.global_risk_level} />
          </div>
        </header>

        <section className="py-8">
          <h2 className="text-2xl font-semibold">Resumen ejecutivo</h2>
          <p className="mt-4 whitespace-pre-line leading-7 text-slate-700">{report.executive_summary}</p>
        </section>

        <section className="grid gap-4 border-y border-slate-200 py-6 md:grid-cols-3">
          <PrintMetric label="Controles checklist" value={String(score?.total_items ?? 0)} />
          <PrintMetric label="Cumple" value={String(score?.cumple ?? 0)} />
          <PrintMetric label="No cumple" value={String(score?.no_cumple ?? 0)} />
        </section>

        {report.sections.map((section) => (
          <section className="py-7" key={section.id}>
            <h2 className="text-2xl font-semibold">{section.title}</h2>
            <p className="mt-4 whitespace-pre-line leading-7 text-slate-700">{section.content}</p>
          </section>
        ))}

        <PrintTable title="Tabla de riesgos" columns={["Riesgo", "Prioridad", "Responsable", "Estado"]} rows={risks.map((risk) => [risk.title, risk.priority, risk.owner, risk.status])} />
        <PrintTable title="Tabla de brechas" columns={["Brecha", "Riesgo", "Recomendacion", "Estado"]} rows={findings.map((finding) => [finding.title, finding.risk_level, finding.recommendation, finding.status])} />
        <PrintTable title="Checklist Articulo 14 ter" columns={["Codigo", "Requisito", "Estado", "Evidencia", "Responsable"]} rows={checklist.map((item) => [item.code, item.requirement, item.status, item.evidence || "-", item.responsible_area || "-"])} />
        <PrintTable title="Plan de accion" columns={["Accion", "Responsable", "Vence", "Estado"]} rows={actions.map((action) => [action.title, action.owner, action.due_date?.slice(0, 10) ?? "-", action.status])} />

        <section className="mt-8 border-t border-slate-300 pt-6 text-sm text-slate-600">
          <p>Aprobado por: {report.approved_by || "-"}</p>
          <p>Fecha de aprobacion: {report.approved_at?.slice(0, 10) ?? "-"}</p>
        </section>
      </div>
    </main>
  );
}

function PrintMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function PrintTable({ title, columns, rows }: { title: string; columns: string[]; rows: string[][] }) {
  return (
    <section className="py-7">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <table className="mt-4 w-full border-collapse text-left text-sm">
        <thead>
          <tr>{columns.map((column) => <th className="border border-slate-300 bg-slate-100 px-3 py-2" key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, index) => (
            <tr key={`${title}-${index}`}>{row.map((cell, cellIndex) => <td className="border border-slate-300 px-3 py-2 align-top" key={`${cell}-${cellIndex}`}>{cell}</td>)}</tr>
          )) : <tr><td className="border border-slate-300 px-3 py-3 text-slate-500" colSpan={columns.length}>Sin registros.</td></tr>}
        </tbody>
      </table>
    </section>
  );
}
