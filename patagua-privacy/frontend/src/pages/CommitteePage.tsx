import { CrudPage } from "../components/CrudPage";
import { PageHeader } from "../components/PageHeader";
import { committeeMemberConfig, committeeSessionConfig } from "../data/crudModules";

export function CommitteePage() {
  return (
    <>
      <PageHeader eyebrow="Mantenedores" title="Comite Ejecutivo" description="Gestiona miembros titulares, alternos y sesiones del comite ejecutivo de privacidad." />
      <div className="space-y-6">
        <CrudPage compactHeader config={committeeMemberConfig} />
        <CrudPage compactHeader config={committeeSessionConfig} />
      </div>
    </>
  );
}
