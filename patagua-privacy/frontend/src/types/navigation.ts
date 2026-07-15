import type { LucideIcon } from "lucide-react";

export type AppRoute =
  | "/dashboard"
  | "/dpo"
  | "/proyecto"
  | "/matriz"
  | "/catalogo"
  | "/comite"
  | "/hallazgos"
  | "/checklist-14ter"
  | "/politica"
  | "/riesgos"
  | "/acciones"
  | "/procedimientos"
  | "/tickets"
  | "/consentimientos"
  | "/configuracion";

export type NavigationItem = {
  path: AppRoute;
  label: string;
  icon: LucideIcon;
};
