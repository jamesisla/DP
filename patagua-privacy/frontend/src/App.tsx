import { useEffect, useState } from "react";

import { AppLayout } from "./layouts/AppLayout";
import { CommitteePage } from "./pages/CommitteePage";
import { Checklist14TerPage } from "./pages/Checklist14TerPage";
import { DataMappingPage } from "./pages/DataMappingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { FindingsReportPrintPage } from "./pages/FindingsReportPrintPage";
import { FindingsReportsPage } from "./pages/FindingsReportsPage";
import { LoginPage } from "./pages/LoginPage";
import { ModulePage } from "./pages/ModulePage";
import { ProcessingActivitiesPage } from "./pages/ProcessingActivitiesPage";
import type { AuthSession } from "./services/api";
import type { AppRoute } from "./types/navigation";

const appRoutes: AppRoute[] = [
  "/dashboard",
  "/dpo",
  "/proyecto",
  "/matriz",
  "/catalogo",
  "/comite",
  "/hallazgos",
  "/checklist-14ter",
  "/politica",
  "/riesgos",
  "/acciones",
  "/procedimientos",
  "/tickets",
  "/consentimientos",
  "/configuracion",
];

function getCurrentRoute(): AppRoute | "/login" {
  const path = window.location.pathname;
  if (path === "/login") return "/login";
  return appRoutes.includes(path as AppRoute) ? (path as AppRoute) : "/dashboard";
}

export default function App() {
  const printMatch = window.location.pathname.match(/^\/findings-reports\/(\d+)\/print$/);
  const [session, setSession] = useState<AuthSession | null>(() => {
    const stored = localStorage.getItem("patagua.session");
    return stored ? (JSON.parse(stored) as AuthSession) : null;
  });
  const [currentRoute, setCurrentRoute] = useState<AppRoute | "/login">(getCurrentRoute);

  useEffect(() => {
    function handlePopState() {
      setCurrentRoute(getCurrentRoute());
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!session && currentRoute !== "/login") {
      window.history.replaceState({}, "", "/login");
      setCurrentRoute("/login");
    }

    if (session && currentRoute === "/login") {
      window.history.replaceState({}, "", "/dashboard");
      setCurrentRoute("/dashboard");
    }
  }, [currentRoute, session]);

  function handleLogin(nextSession: AuthSession) {
    localStorage.setItem("patagua.session", JSON.stringify(nextSession));
    setSession(nextSession);
    window.history.replaceState({}, "", "/dashboard");
    setCurrentRoute("/dashboard");
  }

  function handleLogout() {
    localStorage.removeItem("patagua.session");
    setSession(null);
    window.history.replaceState({}, "", "/login");
    setCurrentRoute("/login");
  }

  function handleNavigate(path: AppRoute) {
    window.history.pushState({}, "", path);
    setCurrentRoute(path);
  }

  if (!session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (printMatch) {
    return <FindingsReportPrintPage reportId={Number(printMatch[1])} />;
  }

  const activeRoute = currentRoute === "/login" ? "/dashboard" : currentRoute;
  const page =
    activeRoute === "/dashboard" ? (
      <DashboardPage />
    ) : activeRoute === "/matriz" ? (
      <DataMappingPage />
    ) : activeRoute === "/catalogo" ? (
      <ProcessingActivitiesPage />
    ) : activeRoute === "/hallazgos" ? (
      <FindingsReportsPage />
    ) : activeRoute === "/checklist-14ter" ? (
      <Checklist14TerPage />
    ) : activeRoute === "/comite" ? (
      <CommitteePage />
    ) : (
      <ModulePage path={activeRoute as Exclude<AppRoute, "/dashboard" | "/comite" | "/matriz" | "/catalogo" | "/hallazgos" | "/checklist-14ter">} />
    );

  return (
    <AppLayout currentPath={activeRoute} session={session} onLogout={handleLogout} onNavigate={handleNavigate}>
      {page}
    </AppLayout>
  );
}
