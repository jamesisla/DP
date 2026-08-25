import React, { useEffect, useState } from "react";
import { LogOut, Scale, ShieldAlert, ShieldCheck, Server, Radio, Activity, Lock, Layers, Bell, AlertTriangle, Clock, CheckCircle, Globe } from "lucide-react";
import { suites, dataProtectionModules, cybersecurityModules } from "../lib/modules";
import { api, classNames, API_URL } from "../lib/api";
import { CitizenPortalModal } from "./CitizenPortalModal";

// Data Protection Pages (Ley 21.719)
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
import { TrainingCampaigns } from "../pages/TrainingCampaigns";
import { OpenSourcePrivacy } from "../pages/OpenSourcePrivacy";

// Cybersecurity Pages (Ley 21.663 / ANCI)
import { CyberDashboard } from "../pages/cyber/CyberDashboard";
import { CyberPhases } from "../pages/cyber/CyberPhases";
import { CyberAssets } from "../pages/cyber/CyberAssets";
import { CyberRisks } from "../pages/cyber/CyberRisks";
import { CyberMaturity } from "../pages/cyber/CyberMaturity";
import { CyberIncidents } from "../pages/cyber/CyberIncidents";
import { CyberSimulations } from "../pages/cyber/CyberSimulations";
import { CyberPolicies } from "../pages/cyber/CyberPolicies";
import { CyberTraining } from "../pages/cyber/CyberTraining";
import { CyberAudit } from "../pages/cyber/CyberAudit";
import { OpenSourceCyber } from "../pages/cyber/OpenSourceCyber";

