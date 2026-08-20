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
  Database
} from "lucide-react";

export const modules = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "project", label: "Proyecto", icon: Gauge },
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
