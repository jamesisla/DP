import React, { useState } from "react";
import { 
  Cpu, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Terminal, 
  ShieldAlert, 
  Radio, 
  Layers, 
  FileCode, 
  Server, 
  Lock,
  Globe,
  Flame,
  KeyRound
} from "lucide-react";
import { API_URL } from "../../lib/api";

const CYBER_SOLUTIONS = [
  {
    id: "wazuh",
    title: "Wazuh SIEM / XDR & FIM",
    category: "Monitoreo SOC & Alerta Temprana 3h",
    adoption: "España (CCN-CERT), OTAN y Operadores OIV",
    repo: "https://github.com/wazuh/wazuh",
    license: "GPL v2",
    description: "Plataforma de detección de intrusiones, monitoreo de integridad de archivos críticos (FIM), detección de malware y telemetría de eventos de seguridad en tiempo real para activar la Alerta Temprana de 3 horas exigida por la ANCI.",
    lawMapping: "Art. 8 y 12 Ley 21.663 (Notificación Perentoria de Incidentes)",
    bashSnippet: `# Instalación del agente Wazuh en Ubuntu 24.04 RSIC en 1 paso
curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | sudo gpg --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/wazuh.gpg --import && sudo chmod 644 /usr/share/keyrings/wazuh.gpg
echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" | sudo tee -a /etc/apt/sources.list.d/wazuh.list
sudo apt update && sudo WAZUH_MANAGER="soc.institucion.gob.cl" apt install -y wazuh-agent
sudo systemctl enable --now wazuh-agent`,
    codeSnippet: `<!-- /var/ossec/etc/ossec.conf (Monitoreo de Integridad FIM) -->
<syscheck>
  <directories check_all="yes" realtime="yes">/etc,/usr/bin,/var/www</directories>
  <ignore>/etc/mtab</ignore>
  <auto_ignore frequency="10" timeframe="3600">yes</auto_ignore>
</syscheck>`
  },
  {
    id: "thehive",
    title: "TheHive 5 + Cortex",
    category: "Respuesta a Incidentes (IR / SOAR) & Cadena Forense",
    adoption: "CERT-EU (Unión Europea) y Ministerios de Defensa",
    repo: "https://github.com/TheHive-Project/TheHive",
    license: "AGPL v3",
    description: "Centro de mando para la orquestación de respuesta a ciberataques, asignación de tareas forenses, registro inmutable de evidencias con hash SHA-256 y generación automática de reportes para el CSIRT Nacional.",
    lawMapping: "Art. 10 y 12 Ley 21.663 (Libro de Incidentes y Protocolo Forense)",
    bashSnippet: `# Despliegue con Docker Compose
docker compose up -d`,
    codeSnippet: `version: "3.8"
services:
  thehive:
    image: thehiveproject/thehive:5.2
    container_name: thehive_soc
    ports:
      - "9000:9000"
    environment:
      - DATABASE_BACKEND=cassandra
      - CASSANDRA_CONTACT_POINTS=cassandra
    depends_on:
      - cassandra
      - elasticsearch
  cassandra:
    image: cassandra:4.0
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.17.9
    environment:
      - discovery.type=single-node`
  },
  {
    id: "misp",
    title: "MISP Threat Intelligence Platform",
    category: "Inteligencia de Amenazas & Compartición de IoCs",
    adoption: "CSIRT Nacionales de Europa, OTAN y FIRST",
    repo: "https://github.com/MISP/MISP",
    license: "GPL v3",
    description: "Plataforma para almacenar, correlacionar y compartir Indicadores de Compromiso (IoCs: IPs maliciosas, hashes de ransomware, dominios C2) en tiempo real con el CSIRT Nacional de Chile y la comunidad técnica.",
    lawMapping: "Art. 8 y 10 Ley 21.663 (Deber de Colaboración e Inteligencia)",
    bashSnippet: `# Despliegue del contenedor MISP
docker run -d -p 8443:443 -p 8080:80 coolacid/misp-docker:latest`,
    codeSnippet: `# Integración API Python para consultar IoCs en tiempo real
import requests

MISP_URL = "https://misp.institucion.gob.cl"
AUTH_KEY = "TuApiKeyMISP2026"

headers = {"Authorization": AUTH_KEY, "Accept": "application/json"}
# Consultar si una IP atacante está registrada en listas de bloqueo ANCI
response = requests.post(f"{MISP_URL}/attributes/restSearch", headers=headers, json={"value": "198.51.100.45"})
print(response.json())`
  },
  {
    id: "greenbone",
    title: "Greenbone Community Edition (OpenVAS)",
    category: "Escaneo Continuo de Vulnerabilidades & CVEs",
    adoption: "Alemania (BSI Standard) y Sector Público Global",
    repo: "https://greenbone.github.io",
    license: "GPL v2",
    description: "Escáner de seguridad perimetral e interno para identificar puertos expuestos innecesariamente, configuraciones débiles y software desactualizado en redes y sistemas esenciales (RSIC/OIV).",
    lawMapping: "Art. 8 Ley 21.663 (Auditorías Periódicas de Vulnerabilidades)",
    bashSnippet: `# Ejecución de escáner en contenedor
docker compose -f docker-compose-openvas.yml up -d`,
    codeSnippet: `# Configuración de escaneo programado sobre subred RSIC
# Targets: 10.0.1.0/24 (Servidores de Producción y Bases de Datos)
# Frecuencia: Semanal automática con reporte de score CVSS > 7.0`
  },
  {
    id: "keycloak",
    title: "Keycloak + Apache Guacamole",
    category: "Gestión de Identidades (IAM), MFA & PAM Seguro",
    adoption: "Comisión Europea y CNCF Cloud Native",
    repo: "https://github.com/keycloak/keycloak",
    license: "Apache 2.0",
    description: "Servidor de autenticación centralizado que impone Autenticación Multifactor (MFA obligatoria por FIDO2 / ClaveÚnica) y proxy de acceso privilegiado para administradores con grabación de sesiones SSH/RDP.",
    lawMapping: "Art. 8 Ley 21.663 (Control de Accesos y Privilegios Mínimos)",
    bashSnippet: `# Despliegue de Keycloak en modo producción
docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=PassSegura! quay.io/keycloak/keycloak:latest start-dev`,
    codeSnippet: `# Configuración de Realm Institucional:
# 1. Forzar OTP / Authenticator App a todos los usuarios con rol 'SysAdmin'
# 2. Integración federada OpenID Connect con ClaveÚnica del Estado
# 3. Sesiones temporales con rotación obligatoria cada 8 horas`
  },
  {
    id: "restic_worm",
    title: "MinIO Object Lock + Restic",
    category: "Respaldos Inmutables WORM Anti-Ransomware",
    adoption: "Recomendación CISA (USA) y NIST SP 800-209",
    repo: "https://github.com/minio/minio",
    license: "AGPL v3",
    description: "Infraestructura de copias de seguridad desconectadas lógicamente y protegidas mediante 'Object Lock' en modo Compliance, garantizando que los respaldos no puedan ser borrados ni cifrados por atacantes.",
    lawMapping: "Art. 8 Ley 21.663 (Continuidad Operacional y Resiliencia)",
    bashSnippet: `# Bloqueo WORM inmutable por 90 días en MinIO
mc retention set --default COMPLIANCE 90d myminio/backups-anci/`,
    codeSnippet: `#!/bin/bash
# Script de Respaldo Inmutable
export RESTIC_REPOSITORY="s3:https://s3.institucion.gob.cl/backups-anci"
export RESTIC_PASSWORD="ClaveCifradoMaestraAES256"

# Respaldo de BD PostgreSQL y configuraciones críticas
pg_dumpall | gzip > /tmp/db_dump.sql.gz
restic backup /tmp/db_dump.sql.gz /etc/nginx/ /etc/systemd/ --tag "anci-rsic"
rm -f /tmp/db_dump.sql.gz`
  }
];

