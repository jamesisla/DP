import { useState } from "react";

import { login, type AuthSession } from "../services/api";

type LoginPageProps = {
  onLogin: (session: AuthSession) => void;
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("admin@patagua.cl");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const session = await login(email, password);
      onLogin(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="flex flex-col justify-between px-8 py-8 lg:px-16">
        <div>
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-brand font-bold text-white">P</div>
          <span className="ml-3 text-lg font-semibold">Patagua Privacy</span>
        </div>

        <div className="max-w-2xl py-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">Ley 21.719</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-ink lg:text-5xl">
            Gestion de privacidad y cumplimiento para equipos responsables.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Login simple para el MVP, listo para crecer hacia roles, clientes y modulos de cumplimiento.
          </p>
        </div>

        <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-white px-4 py-3">FastAPI</div>
          <div className="rounded-md border border-slate-200 bg-white px-4 py-3">PostgreSQL</div>
          <div className="rounded-md border border-slate-200 bg-white px-4 py-3">React</div>
        </div>
      </section>

      <section className="flex items-center justify-center bg-white px-6 py-10 shadow-sm">
        <form className="w-full max-w-md" onSubmit={handleSubmit}>
          <h2 className="text-2xl font-semibold">Ingresar</h2>
          <p className="mt-2 text-sm text-slate-500">Usa las credenciales demo precargadas.</p>

          <label className="mt-8 block text-sm font-semibold text-slate-600" htmlFor="email">
            Correo
          </label>
          <input
            className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-brand focus:ring-4 focus:ring-emerald-100"
            id="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label className="mt-4 block text-sm font-semibold text-slate-600" htmlFor="password">
            Contrasena
          </label>
          <input
            className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-brand focus:ring-4 focus:ring-emerald-100"
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <button className="mt-6 h-11 w-full rounded-md bg-brand font-semibold text-white" disabled={loading} type="submit">
            {loading ? "Validando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
