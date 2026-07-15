import {
  AlertTriangle,
  Archive,
  ClipboardList,
  FileCheck2,
  FileText,
  Gauge,
  LayoutDashboard,
  ListChecks,
  MessageSquareText,
  SquareCheckBig,
  Scale,
  Settings,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import type { AppRoute, NavigationItem } from "../types/navigation";

export const navigationItems: NavigationItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/dpo", label: "DPO", icon: ShieldCheck },
  { path: "/proyecto", label: "Proyecto", icon: Gauge },
  { path: "/matriz", label: "Matriz de levantamiento", icon: ClipboardList },
  { path: "/catalogo", label: "Catalogo", icon: ListChecks },
  { path: "/comite", label: "Comite Ejecutivo", icon: UsersRound },
  { path: "/hallazgos", label: "Hallazgos", icon: AlertTriangle },
  { path: "/checklist-14ter", label: "Checklist 14 ter", icon: ListChecks },
  { path: "/politica", label: "Politica", icon: FileText },
  { path: "/riesgos", label: "Riesgos", icon: Scale },
  { path: "/acciones", label: "Acciones", icon: SquareCheckBig },
  { path: "/procedimientos", label: "Procedimientos", icon: FileCheck2 },
  { path: "/tickets", label: "Tickets", icon: MessageSquareText },
  { path: "/consentimientos", label: "Consentimientos", icon: Archive },
  { path: "/configuracion", label: "Configuracion", icon: Settings },
];

type SidebarProps = {
  currentPath: AppRoute;
  onNavigate: (path: AppRoute) => void;
  open: boolean;
};

export function Sidebar({ currentPath, onNavigate, open }: SidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-black/10 bg-[#0d0d0d] px-4 py-4 text-white transition-transform lg:static lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#19c37d] text-sm font-bold text-slate-950">P</div>
        <div>
          <p className="font-semibold tracking-tight">Patagua Privacy</p>
          <p className="text-xs text-white/50">Compliance OS</p>
        </div>
      </div>

      <nav className="space-y-1">
        {navigationItems.map((item) => {
          const active = currentPath === item.path;
          return (
            <button
              className={`flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition ${
                active ? "bg-white text-slate-950 shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
              key={item.path}
              onClick={() => onNavigate(item.path)}
              type="button"
            >
              <item.icon size={18} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
