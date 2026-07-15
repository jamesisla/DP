import React from "react";
import { FileText } from "lucide-react";
import { Panel } from "../components/Panel";

export function ModulePlaceholder({ id }) {
  const copy = {
    dpo: ["DPO", "Registro de rol, responsabilidades, evidencias y calendario de obligaciones."],
    matrix: ["Matriz de levantamiento", "Cuestionarios por área, datos tratados, titulares, encargados y transferencias."],
    committee: ["Comité Ejecutivo", "Sesiones, acuerdos, responsables y aprobaciones de alto nivel."],
    policy: ["Política de tratamiento de datos", "Borrador versionado para aprobación y publicación."],
    procedures: ["Procedimientos, riesgos y acciones", "Mapa de riesgos, controles, tareas correctivas y seguimiento."],
  }[id] || ["Módulo", "Información del módulo pendiente de desarrollo."];

  return (
    <div className="p-5 lg:p-8">
      <Panel title={copy[0]} icon={FileText}>
        <p className="max-w-2xl text-slate-600">{copy[1]}</p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {["Pendiente", "En progreso", "Listo para revisión"].map((stage) => (
            <div className="rounded border border-line bg-white p-4" key={stage}>
              <p className="text-sm font-medium">{stage}</p>
              <p className="mt-2 text-2xl font-semibold">
                {stage === "Pendiente" ? 4 : stage === "En progreso" ? 2 : 1}
              </p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
