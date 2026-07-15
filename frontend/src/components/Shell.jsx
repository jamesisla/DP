import React, { useEffect, useState } from "react";
import { LogOut, Scale } from "lucide-react";
import { modules } from "../lib/modules";
import { api, classNames } from "../lib/api";

import { Dashboard } from "../pages/Dashboard";
import { ProjectTasks } from "../pages/ProjectTasks";
import { Wizard } from "../pages/Wizard";
import { Risks } from "../pages/Risks";
import { Documents } from "../pages/Documents";
import { Committee } from "../pages/Committee";
import { Providers } from "../pages/Providers";
import { AuditLogs } from "../pages/AuditLogs";
import { OracleMissions } from "../pages/OracleMissions";

export function Shell({ session, onLogout }) {
  const [active, setActive] = useState("dashboard");
  const [data, setData] = useState({
    dashboard: null,
    projects: [],
    areas: [],
    myMatrix: [],
    masterMatrix: [],
    risks: [],
    documents: [],
    providers: [],
    auditLogs: [],
    users: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    try {
      const [
        dashboard,
        projects,
        areas,
        myMatrix,
        masterMatrix,
        risks,
        documents,
        providers,
        auditLogs,
        users,
      ] = await Promise.all([
        api("/dashboard", session.access_token),
        api("/projects", session.access_token),
        api("/areas", session.access_token).catch(() => []),
        api("/matrix/my-area", session.access_token).catch(() => []),
        api("/matrix/master", session.access_token).catch(() => []),
        api("/risks", session.access_token).catch(() => []),
        api("/documents", session.access_token).catch(() => []),
        api("/proveedores", session.access_token).catch(() => []),
        api("/audit-logs", session.access_token).catch(() => []),
        api("/users", session.access_token).catch(() => []),
      ]);
      
      setData({
        dashboard,
        projects,
        areas,
        myMatrix,
        masterMatrix,
        risks,
        documents,
        providers,
        auditLogs,
        users,
      });
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setError(err);
      if (err.message && (err.message.includes("sesion") || err.message.includes("validar") || err.message.includes("token") || err.message.includes("401"))) {
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [session.access_token]);

  const activeModule = modules.find((item) => item.id === active);

  function renderContent() {
    if (error) {
      return (
        <div className="p-8 text-center bg-rose-50 border border-rose-200 text-rose-800 rounded-xl m-6 max-w-xl mx-auto shadow-sm">
          <h3 className="font-bold text-sm">Error al cargar datos de la plataforma</h3>
          <p className="text-xs mt-2 font-mono bg-white p-3 rounded border border-rose-150 break-words">{error.message || String(error)}</p>
          <button 
            onClick={() => { setError(null); load(); }} 
            className="mt-4 bg-brand text-white px-4 py-2 rounded text-xs font-bold shadow-sm hover:bg-opacity-90"
          >
            Reintentar
          </button>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex h-64 items-center justify-center text-slate-500">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent mx-auto mb-3"></div>
            <p className="text-sm font-semibold">Cargando plataforma de cumplimiento...</p>
          </div>
        </div>
      );
    }

    switch (active) {
      case "dashboard":
        return <Dashboard data={data.dashboard} onReload={load} />;
      case "project":
        return (
          <ProjectTasks
            projects={data.projects}
            token={session.access_token}
            user={session.user}
            users={data.users}
            areas={data.areas}
            onReload={load}
          />
        );
      case "matrix":
        return (
          <Wizard
            myMatrix={data.myMatrix}
            masterMatrix={data.masterMatrix}
            areas={data.areas}
            user={session.user}
            token={session.access_token}
            onReload={load}
          />
        );
      case "risks":
        return (
          <Risks
            risks={data.risks}
            masterMatrix={data.masterMatrix}
            token={session.access_token}
            onReload={load}
          />
        );
      case "documents":
        return (
          <Documents
            documents={data.documents}
            token={session.access_token}
            user={session.user}
            onReload={load}
          />
        );
      case "committee":
        return (
          <Committee
            documents={data.documents}
            token={session.access_token}
            user={session.user}
            onReload={load}
          />
        );
      case "providers":
        return (
          <Providers
            providers={data.providers}
            areas={data.areas}
            token={session.access_token}
            onReload={load}
          />
        );
      case "audit":
        return (
          <AuditLogs
            auditLogs={data.auditLogs}
            token={session.access_token}
            onReload={load}
          />
        );
      case "oracle":
        return <OracleMissions />;
      default:
        return <div className="p-8">Módulo no implementado: {active}</div>;
    }
  }

  return (
    <main className="flex min-h-screen bg-cloud text-ink">
      {/* Sidebar Desktop */}
      <aside className="hidden w-72 border-r border-line bg-white p-4 lg:block">
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="grid h-10 w-10 place-items-center rounded bg-brand text-white">
            <Scale size={20} />
          </div>
          <div>
            <p className="font-bold text-sm tracking-tight text-slate-800">SIGE-DP</p>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Servicio del Estado</p>
          </div>
        </div>
        
        <nav className="space-y-1">
          {modules.map((item) => (
            <button
              className={classNames("nav-item text-sm", active === item.id && "nav-item-active")}
              key={item.id}
              onClick={() => setActive(item.id)}
              type="button"
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <section className="min-w-0 flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b border-line bg-white px-6 py-4 lg:px-8 shadow-sm">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">SIGE-DP Ley 21.719</p>
            <h1 className="text-lg font-bold text-slate-800">{activeModule?.label}</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">{session.user.full_name}</p>
              <p className="text-[10px] uppercase font-bold text-teal-600 tracking-wider">
                {session.user.role}
              </p>
            </div>
            <button className="icon-button hover:bg-slate-50 transition-colors" onClick={onLogout} title="Cerrar sesión" type="button">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Mobile selector */}
        <div className="border-b border-line bg-white px-5 py-3 lg:hidden">
          <select className="field text-sm" value={active} onChange={(event) => setActive(event.target.value)}>
            {modules.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto bg-cloud">
          {renderContent()}
        </div>
      </section>
    </main>
  );
}
