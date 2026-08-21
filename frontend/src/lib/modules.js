import {
  LayoutDashboard,
  Gauge,
  ClipboardList,
  AlertTriangle,
  FileText,
  UsersRound,
  BookOpenCheck,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  Database,
  Server,
  Activity,
  Layers,
  FileCode,
  Radio,
  Sliders,
  Flame
} from "lucide-react";

export const suites = [
  {
    id: "data_protection",
    name: "Protección de Datos",
    law: "Ley 21.719",
    color: "teal",
    shortName: "Datos Personales"
  },
  {
    id: "cybersecurity",
    name: "Ciberseguridad & ANCI",
    law: "Ley 21.663",
    color: "indigo",
    shortName: "Ciberseguridad"
  }
];

export const dataProtectionModules = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "project", label: "Proyecto (6 Fases)", icon: Gauge },
  { id: "matrix", label: "Matriz (Wizard)", icon: ClipboardList },
  { id: "risks", label: "Riesgos y EIPD", icon: AlertTriangle },
  { id: "documents", label: "Documentos", icon: FileText },
  { id: "committee", label: "Comité Ejecutivo", icon: UsersRound },
  { id: "providers", label: "Terceros/Proveedores", icon: BookOpenCheck },
  { id: "arco", label: "Derechos ARCO+ (15d)", icon: UserCheck, badgeKey: "urgent_arco" },
  { id: "breaches", label: "Brechas (72h)", icon: ShieldAlert, badgeKey: "unnotified_breaches" },
  { id: "audit", label: "Auditoría & ZIP", icon: ShieldCheck },
  { id: "oracle", label: "Cumplimiento Técnico BD", icon: Database },
];

export const cybersecurityModules = [
  { id: "cyber_dashboard", label: "Dashboard ANCI", icon: LayoutDashboard },
  { id: "cyber_phases", label: "Ruta Metodológica (6 Fases)", icon: Gauge },
  { id: "cyber_assets", label: "Activos Críticos (RSIC / OIV)", icon: Server },
  { id: "cyber_risks", label: "Matriz Riesgos 5x5 & Gap", icon: AlertTriangle },
  { id: "cyber_maturity", label: "Madurez NIST / ANCI", icon: Activity },
  { id: "cyber_incidents", label: "Incidentes ANCI (3h / 72h)", icon: Radio, badgeKey: "urgent_3h" },
  { id: "cyber_simulations", label: "Simulador de Crisis / War Games", icon: Flame },
  { id: "cyber_policies", label: "Políticas & Planes PRI/BCP", icon: FileCode },
  { id: "cyber_audit", label: "Expediente ANCI (ZIP)", icon: ShieldCheck },
];

// Default export for backward compatibility
export const modules = dataProtectionModules;
