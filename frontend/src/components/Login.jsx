import React, { useState } from "react";
import { 
  Scale, 
  Lock, 
  KeyRound, 
  ShieldAlert, 
  ShieldCheck, 
  Server, 
  UserCheck, 
  Radio, 
  Sparkles,
  ArrowRight,
  Layers
} from "lucide-react";
import { api } from "../lib/api";

const DEMO_USERS = [
  { email: "admin@protecciondatos.cl", name: "DPO Demo", role: "Encargado/a Responsable (DPO)" },
  { email: "ti@protecciondatos.cl", name: "CISO / Resp. TI", role: "Responsable Ciberseguridad (CISO)" },
  { email: "jefe@protecciondatos.cl", name: "Jefe de Servicio", role: "Jefe de Servicio" },
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
    <main className="min-h-screen bg-[#f8fafc] text-ink font-sans">
      <div className="grid min-h-screen lg:grid-cols-[1.2fr_0.8fr]">
        
        {/* Left column: App branding, Dual Suite Promotion & Architecture */}
        <section className="flex flex-col justify-between px-6 py-10 sm:px-12 lg:px-16 bg-gradient-to-br from-[#0c2340] via-[#0f3b4c] to-[#042f2e] text-white">
          
          {/* Header Brand */}
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-sm">
              <Layers size={26} className="text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-white">LEXAPP</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-wider">
                  Sistema GRC
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Gobierno, Riesgo y Cumplimiento Normativo Institucional
              </p>
            </div>
          </div>

          {/* Center Titles & Dual Pillar Showcase */}
          <div className="py-10 space-y-6">
            
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Sparkles size={14} />
                <span>Suite Unificada para el Sector Público y Privado Chileno</span>
              </div>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl text-white">
                Plataforma Integral de Cumplimiento Legal y Ciberseguridad
              </h1>
              <p className="text-sm leading-relaxed text-teal-100/90 max-w-2xl">
                Guía metodológica modular diseñada para acompañar a tu institución de lo general a lo particular, resolviendo la adecuación normativa de datos y el blindaje técnico ante la ANCI en un solo ecosistema.
              </p>
            </div>

            {/* DUAL PILLARS (Propaganda Mutua) */}
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              
              {/* Pillar 1: Datos Personales */}
              <div className="rounded-xl border border-teal-500/30 bg-teal-950/40 p-4 backdrop-blur-sm space-y-2.5 hover:border-teal-400/50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale size={18} className="text-teal-300" />
                    <span className="font-bold text-sm text-white">Protección de Datos</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-200 border border-teal-500/30">
                    Ley 21.719
                  </span>
                </div>
                <p className="text-xs text-teal-100 leading-relaxed">
                  Gobernanza del DPO, Matriz de Levantamiento, Motor de Riesgos 5×5, Evaluación de Impacto (EIPD), Derechos ARCO+ (15d) y Brechas (72h).
                </p>
                <div className="pt-2 border-t border-teal-500/20 flex justify-between items-center text-[10px] text-teal-300 font-semibold">
                  <span>Plazo límite: 01-12-2026</span>
                  <span className="text-amber-300 font-bold">6 Fases Guiadas →</span>
                </div>
              </div>

              {/* Pillar 2: Ciberseguridad */}
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-4 backdrop-blur-sm space-y-2.5 hover:border-indigo-400/50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock size={18} className="text-indigo-300" />
                    <span className="font-bold text-sm text-white">Ciberseguridad & ANCI</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                    Ley 21.663
                  </span>
                </div>
                <p className="text-xs text-indigo-100 leading-relaxed">
                  Inventario de Redes Críticas (RSIC/OIV), Notificación de Incidentes (Alerta 3h ANCI), Diagnóstico de Madurez NIST y Políticas PGSI/PRI.
                </p>
                <div className="pt-2 border-t border-indigo-500/20 flex justify-between items-center text-[10px] text-indigo-300 font-semibold">
                  <span>Servicios Esenciales (PSE)</span>
                  <span className="text-teal-300 font-bold">Alerta Temprana 3h →</span>
                </div>
              </div>

            </div>

            {/* Modularity feature callout */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 flex items-center gap-2.5">
              <ShieldCheck size={18} className="text-teal-300 shrink-0" />
              <span>
                <strong>Arquitectura 100% Modular:</strong> Si tu institución ya cuenta con un área resuelta (ej. ISO 27001 o inventario previo), puedes omitirla o marcarla como resuelta externamente.
              </span>
            </div>

          </div>

          {/* Footer Info */}
          <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-400 gap-2">
            <p>LexApp GRC · República de Chile</p>
            <p className="text-teal-300 font-semibold">Agencia de Protección de Datos & ANCI</p>
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
                  <h2 className="mt-4 text-xl font-bold text-slate-800">Simulador de Identidad Estatal</h2>
                  <p className="text-xs text-slate-500 mt-1">Selecciona tu usuario institucional para acceder a ambas suites (Datos y Ciberseguridad).</p>
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto p-1 border border-slate-200 rounded-lg bg-slate-50">
                  {DEMO_USERS.map((u) => (
                    <button
                      key={u.email}
                      onClick={() => submitClaveUnica(u.email)}
                      className="w-full flex flex-col text-left p-3 bg-white border border-slate-200 rounded-md hover:border-indigo-500 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <span className="font-semibold text-slate-800 text-xs">{u.name}</span>
                      <span className="text-[11px] text-slate-500 mt-0.5">{u.email}</span>
                      <span className="mt-1.5 inline-self-start text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {u.role}
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
                  className="w-full h-11 border border-slate-300 rounded text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
                >
                  Volver al Login con Contraseña
                </button>
              </div>
            ) : (
              // DEFAULT PORTAL WITH CLAVEUNICA BUTTON
              <div>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl font-black tracking-tight text-slate-900">LEXAPP</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                      Sistema GRC
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Ingreso a la Plataforma</h2>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    Accede de forma unificada a las suites de <strong>Protección de Datos (Ley 21.719)</strong> y <strong>Ciberseguridad (Ley 21.663)</strong>.
                  </p>
                </div>

                {/* CLAVE UNICA BTN */}
                <button
                  onClick={() => setShowClaveUnica(true)}
                  className="w-full h-12 bg-gradient-to-r from-[#003b70] to-[#005ea6] text-white font-bold rounded-lg flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 mb-5"
                >
                  <span className="text-lg tracking-tight font-black">Clave</span>
                  <span className="text-lg tracking-tight font-black text-rose-400">Única</span>
                  <span className="border-l border-white/20 h-4 pl-3 text-xs font-normal text-slate-200">Iniciar con ClaveÚnica</span>
                </button>

                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-slate-400 font-medium text-[11px]">O con credenciales locales</span>
                  </div>
                </div>

                <form className="space-y-3.5" onSubmit={submitPassword}>
                  <div>
                    <label className="field-label" htmlFor="email">
                      Correo Electrónico
                    </label>
                    <input
                      className="field mt-1 text-xs"
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="password">
                      Contraseña
                    </label>
                    <input
                      className="field mt-1 text-xs"
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
                    className="w-full h-11 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-all text-xs mt-2 shadow-sm"
                    disabled={loading}
                    type="submit"
                  >
                    {loading ? "Validando..." : "Ingresar a LexApp GRC"}
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
