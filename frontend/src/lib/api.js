export const API_URL = import.meta.env.VITE_API_URL ?? "/api";

export function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

export async function api(path, token, options = {}) {
  // Prevent double slash if path starts with /
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_URL}${cleanPath}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    let errorDetail = `Error ${response.status}: ${response.statusText || "Respuesta no exitosa"}`;
    if (isJson) {
      try {
        const data = await response.json();
        errorDetail = data.detail || data.message || errorDetail;
      } catch (_) {}
    } else {
      try {
        const text = await response.text();
        if (text && text.length < 150 && !text.includes("<html")) {
          errorDetail = text;
        }
      } catch (_) {}
    }
    throw new Error(errorDetail);
  }

  if (isJson) {
    return response.json();
  }

  // If status is 200/204 but returned text or empty
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (_) {
    return text;
  }
}