export function OpenSourceCyber({ token }) {
  const [copiedId, setCopiedId] = useState(null);
  const [selectedSolution, setSelectedSolution] = useState(CYBER_SOLUTIONS[0]);
  const [simulating, setSimulating] = useState(false);
  const [wazuhResult, setWazuhResult] = useState(null);

  function copyToClipboard(text, id) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleSimulateWazuh() {
    setSimulating(true);
    setWazuhResult(null);
    try {
      const res = await api("/gateways/simulate-wazuh-alert", token, { method: "POST" });
      setWazuhResult(res);
    } catch (err) {
      alert("Error al simular alerta Wazuh: " + err.message);
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
            <Cpu size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-indigo-600 tracking-wider">Arquitectura Técnica Open Source</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                Estándares NIS2 / CISA / ENISA / NIST
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mt-0.5">Stack Open Source para Ciberdefensa ANCI (Ley N° 21.663)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Herramientas de seguridad de código abierto de nivel militar y gubernamental para la protección de infraestructura crítica.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleSimulateWazuh}
            disabled={simulating}
            className="flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-300 px-3.5 py-2 text-xs font-bold text-rose-900 hover:bg-rose-100 shadow-2xs transition-colors shrink-0"
            title="Simular llegada de alerta crítica Nivel 12 de Wazuh SIEM activando Alerta 3h"
          >
            <span>⚡ Simular Alerta Wazuh (3h)</span>
          </button>

          <a
            href={`${API_URL.replace("/api", "")}/api/cyber/opensource-cyber-blueprint?token=${token}`}
            download
            className="flex items-center gap-2 rounded bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-800 shadow-sm shrink-0 transition-colors"
          >
            <Download size={14} />
            Descargar Blueprint (MD)
          </a>
        </div>
      </div>

      {/* Telemetry Live Banner if triggered */}
      {wazuhResult && (
        <div className="rounded-xl border border-rose-300 bg-rose-50/90 p-4 text-rose-900 shadow-sm flex items-start justify-between gap-4 animate-fadeIn">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping"></span>
              <h4 className="font-bold text-xs text-rose-800">TELEMETRÍA WAZUH SIEM RECIBIDA · ALERTA 3 HORAS INICIADA</h4>
              <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-rose-200">{wazuhResult.codigo_incidente}</span>
            </div>
            <p className="text-xs font-medium">{wazuhResult.mensaje} · Límite legal ANCI: <span className="font-mono font-bold">{new Date(wazuhResult.limite_3h).toLocaleTimeString()}</span></p>
          </div>
          <button onClick={() => setWazuhResult(null)} className="text-rose-700 hover:text-rose-900 text-sm font-bold">&times;</button>
        </div>
      )}

      {/* Grid: Master Directory & Technical Detail */}
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* Left Column: Solution Selector */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1">
            Módulos y Herramientas Validadas ({CYBER_SOLUTIONS.length})
          </span>

          <div className="space-y-2.5">
            {CYBER_SOLUTIONS.map((sol) => (
              <div
                key={sol.id}
                onClick={() => setSelectedSolution(sol)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${selectedSolution.id === sol.id ? "border-indigo-600 bg-white shadow-md ring-2 ring-indigo-600/20" : "border-slate-200 bg-slate-50 hover:bg-white"}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{sol.title}</h4>
                    <span className="text-[10px] font-semibold text-indigo-700 block">{sol.category}</span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-slate-200/70 font-bold text-slate-700">
                    {sol.license}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1 border-t border-slate-150">
                  <Globe size={11} className="text-indigo-600" />
                  <span>{sol.adoption}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Code Snippets & Architecture Guide */}
        <div className="lg:col-span-7 rounded-xl border border-line bg-white p-6 shadow-sm space-y-5">
          
          <div className="flex justify-between items-start border-b border-slate-100 pb-4 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">{selectedSolution.title}</h3>
                <a
                  href={selectedSolution.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <span>Repositorio GitHub</span>
                  <ExternalLink size={12} />
                </a>
              </div>
              <span className="text-xs text-indigo-700 font-bold block mt-0.5">{selectedSolution.category}</span>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{selectedSolution.description}</p>
            </div>
          </div>

          <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-lg text-xs text-indigo-900 flex items-center justify-between">
            <span className="font-semibold">Exigencia Legal ANCI Mapeada:</span>
            <span className="font-bold bg-white px-2 py-0.5 rounded border border-indigo-200">{selectedSolution.lawMapping}</span>
          </div>

          {/* Bash deployment snippet */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Terminal size={14} className="text-indigo-600" />
                1. Despliegue Operativo Rápido (Bash / CLI)
              </span>
              <button
                onClick={() => copyToClipboard(selectedSolution.bashSnippet, "bash")}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-600 transition-colors"
              >
                {copiedId === "bash" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copiedId === "bash" ? "Copiado" : "Copiar"}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto">
              <code>{selectedSolution.bashSnippet}</code>
            </pre>
          </div>

          {/* Code snippet */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <FileCode size={14} className="text-purple-600" />
                2. Configuración de Seguridad & Docker Compose
              </span>
              <button
                onClick={() => copyToClipboard(selectedSolution.codeSnippet, "code")}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-600 transition-colors"
              >
                {copiedId === "code" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copiedId === "code" ? "Copiado" : "Copiar"}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto max-h-60">
              <code>{selectedSolution.codeSnippet}</code>
            </pre>
          </div>

        </div>

      </div>

    </div>
  );
}
