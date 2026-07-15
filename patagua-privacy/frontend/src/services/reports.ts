import type { Article14TerChecklistItem, ChecklistScore, FindingsReport, ReportGenerateResult } from "../types/reports";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";
const ORG = "demo";

type JsonPayload = Record<string, string | number | boolean | null | undefined> | { sections?: unknown[] };

function withOrg(path: string) {
  return `${API_URL}${path}${path.includes("?") ? "&" : "?"}organization_id=${encodeURIComponent(ORG)}`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(withOrg(path), {
    ...options,
    headers: options.body ? { "Content-Type": "application/json", ...options.headers } : options.headers,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail ?? "No se pudo completar la operacion");
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const findingsReportService = {
  list: () => request<FindingsReport[]>("/findings-reports"),
  get: (id: number) => request<FindingsReport>(`/findings-reports/${id}`),
  generate: () => request<ReportGenerateResult>("/findings-reports/generate", { method: "POST" }),
  update: (id: number, payload: JsonPayload) => request<FindingsReport>(`/findings-reports/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (id: number) => request<void>(`/findings-reports/${id}`, { method: "DELETE" }),
};

export const article14TerService = {
  list: () => request<Article14TerChecklistItem[]>("/article-14ter-checklist"),
  score: () => request<ChecklistScore>("/article-14ter-checklist/score"),
  seedDefaults: () => request<{ created: number; existing: number }>("/article-14ter-checklist/seed-defaults", { method: "POST" }),
  update: (id: number, payload: Partial<Article14TerChecklistItem>) => request<Article14TerChecklistItem>(`/article-14ter-checklist/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (id: number) => request<void>(`/article-14ter-checklist/${id}`, { method: "DELETE" }),
};

export async function listApi<T>(path: string): Promise<T[]> {
  return request<T[]>(path);
}
