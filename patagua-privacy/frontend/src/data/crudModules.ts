import type { CrudModuleConfig } from "../types/crud";

const statusOptions = ["Pendiente", "En progreso", "En revision", "Abierto", "Cerrado", "Completado", "Vigente", "Revocado", "Programada", "Publicado"];
const riskOptions = ["Bajo", "Medio", "Alto", "Critico"];
const priorityOptions = ["Baja", "Media", "Alta", "Critica"];

export const dpoConfig: CrudModuleConfig = {
  key: "dpo",
  title: "DPO",
  description: "Mantenedor del delegado o responsable de proteccion de datos de la organizacion.",
  endpoint: "/dpos",
  columns: [
    { key: "full_name", label: "Nombre" },
    { key: "email", label: "Correo" },
    { key: "area", label: "Area" },
    { key: "dpo_type", label: "Tipo" },
    { key: "active", label: "Activo", type: "boolean" },
  ],
  fields: [
    { name: "full_name", label: "Nombre completo", type: "text", required: true },
    { name: "rut", label: "RUT", type: "text", required: true },
    { name: "email", label: "Correo", type: "email", required: true },
    { name: "phone", label: "Telefono", type: "text", required: true },
    { name: "position", label: "Cargo", type: "text", required: true },
    { name: "area", label: "Area", type: "text", required: true },
    { name: "dpo_type", label: "Tipo DPO", type: "select", options: ["Interno", "Externo"], required: true },
    { name: "designated_by", label: "Designado por", type: "text", required: true },
    { name: "start_date", label: "Fecha inicio", type: "date" },
    { name: "active", label: "Activo", type: "toggle" },
  ],
};

export const projectConfig: CrudModuleConfig = {
  key: "project",
  title: "Proyecto de implementacion",
  description: "Plan, objetivo, alcance y estado del proyecto de implementacion de cumplimiento.",
  endpoint: "/projects",
  columns: [
    { key: "name", label: "Proyecto" },
    { key: "responsible_area", label: "Area responsable" },
    { key: "start_date", label: "Inicio", type: "date" },
    { key: "end_date", label: "Termino", type: "date" },
    { key: "status", label: "Estado", type: "status" },
  ],
  fields: [
    { name: "name", label: "Nombre", type: "text", required: true },
    { name: "responsible_area", label: "Area responsable", type: "text", required: true },
    { name: "executive_summary", label: "Resumen ejecutivo", type: "textarea", required: true, span: "full" },
    { name: "objective", label: "Objetivo", type: "textarea", required: true, span: "full" },
    { name: "scope", label: "Alcance", type: "textarea", required: true, span: "full" },
    { name: "start_date", label: "Fecha inicio", type: "date" },
    { name: "end_date", label: "Fecha termino", type: "date" },
    { name: "status", label: "Estado", type: "select", options: statusOptions, required: true },
  ],
};

export const treatmentActivityConfig: CrudModuleConfig = {
  key: "catalog",
  title: "Actividades de tratamiento / Catalogo",
  description: "Registro operacional de actividades de tratamiento, finalidades, bases y riesgos.",
  endpoint: "/treatment-activities",
  columns: [
    { key: "name", label: "Actividad" },
    { key: "responsible_or_processor", label: "Responsable" },
    { key: "legal_basis", label: "Base legal" },
    { key: "risk_level", label: "Riesgo", type: "risk" },
    { key: "status", label: "Estado", type: "status" },
  ],
  fields: [
    { name: "name", label: "Nombre", type: "text", required: true },
    { name: "responsible_or_processor", label: "Responsable / encargado", type: "text", required: true },
    { name: "data_categories", label: "Categorias de datos", type: "textarea", required: true, span: "full" },
    { name: "data_subject_universe", label: "Universo de titulares", type: "textarea", required: true, span: "full" },
    { name: "purpose", label: "Finalidad", type: "textarea", required: true, span: "full" },
    { name: "legal_basis", label: "Base de licitud", type: "text", required: true },
    { name: "recipients", label: "Destinatarios", type: "textarea", required: true, span: "full" },
    { name: "international_transfer", label: "Transferencia internacional", type: "toggle" },
    { name: "retention_period", label: "Periodo de retencion", type: "text", required: true },
    { name: "data_source", label: "Fuente de datos", type: "text", required: true },
    { name: "risk_level", label: "Nivel de riesgo", type: "select", options: riskOptions, required: true },
    { name: "status", label: "Estado", type: "select", options: statusOptions, required: true },
  ],
};

