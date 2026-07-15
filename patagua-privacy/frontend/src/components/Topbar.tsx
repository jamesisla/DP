import { LogOut, Menu, Search } from "lucide-react";

import type { AuthSession } from "../services/api";

type TopbarProps = {
  session: AuthSession;
  onLogout: () => void;
  onToggleSidebar: () => void;
};

export function Topbar({ session, onLogout, onToggleSidebar }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-[#f7f7f4]/85 px-4 py-3 backdrop-blur-xl lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button className="grid h-10 w-10 place-items-center rounded-lg border border-black/10 bg-white text-slate-700 shadow-sm lg:hidden" onClick={onToggleSidebar} type="button">
            <Menu size={19} />
          </button>
          <div className="hidden h-10 w-80 items-center gap-2 rounded-xl border border-black/10 bg-white px-3 text-slate-500 shadow-sm md:flex">
            <Search size={17} />
            <span className="text-sm">Buscar modulo, riesgo o actividad</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-950">{session.user.full_name}</p>
            <p className="text-xs text-slate-500">{session.user.role}</p>
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-xl border border-black/10 bg-white text-slate-700 shadow-sm hover:bg-slate-50" onClick={onLogout} title="Salir" type="button">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
