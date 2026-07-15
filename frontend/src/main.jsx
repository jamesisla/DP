import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Login } from "./components/Login";
import { Shell } from "./components/Shell";
import "./styles.css";

function App() {
  const [session, setSession] = useState(() => {
    try {
      const stored = localStorage.getItem("protecciondatos.session");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      localStorage.removeItem("protecciondatos.session");
      return null;
    }
  });

  const value = useMemo(() => session, [session]);

  function handleLogin(nextSession) {
    localStorage.setItem("protecciondatos.session", JSON.stringify(nextSession));
    setSession(nextSession);
  }

  function handleLogout() {
    localStorage.removeItem("protecciondatos.session");
    setSession(null);
  }

  return value ? <Shell session={value} onLogout={handleLogout} /> : <Login onLogin={handleLogin} />;
}

createRoot(document.getElementById("root")).render(<App />);