export function Shell({ session, onLogout }) {
  // Determine initial suite and active module from window.location.hash
  const [active, setActive] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    if (cybersecurityModules.some(m => m.id === hash)) return hash;
    if (dataProtectionModules.some(m => m.id === hash)) return hash;
    return "dashboard";
  });

  const [activeSuite, setActiveSuite] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return hash.startsWith("cyber_") ? "cybersecurity" : "data_protection";
  });

  const [data, setData] = useState({
    // Suite 1: Data Protection
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
    trainingCampaigns: [],
    // Suite 2: Cybersecurity
    cyberDashboard: null,
    cyberProjects: [],
    cyberFases: [],
    cyberAssets: [],
    cyberRisks: [],
    cyberIncidents: [],
    cyberMaturity: [],
    cyberSimulations: [],
    cyberPolicies: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [citizenModalOpen, setCitizenModalOpen] = useState(false);

  function handleNavigate(moduleId) {
    setActive(moduleId);
    window.location.hash = moduleId;
    if (moduleId.startsWith("cyber_")) {
      setActiveSuite("cybersecurity");
    } else {
      setActiveSuite("data_protection");
    }
  }

  function handleSwitchSuite(suiteId) {
    setActiveSuite(suiteId);
    if (suiteId === "cybersecurity") {
      handleNavigate("cyber_dashboard");
    } else {
      handleNavigate("dashboard");
    }
  }

  useEffect(() => {
    function onHashChange() {
      const hash = window.location.hash.replace("#", "");
      if (cybersecurityModules.some(m => m.id === hash)) {
        setActive(hash);
        setActiveSuite("cybersecurity");
      } else if (dataProtectionModules.some(m => m.id === hash)) {
        setActive(hash);
        setActiveSuite("data_protection");
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
        trainingCampaigns,
        cyberDashboard,
        cyberProjects,
        cyberFases,
        cyberAssets,
        cyberRisks,
        cyberIncidents,
        cyberMaturity,
        cyberSimulations,
        cyberPolicies,
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
        api("/training/campaigns", session.access_token).catch(() => []),
        // Cyber suite calls
        api("/cyber/dashboard", session.access_token).catch(() => null),
        api("/cyber/project", session.access_token).catch(() => []),
        api("/cyber/fases", session.access_token).catch(() => []),
        api("/cyber/assets", session.access_token).catch(() => []),
        api("/cyber/risks", session.access_token).catch(() => []),
        api("/cyber/incidents", session.access_token).catch(() => []),
        api("/cyber/maturity", session.access_token).catch(() => []),
        api("/cyber/simulations", session.access_token).catch(() => []),
        api("/cyber/policies", session.access_token).catch(() => []),
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
        trainingCampaigns,
        cyberDashboard,
        cyberProjects,
        cyberFases,
        cyberAssets,
        cyberRisks,
        cyberIncidents,
        cyberMaturity,
        cyberSimulations,
        cyberPolicies,
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

  const currentModules = activeSuite === "cybersecurity" ? cybersecurityModules : dataProtectionModules;
  const activeModule = currentModules.find((item) => item.id === active) || currentModules[0];

  // Calculate notification badges and real-time hub
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dpStats = data.dashboard?.stats || {};
  const urgentArco = (data.arcoRequests || []).filter(a => !["Respondida favorable", "Rechazada fundada"].includes(a.estado));
  const unnotifiedBreaches = (data.breaches || []).filter(b => !b.notificado_agencia && b.estado !== "Mitigado y Cerrado");
  const urgent3h = (data.cyberIncidents || []).filter(i => !i.alerta_3h_enviada_anci && i.estado !== "Mitigado y Notificado");
  const unprotectedAssets = (data.cyberAssets || []).filter(a => !a.mfa_activo || !a.respaldo_inmutable);
  const totalAlerts = urgent3h.length + urgentArco.length + unnotifiedBreaches.length + (unprotectedAssets.length > 0 ? 1 : 0);

  const urgentArcoCount = urgentArco.length || dpStats.urgent_arco || 0;
  const unnotifiedBreachCount = unnotifiedBreaches.length || dpStats.unnotified_breaches || 0;
  const urgent3hCyberCount = urgent3h.length || data.cyberDashboard?.urgent_3h_count || 0;

  function renderBadge(badgeKey) {
    if (badgeKey === "urgent_arco" && urgentArcoCount > 0) {
      return <span className="ml-auto bg-amber-500 text-white rounded-full px-1.5 py-0.2 text-[10px] font-black">{urgentArcoCount}</span>;
    }
    if (badgeKey === "unnotified_breaches" && unnotifiedBreachCount > 0) {
      return <span className="ml-auto bg-rose-600 text-white rounded-full px-1.5 py-0.2 text-[10px] font-black animate-pulse">{unnotifiedBreachCount}</span>;
    }
    if (badgeKey === "urgent_3h" && urgent3hCyberCount > 0) {
      return <span className="ml-auto bg-rose-600 text-white rounded-full px-1.5 py-0.2 text-[10px] font-black animate-bounce">{urgent3hCyberCount}</span>;
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
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-3"></div>
            <p className="text-sm font-semibold">Cargando plataforma de cumplimiento y ciberseguridad...</p>
          </div>
        </div>
      );
    }

    // Suite 1: Data Protection Pages
    switch (active) {
      case "dashboard":
        return <Dashboard data={data.dashboard} token={session.access_token} onReload={load} onNavigate={handleNavigate} />;
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
      case "training":
        return (
          <TrainingCampaigns
            campaigns={data.trainingCampaigns}
            areas={data.areas}
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
      case "opensource_privacy":
        return <OpenSourcePrivacy token={session.access_token} />;
      case "oracle":
        return <OracleMissions />;

      // Suite 2: Cybersecurity Pages (Ley 21.663)
      case "cyber_dashboard":
        return (
          <CyberDashboard
            data={data.cyberDashboard}
            token={session.access_token}
            onReload={load}
            onNavigate={handleNavigate}
          />
        );
      case "cyber_phases":
        return (
          <CyberPhases
            fases={data.cyberFases}
            token={session.access_token}
            user={session.user}
            onReload={load}
          />
        );
      case "cyber_assets":
        return (
          <CyberAssets
            assets={data.cyberAssets}
            areas={data.areas}
            token={session.access_token}
            user={session.user}
            onReload={load}
          />
        );
      case "cyber_risks":
        return (
          <CyberRisks
            risks={data.cyberRisks}
            assets={data.cyberAssets}
            token={session.access_token}
            user={session.user}
            onReload={load}
          />
        );
      case "cyber_maturity":
        return (
          <CyberMaturity
            maturityList={data.cyberMaturity}
            token={session.access_token}
            user={session.user}
            onReload={load}
          />
        );
      case "cyber_incidents":
        return (
          <CyberIncidents
            incidents={data.cyberIncidents}
            token={session.access_token}
            user={session.user}
            onReload={load}
          />
        );
      case "cyber_simulations":
        return (
          <CyberSimulations
            simulations={data.cyberSimulations}
            token={session.access_token}
            user={session.user}
            onReload={load}
          />
        );
      case "cyber_training":
        return (
          <CyberTraining
            campaigns={data.trainingCampaigns}
            areas={data.areas}
            token={session.access_token}
            user={session.user}
            onReload={load}
          />
        );
      case "cyber_opensource":
        return <OpenSourceCyber token={session.access_token} />;
      case "cyber_policies":
        return (
          <CyberPolicies
            policies={data.cyberPolicies}
            token={session.access_token}
            user={session.user}
            onReload={load}
          />
        );
      case "cyber_providers":
        return (
          <Providers
            providers={data.providers}
            areas={data.areas}
            token={session.access_token}
            onReload={load}
            isCyber={true}
          />
        );
      case "cyber_audit":
        return <CyberAudit token={session.access_token} />;

      default:
        return <div className="p-8">Módulo no implementado: {active}</div>;
    }
  }

  const isCyber = activeSuite === "cybersecurity";

  return (
    <main className="flex min-h-screen bg-cloud text-ink font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden w-72 border-r border-line bg-white p-4 lg:flex flex-col justify-between h-screen sticky top-0 overflow-y-auto shrink-0">
        <div>
          {/* Logo & Suite Identifier */}
          <div className="mb-4 flex items-center gap-3 px-2">
            <div className={`grid h-10 w-10 place-items-center rounded shadow-sm text-white ${isCyber ? "bg-indigo-600" : "bg-brand"}`}>
              {isCyber ? <Lock size={20} /> : <Scale size={20} />}
            </div>
            <div>
              <p className="font-bold text-sm tracking-tight text-slate-800">
                {isCyber ? "LEXAPP · CIBER" : "LEXAPP · DATOS"}
              </p>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isCyber ? "text-indigo-600" : "text-teal-700"}`}>
                {isCyber ? "Ley 21.663 · Ciberseguridad" : "Ley 21.719 · Datos Personales"}
              </p>
            </div>
          </div>

          {/* Unified Suite Switcher Pill */}
          <div className="mb-4 p-1 bg-slate-100 rounded-lg border border-slate-200 grid grid-cols-2 text-center text-xs font-bold">
            <button
              type="button"
              onClick={() => handleSwitchSuite("data_protection")}
              className={`py-1.5 px-2 rounded-md transition-all ${!isCyber ? "bg-white text-teal-800 shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              Datos (L21.719)
            </button>
            <button
              type="button"
              onClick={() => handleSwitchSuite("cybersecurity")}
              className={`py-1.5 px-2 rounded-md transition-all ${isCyber ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              Ciber (L21.663)
            </button>
          </div>
          
          {/* Navigation Links */}
          <nav className="space-y-1">
            {currentModules.map((item) => (
              <button
                className={classNames(
                  "nav-item text-xs font-semibold w-full flex items-center justify-between",
                  active === item.id && (isCyber ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "nav-item-active")
                )}
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

        {/* Footer info */}
        <div className="border-t border-slate-100 pt-3 px-2 text-[10px] text-slate-400 font-medium">
          <p>{isCyber ? "Agencia Nacional de Ciberseguridad (ANCI)" : "Servicio de Protección de Datos"}</p>
          <p className={isCyber ? "text-indigo-600 font-bold" : "text-teal-700 font-bold"}>
            {isCyber ? "Marco Regulatorio OIV / PSE" : "Plazo Legal: 01-12-2026"}
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="min-w-0 flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b border-line bg-white px-6 py-4 lg:px-8 shadow-2xs">
          <div className="flex items-center gap-4">
            <div>
              <p className={`text-[11px] font-bold uppercase tracking-wider ${isCyber ? "text-indigo-600" : "text-teal-700"}`}>
                {isCyber ? "Suite de Ciberseguridad · Ley N° 21.663 (ANCI)" : "Suite de Datos Personales · Ley N° 21.719"}
              </p>
              <h1 className="text-lg font-bold text-slate-800">{activeModule?.label}</h1>
            </div>

            {/* Header Suite Quick Selector */}
            <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold ml-4">
              <button
                type="button"
                onClick={() => handleSwitchSuite("data_protection")}
                className={`px-3 py-1 rounded transition-all ${!isCyber ? "bg-white text-teal-800 shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Protección de Datos
              </button>
              <button
                type="button"
                onClick={() => handleSwitchSuite("cybersecurity")}
                className={`px-3 py-1 rounded transition-all ${isCyber ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Ciberseguridad (ANCI)
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            
            {/* Citizen Portal & CVD Trigger */}
            <button
              type="button"
              onClick={() => setCitizenModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-xs font-bold text-slate-700 shadow-2xs"
              title="Ventanilla Única Ciudadana: Consulta ARCO+ y Canal CVD"
            >
              <Globe size={15} className="text-teal-600" />
              <span className="hidden sm:inline">Portal Ciudadano & CVD</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600"
                title="Centro de Alertas GRC"
              >
                <Bell size={17} />
                {totalAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-600 text-white font-black text-[9px] flex items-center justify-center animate-pulse">
                    {totalAlerts}
                  </span>
                )}
              </button>

              {/* Notification Popover Drawer */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-xl z-50 p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-xs uppercase font-bold text-slate-800 tracking-wider">Centro de Alertas GRC</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {totalAlerts} pendientes
                    </span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto text-xs">
                    {urgent3h.length > 0 && (
                      <div 
                        onClick={() => { handleNavigate("cyber_incidents"); setNotificationsOpen(false); }}
                        className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 cursor-pointer hover:bg-rose-100/70 transition-colors space-y-1"
                      >
                        <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                          <Radio size={13} className="animate-bounce text-rose-600" />
                          <span>Alerta ANCI &lt;3 Horas ({urgent3h.length})</span>
                        </div>
                        <p className="text-[11px] text-rose-900">Incidentes críticos pendientes de notificación perentoria a la ANCI.</p>
                      </div>
                    )}

                    {urgentArco.length > 0 && (
                      <div 
                        onClick={() => { handleNavigate("arco"); setNotificationsOpen(false); }}
                        className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 cursor-pointer hover:bg-amber-100/70 transition-colors space-y-1"
                      >
                        <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                          <Clock size={13} className="text-amber-600" />
                          <span>Derechos ARCO+ Pendientes ({urgentArco.length})</span>
                        </div>
                        <p className="text-[11px] text-amber-900">Solicitudes ciudadanas bajo el plazo legal de 15 días hábiles.</p>
                      </div>
                    )}

                    {unnotifiedBreaches.length > 0 && (
                      <div 
                        onClick={() => { handleNavigate("breaches"); setNotificationsOpen(false); }}
                        className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 cursor-pointer hover:bg-rose-100/70 transition-colors space-y-1"
                      >
                        <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                          <ShieldAlert size={13} className="text-rose-600" />
                          <span>Brechas de Privacidad (72h)</span>
                        </div>
                        <p className="text-[11px] text-rose-900">Incidentes de datos personales que requieren aviso a la autoridad.</p>
                      </div>
                    )}

                    {unprotectedAssets.length > 0 && (
                      <div 
                        onClick={() => { handleNavigate("cyber_assets"); setNotificationsOpen(false); }}
                        className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 cursor-pointer hover:bg-indigo-100/70 transition-colors space-y-1"
                      >
                        <div className="flex items-center gap-1.5 text-indigo-800 font-bold">
                          <Server size={13} className="text-indigo-600" />
                          <span>{unprotectedAssets.length} Activos RSIC Incompletos</span>
                        </div>
                        <p className="text-[11px] text-indigo-900">Sistemas críticos sin MFA forzado o respaldo inmutable WORM.</p>
                      </div>
                    )}

                    {totalAlerts === 0 && (
                      <div className="py-6 text-center text-slate-400">
                        <CheckCircle size={24} className="mx-auto text-emerald-500 mb-1" />
                        <p className="font-semibold text-xs text-slate-700">Sin alertas urgentes pendientes</p>
                        <p className="text-[10px]">Todos los plazos y controles están conformes.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-slate-800">{session.user.full_name}</p>
              <p className={`text-[10px] uppercase font-bold tracking-wider ${isCyber ? "text-indigo-600" : "text-teal-700"}`}>
                {session.user.role} {session.user.cargo ? `· ${session.user.cargo}` : ""}
              </p>
            </div>

            <button className="icon-button hover:bg-slate-50 transition-colors p-2 rounded-lg border border-slate-200" onClick={onLogout} title="Cerrar sesión" type="button">
              <LogOut size={17} />
            </button>
          </div>
        </header>

        {/* Mobile selector */}
        <div className="border-b border-line bg-white px-5 py-3 lg:hidden flex flex-col gap-2">
          <div className="grid grid-cols-2 text-center text-xs font-bold bg-slate-100 p-1 rounded">
            <button
              onClick={() => handleSwitchSuite("data_protection")}
              className={`py-1 rounded ${!isCyber ? "bg-white text-teal-800 font-bold" : "text-slate-500"}`}
            >
              Datos
            </button>
            <button
              onClick={() => handleSwitchSuite("cybersecurity")}
              className={`py-1 rounded ${isCyber ? "bg-white text-indigo-700 font-bold" : "text-slate-500"}`}
            >
              Ciber
            </button>
          </div>
          <select className="field text-sm" value={active} onChange={(event) => handleNavigate(event.target.value)}>
            {currentModules.map((item) => (
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

      {/* Unified Citizen Portal & CVD Modal */}
      <CitizenPortalModal
        isOpen={citizenModalOpen}
        onClose={() => setCitizenModalOpen(false)}
        token={session.access_token}
      />
    </main>
  );
}
