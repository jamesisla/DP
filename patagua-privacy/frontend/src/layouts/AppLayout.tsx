import type { ReactNode } from "react";
import { useState } from "react";

import { Sidebar } from "../components/Sidebar";
import { Topbar } from "../components/Topbar";
import type { AuthSession } from "../services/api";
import type { AppRoute } from "../types/navigation";

type AppLayoutProps = {
  children: ReactNode;
  session: AuthSession;
  currentPath: AppRoute;
  onNavigate: (path: AppRoute) => void;
  onLogout: () => void;
};

export function AppLayout({ children, session, currentPath, onNavigate, onLogout }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleNavigate(path: AppRoute) {
    onNavigate(path);
    setSidebarOpen(false);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f7f4] text-slate-950">
      <div className="flex min-h-screen">
        {sidebarOpen ? <button className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setSidebarOpen(false)} type="button" /> : null}
        <Sidebar currentPath={currentPath} onNavigate={handleNavigate} open={sidebarOpen} />
        <div className="min-w-0 flex-1">
          <Topbar session={session} onLogout={onLogout} onToggleSidebar={() => setSidebarOpen(true)} />
          <div className="mx-auto max-w-[1480px] px-4 py-6 lg:px-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