export const committeeMemberConfig: CrudModuleConfig = {
  key: "committee-members",
  title: "Comite Ejecutivo - miembros",
  description: "Integrantes titulares y alternos del comite ejecutivo de privacidad.",
  endpoint: "/committee-members",
  columns: [
    { key: "name", label: "Nombre" },
    { key: "role", label: "Rol" },
    { key: "area", label: "Area" },
    { key: "email", label: "Correo" },
    { key: "is_alternate", label: "Alterno", type: "boolean" },
  ],
  fields: [
    { name: "name", label: "Nombre", type: "text", required: true },
    { name: "role", label: "Rol", type: "text", required: true },
    { name: "area", label: "Area", type: "text", required: true },
    { name: "email", label: "Correo", type: "email", required: true },
    { name: "is_alternate", label: "Es alterno", type: "toggle" },
  ],
};

export const committeeSessionConfig: CrudModuleConfig = {
  key: "committee-sessions",
  title: "Comite Ejecutivo - sesiones",
  description: "Sesiones, actas, acuerdos y estado del comite ejecutivo.",
  endpoint: "/committee-sessions",
  columns: [
    { key: "session_date", label: "Fecha", type: "date" },
    { key: "agenda", label: "Agenda" },
    { key: "status", label: "Estado", type: "status" },
  ],
  fields: [
    { name: "session_date", label: "Fecha sesion", type: "date" },
    { name: "agenda", label: "Agenda", type: "textarea", required: true, span: "full" },
    { name: "minutes", label: "Acta", type: "textarea", required: true, span: "full" },
    { name: "agreements", label: "Acuerdos", type: "textarea", required: true, span: "full" },
    { name: "status", label: "Estado", type: "select", options: statusOptions, required: true },
  ],
};

export const findingConfig: CrudModuleConfig = {
  key: "findings",
  title: "Hallazgos",
  description: "Brechas detectadas, recomendaciones, severidad y seguimiento.",
  endpoint: "/findings",
  columns: [
    { key: "title", label: "Hallazgo" },
    { key: "category", label: "Categoria" },
    { key: "risk_level", label: "Riesgo", type: "risk" },
    { key: "status", label: "Estado", type: "status" },
  ],
  fields: [
    { name: "title", label: "Titulo", type: "text", required: true },
    { name: "description", label: "Descripcion", type: "textarea", required: true, span: "full" },
    { name: "category", label: "Categoria", type: "text", required: true },
    { name: "risk_level", label: "Nivel de riesgo", type: "select", options: riskOptions, required: true },
    { name: "recommendation", label: "Recomendacion", type: "textarea", required: true, span: "full" },
    { name: "status", label: "Estado", type: "select", options: statusOptions, required: true },
  ],
};

export const riskConfig: CrudModuleConfig = {
  key: "risks",
  title: "Riesgos",
  description: "Mapa de riesgos con probabilidad, impacto, prioridad, responsables y estado.",
  endpoint: "/risks",
  columns: [
    { key: "title", label: "Riesgo" },
    { key: "probability", label: "Probabilidad" },
    { key: "impact", label: "Impacto" },
    { key: "priority", label: "Prioridad", type: "risk" },
    { key: "status", label: "Estado", type: "status" },
  ],
  fields: [
    { name: "title", label: "Titulo", type: "text", required: true },
    { name: "description", label: "Descripcion", type: "textarea", required: true, span: "full" },
    { name: "probability", label: "Probabilidad", type: "select", options: ["Baja", "Media", "Alta"], required: true },
    { name: "impact", label: "Impacto", type: "select", options: ["Bajo", "Medio", "Alto"], required: true },
    { name: "priority", label: "Prioridad", type: "select", options: priorityOptions, required: true },
    { name: "owner", label: "Responsable", type: "text", required: true },
    { name: "status", label: "Estado", type: "select", options: statusOptions, required: true },
  ],
};

export const actionConfig: CrudModuleConfig = {
  key: "actions",
  title: "Acciones",
  description: "Tareas correctivas o preventivas derivadas de hallazgos, riesgos y comite.",
  endpoint: "/actions",
  columns: [
    { key: "title", label: "Accion" },
    { key: "source_type", label: "Origen" },
    { key: "owner", label: "Responsable" },
    { key: "due_date", label: "Vence", type: "date" },
    { key: "status", label: "Estado", type: "status" },
  ],
  fields: [
    { name: "title", label: "Titulo", type: "text", required: true },
    { name: "description", label: "Descripcion", type: "textarea", required: true, span: "full" },
    { name: "source_type", label: "Tipo origen", type: "select", options: ["Hallazgo", "Riesgo", "Comite", "Ticket"], required: true },
    { name: "source_id", label: "ID origen", type: "number" },
    { name: "owner", label: "Responsable", type: "text", required: true },
    { name: "due_date", label: "Fecha vencimiento", type: "date" },
    { name: "status", label: "Estado", type: "select", options: statusOptions, required: true },
    { name: "evidence_url", label: "URL evidencia", type: "text" },
  ],
};

