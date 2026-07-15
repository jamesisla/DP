import {
  LayoutDashboard,
  Gauge,
  ClipboardList,
  AlertTriangle,
  FileText,
  UsersRound,
  BookOpenCheck,
  ShieldCheck,
  Database
} from "lucide-react";

export const modules = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "project", label: "Proyecto", icon: Gauge },
  { id: "matrix", label: "Matriz (Wizard)", icon: ClipboardList },
  { id: "risks", label: "Riesgos y Hallazgos", icon: AlertTriangle },
  { id: "documents", label: "Documentos", icon: FileText },
  { id: "committee", label: "Comité Ejecutivo", icon: UsersRound },
  { id: "providers", label: "Terceros/Proveedores", icon: BookOpenCheck },
  { id: "audit", label: "Auditoría", icon: ShieldCheck },
  { id: "oracle", label: "Cumplimiento Técnico BD", icon: Database },
];

