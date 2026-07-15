import { useEffect, useState } from "react";

import { getHealth } from "../services/api";

type ApiState = "checking" | "online" | "offline";

export function ApiStatus() {
  const [state, setState] = useState<ApiState>("checking");

  useEffect(() => {
    getHealth()
      .then(() => setState("online"))
      .catch(() => setState("offline"));
  }, []);

  const styles = {
    checking: "border-slate-200 bg-slate-50 text-slate-600",
    online: "border-emerald-200 bg-emerald-50 text-emerald-700",
    offline: "border-amber-200 bg-amber-50 text-amber-700",
  };

  const labels = {
    checking: "Verificando backend...",
    online: "Backend conectado",
    offline: "Backend no disponible. Revisa Docker Compose y http://localhost:8000/api/health.",
  };

  return <div className={`mt-6 rounded-md border px-4 py-3 text-sm ${styles[state]}`}>{labels[state]}</div>;
}
