import { CrudPage } from "../components/CrudPage";
import { EmptyState } from "../components/EmptyState";
import {
  actionConfig,
  consentConfig,
  dpoConfig,
  findingConfig,
  policyConfig,
  procedureConfig,
  projectConfig,
  riskConfig,
  ticketConfig,
  treatmentActivityConfig,
} from "../data/crudModules";
import type { AppRoute } from "../types/navigation";
import { Settings } from "lucide-react";

const routeConfig = {
  "/dpo": dpoConfig,
  "/proyecto": projectConfig,
  "/matriz": treatmentActivityConfig,
  "/catalogo": treatmentActivityConfig,
  "/hallazgos": findingConfig,
  "/politica": policyConfig,
  "/riesgos": riskConfig,
  "/acciones": actionConfig,
  "/procedimientos": procedureConfig,
  "/tickets": ticketConfig,
  "/consentimientos": consentConfig,
} satisfies Partial<Record<AppRoute, Parameters<typeof CrudPage>[0]["config"]>>;

type ModulePageProps = {
  path: Exclude<AppRoute, "/dashboard" | "/comite" | "/matriz" | "/catalogo" | "/hallazgos" | "/checklist-14ter">;
};

export function ModulePage({ path }: ModulePageProps) {
  if (path === "/configuracion") {
    return (
      <EmptyState
        icon={Settings}
        title="Configuracion"
        description="La configuracion del tenant queda preparada para el siguiente incremento. Los mantenedores principales ya operan con organization_id demo."
      />
    );
  }

  const config = routeConfig[path] ?? projectConfig;
  return <CrudPage config={config} />;
}
