export type ReportSection = {
  id: number;
  report_id: number;
  section_type: string;
  title: string;
  content: string;
  order_index: number;
};

export type FindingsReport = {
  id: number;
  organization_id: string;
  title: string;
  version: string;
  status: "borrador" | "en_revision" | "aprobado" | "emitido";
  executive_summary: string;
  main_conclusions: string;
  main_risks_summary: string;
  compliance_gaps_summary: string;
  article_14ter_score: number;
  global_risk_level: string;
  generated_at: string | null;
  approved_by: string;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  sections: ReportSection[];
};

export type Article14TerChecklistItem = {
  id: number;
  organization_id: string;
  code: string;
  requirement: string;
  status: "cumple" | "parcial" | "no_cumple" | "no_aplica";
  evidence: string;
  gap_description: string;
  recommendation: string;
  responsible_area: string;
  priority: string;
  created_at: string;
  updated_at: string;
};

export type ChecklistScore = {
  total_items: number;
  cumple: number;
  parcial: number;
  no_cumple: number;
  no_aplica: number;
  score_porcentaje: number;
};

export type ReportGenerateResult = {
  report: FindingsReport;
  metrics: Record<string, number | string>;
};
