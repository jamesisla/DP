import React, { useState } from "react";
import { Scale, KeyRound, ShieldAlert } from "lucide-react";
import { api } from "../lib/api";

const DEMO_USERS = [
  { email: "admin@protecciondatos.cl", name: "DPO Demo", role: "Encargado/a Responsable" },
  { email: "jefe@protecciondatos.cl", name: "Jefe de Servicio", role: "Jefe de Servicio" },
  { email: "ti@protecciondatos.cl", name: "Responsable de TI", role: "Responsable de Área (TI)" },
  { email: "legal@protecciondatos.cl", name: "Responsable Legal", role: "Responsable de Área (Legal)" },
  { email: "comite@protecciondatos.cl", name: "Comité Ejecutivo", role: "Comité Ejecutivo" },
  { email: "invitado@protecciondatos.cl", name: "Funcionario Observador", role: "Invitado/Colaborador" }
];

export function Login({ onLogin }) {
  const [showClaveUnica, setShowClaveUnica] = useState(false);
  const [email, setEmail] = useState("admin@protecciondatos.cl");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitPassword(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api("/auth/login", "", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitClaveUnica(selectedEmail) {
    setLoading(true);
    setError("");
    try {
      const data = await api("/auth/claveunica", "", {
        method: "POST",
        body: JSON.stringify({ email: selectedEmail, password: "" }),
      });
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f1f5f9] text-ink font-sans">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* Left column: App branding and instructions */}
        <section className="flex flex-col justify-between px-6 py-10 sm:px-12 lg:px-20 bg-gradient-to-br from-[#0f766e] to-[#042f2e] text-white">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-white/10 backdrop-blur-md text-white border border-white/20">
              <Scale size={24} />
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight">SIGE-DP</p>
              <p className="text-xs text-teal-200">Sistema de Gestión de Datos Personales</p>
            </div>
          </div>

          <div className="max-w-2xl py-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Cumplimiento Ley 21.719
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Plataforma de Cumplimiento Normativo de Datos Personales
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-teal-100">
              Guía Metodológica Interactiva diseñada para automatizar, monitorizar y consolidar la adecuación legal del sector público chileno antes del plazo límite del 1 de diciembre de 2026.
            </p>
          </div>

          <div className="grid gap-4 text-sm text-teal-100 sm:grid-cols-3">
            <div className="rounded-lg border border-teal-500/20 bg-teal-950/20 p-4 backdrop-blur-sm">
              <p className="font-semibold text-white">Anexo A Precargado</p>
              <p className="text-xs text-teal-300 mt-1">6 fases de trabajo normativo y tareas configuradas.</p>
            </div>
            <div className="rounded-lg border border-teal-500/20 bg-teal-950/20 p-4 backdrop-blur-sm">
              <p className="font-semibold text-white">Motor de Riesgos</p>
              <p className="text-xs text-teal-300 mt-1">Cálculo automatizado y mapa de calor interactivo.</p>
            </div>
            <div className="rounded-lg border border-teal-500/20 bg-teal-950/20 p-4 backdrop-blur-sm">
              <p className="font-semibold text-white">Documentos Mágicos</p>
              <p className="text-xs text-teal-300 mt-1">Generación de actas, anexo legal y políticas al 70%.</p>
            </div>
          </div>
        </section>

        {/* Right column: Login Portal */}
        <section className="flex items-center justify-center bg-white px-6 py-12 shadow-soft lg:px-12">
          <div className="w-full max-w-md">
            
            {showClaveUnica ? (
              // MOCK CLAVEUNICA PORTAL
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center gap-1 mb-2">
                    <span className="text-2xl font-black text-[#0f2d59] tracking-tight">Clave</span>
                    <span className="text-2xl font-black text-[#e83e8c] tracking-tight">Única</span>
                  </div>
                  <p className="text-xs text-[#0f2d59] uppercase font-bold tracking-widest">Gobierno de Chile</p>
                  <h2 className="mt-4 text-xl font-bold text-slate-800">Simulador de Identidad Única</h2>
                  <p className="text-sm text-slate-500 mt-1">Selecciona un funcionario para iniciar sesión simulada vía OIDC.</p>
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto p-1 border border-slate-200 rounded-lg bg-slate-50">
                  {DEMO_USERS.map((user) => (
                    <button
                      key={user.email}
                      onClick={() => submitClaveUnica(user.email)}
                      className="w-full flex flex-col text-left p-3.5 bg-white border border-slate-200 rounded-md hover:border-blue-500 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <span className="font-semibold text-slate-800 text-sm">{user.name}</span>
                      <span className="text-xs text-slate-500 mt-0.5">{user.email}</span>
                      <span className="mt-1.5 inline-self-start text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                        {user.role}
                      </span>
                    </button>
                  ))}
                </div>

                {error && (
                  <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex gap-2">
                    <ShieldAlert size={16} className="shrink-0" />
                    <span>{error}</span>
                  </p>
                )}

                <button
                  onClick={() => setShowClaveUnica(false)}
                  className="w-full h-11 border border-slate-300 rounded text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
                >
                  Volver al Login de Respaldo
                </button>
              </div>
            ) : (
              // DEFAULT PORTAL WITH CLAVEUNICA BUTTON
              <div>
                <div className="mb-8">
                  <div className="mb-4 grid h-12 w-12 place-items-center rounded bg-slate-900 text-white">
                    <KeyRound size={22} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Ingresar a la Plataforma</h2>
                  <p className="mt-2 text-sm text-slate-500">Accede de forma obligatoria con tu clave estatal única.</p>
                </div>

                {/* CLAVE UNICA BTN */}
                <button
                  onClick={() => setShowClaveUnica(true)}
                  className="w-full h-12 bg-gradient-to-r from-[#003b70] to-[#005ea6] text-white font-bold rounded-lg flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 mb-6"
                >
                  <span className="text-lg tracking-tight font-black">Clave</span>
                  <span className="text-lg tracking-tight font-black text-rose-400">Única</span>
                  <span className="border-l border-white/20 h-4 pl-3 text-xs font-normal text-slate-200">Iniciar sesión</span>
                </button>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-slate-400 font-medium">O usar credenciales locales</span>
                  </div>
                </div>

                <form className="space-y-4" onSubmit={submitPassword}>
                  <div>
                    <label className="field-label" htmlFor="email">
                      Correo Electrónico
                    </label>
                    <input
                      className="field mt-1"
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="password">
                      Contraseña de Respaldo
                    </label>
                    <input
                      className="field mt-1"
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>

                  {error && (
                    <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex gap-2">
                      <ShieldAlert size={16} className="shrink-0" />
                      <span>{error}</span>
                    </p>
                  )}

                  <button
                    className="w-full h-11 bg-[#0f766e] text-white font-semibold rounded hover:bg-opacity-95 transition-all mt-2"
                    disabled={loading}
                    type="submit"
                  >
                    {loading ? "Validando..." : "Ingresar con credenciales"}
                  </button>
                </form>
              </div>
            )}
            
          </div>
        </section>
        
      </div>
    </main>
  );
}
