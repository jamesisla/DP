export const API_URL = import.meta.env.VITE_API_URL ?? "/api";

export function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

export async function api(path, token, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error((await response.json()).detail ?? "Error de API");
  }

  return response.json();
}
