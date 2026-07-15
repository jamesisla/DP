import type { CrudRecord } from "../types/crud";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";
const ORGANIZATION_ID = "demo";

type Payload = Record<string, string | number | boolean | null>;
type QueryParams = Record<string, string | number | boolean | null | undefined>;

function endpointUrl(endpoint: string, id?: number, query: QueryParams = {}) {
  const base = `${API_URL}${endpoint}${id ? `/${id}` : ""}`;
  const params = new URLSearchParams({ organization_id: ORGANIZATION_ID });
  Object.entries(query).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) params.set(key, String(value));
  });
  return `${base}?${params.toString()}`;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail ?? "No se pudo completar la operacion");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export function createCrudService<TRecord extends CrudRecord>(endpoint: string) {
  return {
    list: (query?: QueryParams) => request<TRecord[]>(endpointUrl(endpoint, undefined, query)),
    get: (id: number) => request<TRecord>(endpointUrl(endpoint, id)),
    create: (payload: Payload) =>
      request<TRecord>(endpointUrl(endpoint), {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: number, payload: Payload) =>
      request<TRecord>(endpointUrl(endpoint, id), {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    remove: (id: number) =>
      request<void>(endpointUrl(endpoint, id), {
        method: "DELETE",
      }),
  };
}