export const procedureConfig: CrudModuleConfig = {
  key: "procedures",
  title: "Procedimientos",
  description: "Procedimientos internos asociados a riesgos, areas responsables y versiones.",
  endpoint: "/procedures",
  columns: [
    { key: "name", label: "Procedimiento" },
    { key: "type", label: "Tipo" },
    { key: "responsible_area", label: "Area" },
    { key: "version", label: "Version" },
    { key: "status", label: "Estado", type: "status" },
  ],
  fields: [
    { name: "name", label: "Nombre", type: "text", required: true },
    { name: "type", label: "Tipo", type: "text", required: true },
    { name: "risk_associated", label: "Riesgo asociado", type: "text", required: true },
    { name: "responsible_area", label: "Area responsable", type: "text", required: true },
    { name: "status", label: "Estado", type: "select", options: statusOptions, required: true },
    { name: "version", label: "Version", type: "text", required: true },
  ],
};

export const ticketConfig: CrudModuleConfig = {
  key: "tickets",
  title: "Tickets / casos",
  description: "Casos ligeros de privacidad, solicitudes de titulares y tareas operativas.",
  endpoint: "/tickets",
  columns: [
    { key: "subject", label: "Asunto" },
    { key: "type", label: "Tipo" },
    { key: "priority", label: "Prioridad", type: "risk" },
    { key: "assigned_to", label: "Asignado" },
    { key: "status", label: "Estado", type: "status" },
  ],
  fields: [
    { name: "type", label: "Tipo", type: "select", options: ["Derechos titulares", "Incidente", "Consulta", "Proveedor"], required: true },
    { name: "requester_name", label: "Solicitante", type: "text", required: true },
    { name: "requester_email", label: "Correo solicitante", type: "email", required: true },
    { name: "subject", label: "Asunto", type: "text", required: true },
    { name: "description", label: "Descripcion", type: "textarea", required: true, span: "full" },
    { name: "priority", label: "Prioridad", type: "select", options: priorityOptions, required: true },
    { name: "status", label: "Estado", type: "select", options: statusOptions, required: true },
    { name: "assigned_to", label: "Asignado a", type: "text", required: true },
  ],
};

export const consentConfig: CrudModuleConfig = {
  key: "consents",
  title: "Consentimientos",
  description: "Consentimientos otorgados o revocados, canal, texto, version e identidad del titular.",
  endpoint: "/consents",
  columns: [
    { key: "holder_email", label: "Titular" },
    { key: "purpose", label: "Finalidad" },
    { key: "channel", label: "Canal" },
    { key: "policy_version", label: "Politica" },
    { key: "status", label: "Estado", type: "status" },
  ],
  fields: [
    { name: "holder_identifier", label: "Identificador titular", type: "text", required: true },
    { name: "holder_email", label: "Correo titular", type: "email", required: true },
    { name: "purpose", label: "Finalidad", type: "textarea", required: true, span: "full" },
    { name: "policy_version", label: "Version politica", type: "text", required: true },
    { name: "consent_text", label: "Texto consentimiento", type: "textarea", required: true, span: "full" },
    { name: "channel", label: "Canal", type: "text", required: true },
    { name: "ip_address", label: "IP", type: "text", required: true },
    { name: "user_agent", label: "User agent", type: "text", required: true },
    { name: "granted_at", label: "Otorgado en", type: "datetime" },
    { name: "revoked_at", label: "Revocado en", type: "datetime" },
    { name: "status", label: "Estado", type: "select", options: statusOptions, required: true },
  ],
};

export const policyConfig: CrudModuleConfig = {
  key: "policies",
  title: "Politica de tratamiento",
  description: "Versiones, aprobaciones, contenido y estado de la politica de tratamiento de datos.",
  endpoint: "/policies",
  columns: [
    { key: "title", label: "Titulo" },
    { key: "version", label: "Version" },
    { key: "approved_by", label: "Aprobador" },
    { key: "approved_at", label: "Aprobado", type: "date" },
    { key: "status", label: "Estado", type: "status" },
  ],
  fields: [
    { name: "title", label: "Titulo", type: "text", required: true },
    { name: "version", label: "Version", type: "text", required: true },
    { name: "status", label: "Estado", type: "select", options: statusOptions, required: true },
    { name: "approved_by", label: "Aprobado por", type: "text", required: true },
    { name: "approved_at", label: "Fecha aprobacion", type: "date" },
    { name: "content", label: "Contenido", type: "textarea", required: true, span: "full" },
  ],
};
