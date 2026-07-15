export const dashboardStats = [
  { label: "Score cumplimiento", value: "68%", hint: "+6% este mes", status: "medium" },
  { label: "Actividades tratamiento", value: "42", hint: "8 sin validar", status: "low" },
  { label: "Datos sensibles", value: "11", hint: "3 criticos", status: "high" },
  { label: "Brechas criticas", value: "5", hint: "2 vencidas", status: "high" },
  { label: "Riesgos altos", value: "9", hint: "requieren control", status: "high" },
  { label: "Tickets abiertos", value: "18", hint: "4 urgentes", status: "medium" },
  { label: "Consentimientos", value: "1.284", hint: "97% vigentes", status: "low" },
  { label: "Proximo comite", value: "28 Jun", hint: "10:00 AM", status: "low" },
] as const;

export const topRisks = [
  { name: "Transferencias internacionales sin anexo", owner: "Legal", level: "alto", status: "abierto" },
  { name: "Base de licitud incompleta en marketing", owner: "Comercial", level: "alto", status: "en progreso" },
  { name: "Retencion documental no parametrizada", owner: "Operaciones", level: "medio", status: "pendiente" },
];

export const priorityFindings = [
  { finding: "No existe registro consolidado de actividades", impact: "Alto", dueDate: "24 Jun", status: "critico" },
  { finding: "Politica de privacidad requiere version aprobada", impact: "Medio", dueDate: "30 Jun", status: "en progreso" },
  { finding: "Canal de derechos ARCO sin SLA formal", impact: "Alto", dueDate: "02 Jul", status: "abierto" },
];

export const pendingActions = [
  { action: "Validar matriz con Personas", owner: "DPO", dueDate: "Hoy", status: "pendiente" },
  { action: "Enviar politica a Comite Ejecutivo", owner: "Legal", dueDate: "Manana", status: "en progreso" },
  { action: "Cerrar evidencias de consentimiento web", owner: "Marketing", dueDate: "26 Jun", status: "pendiente" },
];

export const instrumentStatus = [
  { name: "DPO", progress: 85, status: "vigente" },
  { name: "Matriz", progress: 62, status: "en progreso" },
  { name: "Catalogo", progress: 74, status: "en progreso" },
  { name: "Politica", progress: 48, status: "pendiente" },
  { name: "Procedimientos", progress: 35, status: "pendiente" },
];

export const moduleSummaries = {
  "/dpo": {
    title: "DPO",
    description: "Responsables, evidencias, calendario de obligaciones y seguimiento del rol.",
    rows: [
      ["DPO titular", "Administrador Patagua", "Vigente"],
      ["Canal de contacto", "privacidad@empresa.cl", "Publicado"],
      ["Reporte mensual", "Junio 2026", "Pendiente"],
    ],
  },
  "/proyecto": {
    title: "Proyecto de implementacion",
    description: "Plan ejecutivo, hitos, responsables y avance global del programa.",
    rows: [
      ["Diagnostico inicial", "DPO", "Completado"],
      ["Levantamiento por areas", "Operaciones", "En progreso"],
      ["Plan de controles", "Riesgos", "Pendiente"],
    ],
  },
  "/matriz": {
    title: "Matriz de levantamiento",
    description: "Inventario de datos, titulares, finalidades, bases de licitud y encargados.",
    rows: [
      ["Personas", "12 actividades", "En progreso"],
      ["Comercial", "8 actividades", "Requiere revision"],
      ["Soporte", "6 actividades", "Pendiente"],
    ],
  },
  "/catalogo": {
    title: "Catalogo de actividades",
    description: "Registro operativo de actividades de tratamiento y sus atributos principales.",
    rows: [
      ["Gestion de colaboradores", "Personas", "Medio"],
      ["Prospeccion comercial", "Comercial", "Alto"],
      ["Atencion de solicitudes", "Legal", "Medio"],
    ],
  },
  "/comite": {
    title: "Comite Ejecutivo",
    description: "Sesiones, acuerdos, responsables y decisiones del gobierno de privacidad.",
    rows: [
      ["Sesion junio", "28 Jun", "Programada"],
      ["Aprobacion politica", "Legal", "Pendiente"],
      ["Reporte de riesgos", "DPO", "Listo"],
    ],
  },
  "/hallazgos": {
    title: "Hallazgos",
    description: "Brechas identificadas, prioridad, impacto y recomendaciones asociadas.",
    rows: [
      ["Registro incompleto", "Alto", "Abierto"],
      ["Politica desactualizada", "Medio", "En progreso"],
      ["SLA no documentado", "Alto", "Pendiente"],
    ],
  },
  "/politica": {
    title: "Politica de tratamiento",
    description: "Versiones, aprobaciones y estado de publicacion de politicas de privacidad.",
    rows: [
      ["Politica general", "v0.8", "En revision"],
      ["Aviso web", "v1.0", "Publicado"],
      ["Anexo colaboradores", "v0.4", "Pendiente"],
    ],
  },
  "/riesgos": {
    title: "Riesgos",
    description: "Mapa de riesgos, severidad, probabilidad, controles y residualidad.",
    rows: [
      ["Datos sensibles sin control reforzado", "Alto", "Abierto"],
      ["Encargados sin clausula", "Medio", "En progreso"],
      ["Retencion excesiva", "Medio", "Pendiente"],
    ],
  },
  "/procedimientos": {
    title: "Procedimientos",
    description: "Procedimientos internos para derechos, incidentes, consentimientos y retencion.",
    rows: [
      ["Derechos titulares", "Legal", "En progreso"],
      ["Gestion de incidentes", "Seguridad", "Pendiente"],
      ["Revocacion consentimiento", "Marketing", "Publicado"],
    ],
  },
  "/tickets": {
    title: "Tickets",
    description: "Casos ligeros de privacidad, solicitudes, tareas y seguimiento operativo.",
    rows: [
      ["Solicitud acceso datos", "Derechos titulares", "Abierto"],
      ["Revision proveedor CRM", "Encargados", "En progreso"],
      ["Consulta consentimiento", "Marketing", "Nuevo"],
    ],
  },
  "/consentimientos": {
    title: "Consentimientos",
    description: "Consentimientos registrados, vigencia, canal, finalidad y revocaciones.",
    rows: [
      ["Formulario web", "1.032 vigentes", "Estable"],
      ["Portal empleo", "188 vigentes", "Revisar texto"],
      ["Newsletter", "64 revocados", "Normal"],
    ],
  },
  "/configuracion": {
    title: "Configuracion",
    description: "Parametros del tenant, usuarios, roles y preferencias de la plataforma.",
    rows: [
      ["Tenant", "Cliente demo", "Activo"],
      ["Usuarios", "4 activos", "OK"],
      ["Autenticacion", "JWT simple", "MVP"],
    ],
  },
} as const;
