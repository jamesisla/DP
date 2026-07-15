import { createCrudService } from "./crud";
import type { DataMappingEntry, DataMappingSummary, ProcessingActivity } from "../types/matrixCatalog";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";
const ORG = "demo";

function withOrg(path: string) {
  return `${API_URL}${path}${path.includes("?") ? "&" : "?"}organization_id=${ORG}`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(withOrg(path), options);
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail ?? "Operacion fallida");
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const dataMappingService = {
  ...createCrudService<DataMappingEntry>("/data-mapping"),
  summary: () => request<DataMappingSummary>("/data-mapping/summary"),
  importCsv: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ imported: number }>("/data-mapping/import-csv", { method: "POST", body: form });
  },
  exportCsv: (rows: DataMappingEntry[]) => {
    const headers = [
      "area",
      "system_name",
      "database_name",
      "table_name",
      "field_name",
      "data_category",
      "data_subject_universe",
      "is_sensitive",
      "is_part_of_database",
      "database_category",
      "treatment_purpose",
      "legal_basis",
      "data_source",
      "international_transfer",
      "third_party_communication",
      "internal_responsible",
      "retention_period",
      "associated_platforms",
      "access_roles",
      "storage_location",
      "automated_decisions",
      "profiling",
      "associated_risks",
      "comments",
      "area_manager_approval",
      "area_manager_observations",
      "validation_status",
    ];
    const csv = [headers.join(","), ...rows.map((row) => headers.map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "matriz-levantamiento.csv";
    link.click();
    URL.revokeObjectURL(url);
  },
};

export const processingActivityService = {
  ...createCrudService<ProcessingActivity>("/processing-activities"),
  generateFromMapping: () => request<{ created: number }>("/processing-activities/generate-from-mapping", { method: "POST" }),
  publicCatalog: () => request<ProcessingActivity[]>("/processing-activities/public-catalog"),
};
