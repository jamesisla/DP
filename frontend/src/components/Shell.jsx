import React, { useEffect, useState } from "react";
import { LogOut, Scale, Bell } from "lucide-react";
import { modules } from "../lib/modules";
import { api, classNames } from "../lib/api";

import { Dashboard } from "../pages/Dashboard";
import { ProjectTasks } from "../pages/ProjectTasks";
import { Wizard } from "../pages/Wizard";
import { Risks } from "../pages/Risks";
import { Documents } from "../pages/Documents";
import { Committee } from "../pages/Committee";
import { Providers } from "../pages/Providers";
import { ArcoRequests } from "../pages/ArcoRequests";
import { SecurityBreaches } from "../pages/SecurityBreaches";
import { AuditLogs } from "../pages/AuditLogs";
import { OracleMissions } from "../pages/OracleMissions";

export function Shell({ session, onLogout }) {
  // Read active tab from window.location.hash or default to dashboard
  const [active, setActive] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return modules.some(m => m.id === hash) ? hash : "dashboard";
  });

  const [data, setData] = useState({
    dashboard: null,
    projects: [],
    areas: [],
    myMatrix: [],
    masterMatrix: [],
    risks: [],
    documents: [],
    providers: [],
    arcoRequests: [],
    breaches: [],
    auditLogs: [],
    users: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync state with URL hash
  function handleNavigate(moduleId) {
    setActive(moduleId);
    window.location.hash = moduleId;
  }

  // Listen to popstate / hashchange for browser back/forward buttons
  useEffect(() => {
    function onHashChange() {
      const hash = window.location.hash.replace("#", "");
      if (modules.some(m => m.id === hash)) {
        setActive(hash);
      }
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

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
        arcoRequests,
        breaches,
        auditLogs,
        users,
      ] = await Promise.all([
        api("/dashboard", session.access_token).catch(() => null),
        api("/projects", session.access_token).catch(() => []),
        api("/areas", session.access_token).catch(() => []),
        api("/matrix/my-area", session.access_token).catch(() => []),
        api("/matrix/master", session.access_token).catch(() => []),
        api("/risks", session.access_token).catch(() => []),
        api("/documents", session.access_token).catch(() => []),
        api("/proveedores", session.access_token).catch(() => []),
        api("/arco", session.access_token).catch(() => []),
        api("/breaches", session.access_token).catch(() => []),
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
        arcoRequests,
        breaches,
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

  // Calculate notification badges
  const stats = data.dashboard?.stats || {};
  const urgentArcoCount = stats.urgent_arco || 0;
  const unnotifiedBreachCount = stats.unnotified_breaches || 0;

  function renderBadge(badgeKey) {
    if (badgeKey === "urgent_arco" && urgentArcoCount > 0) {
      return <span className="ml-auto bg-amber-500 text-white rounded-full px-1.5 py-0.2 text-[10px] font-black">{urgentArcoCount}</span>;
    }
    if (badgeKey === "unnotified_breaches" && unnotifiedBreachCount > 0) {
      return <span className="ml-auto bg-rose-600 text-white rounded-full px-1.5 py-0.2 text-[10px] font-black animate-pulse">{unnotifiedBreachCount}</span>;
    }
    return null;
  }

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
        return <Dashboard data={data.dashboard} onReload={load} onNavigate={handleNavigate} />;
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
      case "arco":
        return (
          <ArcoRequests
            arcoRequests={data.arcoRequests}
            areas={data.areas}
            users={data.users}
            token={session.access_token}
            user={session.user}
            onReload={load}
          />
        );
      case "breaches":
        return (
          <SecurityBreaches
            breaches={data.breaches}
            token={session.access_token}
            user={session.user}
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
      <aside className="hidden w-72 border-r border-line bg-white p-4 lg:block flex flex-col justify-between">
        <div>
          <div className="mb-6 flex items-center gap-3 px-2">
            <div className="grid h-10 w-10 place-items-center rounded bg-brand text-white shadow-sm">
              <Scale size={20} />
            </div>
            <div>
              <p className="font-bold text-sm tracking-tight text-slate-800">SIGE-DP</p>
              <p className="text-[10px] text-teal-700 font-bold uppercase tracking-wider">Ley 21.719 · Chile</p>
            </div>
          </div>
          
          <nav className="space-y-1">
            {modules.map((item) => (
              <button
                className={classNames("nav-item text-xs font-semibold w-full flex items-center justify-between", active === item.id && "nav-item-active")}
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                type="button"
              >
                <div className="flex items-center gap-2.5">
                  <item.icon size={17} />
                  <span>{item.label}</span>
                </div>
                {renderBadge(item.badgeKey)}
              </button>
            ))}
          </nav>
        </div>

        <div className="border-t border-slate-100 pt-3 px-2 text-[10px] text-slate-400 font-medium">
          <p>Servicio de Protección de Datos</p>
          <p className="text-teal-700 font-bold">Plazo Legal: 01-12-2026</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="min-w-0 flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b border-line bg-white px-6 py-4 lg:px-8 shadow-2xs">
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Sistema de Cumplimiento Ley 21.719</p>
            <h1 className="text-lg font-bold text-slate-800">{activeModule?.label}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-slate-800">{session.user.full_name}</p>
              <p className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">
                {session.user.role} {session.user.cargo ? `· ${session.user.cargo}` : ""}
              </p>
            </div>
            <button className="icon-button hover:bg-slate-50 transition-colors p-2 rounded-lg border border-slate-200" onClick={onLogout} title="Cerrar sesión" type="button">
              <LogOut size={17} />
            </button>
          </div>
        </header>

        {/* Mobile selector */}
        <div className="border-b border-line bg-white px-5 py-3 lg:hidden">
          <select className="field text-sm" value={active} onChange={(event) => handleNavigate(event.target.value)}>
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
