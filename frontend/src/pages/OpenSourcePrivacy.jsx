import React, { useState } from "react";
import { 
  Cpu, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Terminal, 
  ShieldCheck, 
  Lock, 
  Layers, 
  FileCode, 
  Search, 
  Database,
  Globe
} from "lucide-react";
import { API_URL } from "../lib/api";

const PRIVACY_SOLUTIONS = [
  {
    id: "presidio",
    title: "Microsoft Presidio",
    category: "Detección & Clasificación de PII con IA",
    adoption: "Estándar Global / Unión Europea & USA",
    repo: "https://github.com/microsoft/presidio",
    license: "MIT License",
    description: "Motor de procesamiento de lenguaje natural (NLP) para escanear y anonimizar datos personales (RUTs, nombres, números de cuenta, diagnósticos médicos) en texto libre, logs y bases de datos antes de su almacenamiento.",
    lawMapping: "Art. 13 y 14 Ley 21.719 (Principio de Seguridad y Calidad)",
    bashSnippet: `# Instalación de Presidio con modelo en español
pip install presidio-analyzer presidio-anonymizer
python -m spacy download es_core_news_md`,
    codeSnippet: `from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine

analyzer = AnalyzerEngine()
anonymizer = AnonymizerEngine()

texto = "El titular Juan Pérez RUT 12.345.678-9 solicitó acceso a su ficha médica."
resultados = analyzer.analyze(text=texto, language='es')
anonimizado = anonymizer.anonymize(text=texto, analyzer_results=resultados)

print(anonimizado.text)
# Resultado: El titular <PERSON> RUT <CHILE_RUT> solicitó acceso a su ficha médica.`
  },
  {
    id: "klaro",
    title: "Klaro! Consent Manager",
    category: "Gestor de Consentimiento & Cookies (CMP)",
    adoption: "Francia (CNIL) & Alemania (BfDI)",
    repo: "https://github.com/klaro-org/klaro-js",
    license: "BSD-3-Clause",
    description: "Plataforma Open Source y ultra liviana para la recolección y administración transparente del consentimiento de cookies y analítica ciudadana en portales institucionales sin rastreo comercial.",
    lawMapping: "Art. 14 Ley 21.719 (Deber de Información y Consentimiento)",
    bashSnippet: `<!-- Inserción en el <head> del portal institucional -->
<script defer type="text/javascript" src="https://cdn.jsdelivr.net/npm/klaro@latest/dist/klaro.js"></script>`,
    codeSnippet: `var klaroConfig = {
  elementID: 'klaro',
  privacyPolicy: '/politica-privacidad',
  default: true,
  mustConsent: false,
  apps: [
    {
      name: 'clave_unica_session',
      title: 'Sesión Segura ClaveÚnica',
      purposes: ['security'],
      required: true
    },
    {
      name: 'matomo_analytics',
      title: 'Métricas Estadísticas Anonimizadas',
      purposes: ['analytics'],
      default: false
    }
  ]
};`
  },
  {
    id: "arx",
    title: "ARX Data Anonymizer & pg_anonymizer",
    category: "Anonimización & K-Anonymity en Bases de Datos",
    adoption: "Supervisor Europeo (EDPS) & Sector Salud",
    repo: "https://arx.deidentifier.org",
    license: "Apache 2.0",
    description: "Suite de anonimización formal que implementa garantías matemáticas de privacidad (k-anonymity, l-diversity, t-closeness) y enmascaramiento dinámico para disponibilizar datos estadísticos o de investigación.",
    lawMapping: "Art. 14 y 25 Ley 21.719 (Anonimización & Minimización de Datos)",
    bashSnippet: `# Enmascaramiento dinámico en PostgreSQL
CREATE EXTENSION anon CASCADE;
SELECT anon.init();`,
    codeSnippet: `-- Definición de reglas de enmascaramiento sobre tabla de ciudadanos
SECURITY LABEL FOR anon ON COLUMN ciudadanos.rut
IS 'MASKED WITH FUNCTION anon.dummy_rut()';

SECURITY LABEL FOR anon ON COLUMN ciudadanos.email
IS 'MASKED WITH FUNCTION anon.partial(email,2,$$*$$2)';

-- Al consultar con usuario no privilegiado, los datos se anonimizan en tiempo real:
SELECT rut, email FROM ciudadanos;`
  },
  {
    id: "fides",
    title: "Fides by Ethyca",
    category: "Plataforma de Ingeniería de Privacidad (DSR/ARCO)",
    adoption: "Silicon Valley & Unión Europea",
    repo: "https://github.com/ethyca/fides",
    license: "Apache 2.0",
    description: "Framework open source que automatiza el ciclo de vida de los derechos ARCO+ (acceso, rectificación, supresión y portabilidad), orquestando consultas de borrado en múltiples bases de datos relacionales y NoSQL.",
    lawMapping: "Art. 8 Ley 21.719 (Gestión de Derechos ARCO+ en 15 días)",
    bashSnippet: `# Despliegue con Docker
docker run -p 8080:8080 ethyca/fides:latest`,
    codeSnippet: `version: "3.8"
services:
  fides_privacy_engine:
    image: ethyca/fides:latest
    ports:
      - "8080:8080"
    environment:
      - FIDES__SECURITY__ROOT_USERNAME=admin
      - FIDES__DATABASE__SQLALCHEMY_DATABASE_URI=postgresql://postgres:pass@db:5432/fides
    depends_on:
      - db
  db:
    image: postgres:15-alpine`
  },
  {
    id: "vault",
    title: "HashiCorp Vault Community",
    category: "Cifrado en Reposo (TDE) & Gestión de Llaves KMS",
    adoption: "Estándar Global de Cifrado y Secretos",
    repo: "https://github.com/hashicorp/vault",
    license: "MPL 2.0 / BSL",
    description: "Sistema para la custodia segura de llaves maestras de cifrado AES-256, tokens de acceso a bases de datos y rotación automatizada de secretos sin exponer credenciales en código fuente.",
    lawMapping: "Art. 14 Ley 21.719 (Cifrado y Deber de Confidencialidad)",
    bashSnippet: `# Inicializar motor de cifrado en tránsito
vault secrets enable transit
vault write -f transit/keys/datos-sensibles-key`,
    codeSnippet: `# Cifrar datos personales antes de persistir en base de datos
vault write transit/encrypt/datos-sensibles-key plaintext=$(echo "DatosMedicosSensibles2026" | base64)

# Salida: vault:v1:8f92jksd012... (Cifrado inquebrantable AES-256-GCM)`
  }
];

export function OpenSourcePrivacy({ token }) {
  const [copiedId, setCopiedId] = useState(null);
  const [selectedSolution, setSelectedSolution] = useState(PRIVACY_SOLUTIONS[0]);

  function copyToClipboard(text, id) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100 shrink-0">
            <Cpu size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-teal-600 tracking-wider">Arquitectura Técnica Open Source</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                Estándares GDPR / CNIL / USA
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mt-0.5">Stack Open Source para Protección de Datos (Ley N° 21.719)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Guías técnicas y blueprints de despliegue con herramientas de código abierto validadas por reguladores de Europa y USA.
            </p>
          </div>
        </div>

        <a
          href={`${API_URL.replace("/api", "")}/api/documents/opensource-privacy-blueprint?token=${token}`}
          download
          className="flex items-center gap-2 rounded bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800 shadow-sm shrink-0 transition-colors"
        >
          <Download size={14} />
          Descargar Blueprint Completo (MD)
        </a>
      </div>

      {/* Grid: Master Directory & Technical Detail */}
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* Left Column: Solution Selector */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1">
            Módulos y Herramientas Validadas ({PRIVACY_SOLUTIONS.length})
          </span>

          <div className="space-y-2.5">
            {PRIVACY_SOLUTIONS.map((sol) => (
              <div
                key={sol.id}
                onClick={() => setSelectedSolution(sol)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${selectedSolution.id === sol.id ? "border-teal-600 bg-white shadow-md ring-2 ring-teal-600/20" : "border-slate-200 bg-slate-50 hover:bg-white"}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{sol.title}</h4>
                    <span className="text-[10px] font-semibold text-teal-700 block">{sol.category}</span>
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
              <span className="text-xs text-teal-700 font-bold block mt-0.5">{selectedSolution.category}</span>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{selectedSolution.description}</p>
            </div>
          </div>

          <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-lg text-xs text-indigo-900 flex items-center justify-between">
            <span className="font-semibold">Cumplimiento Legal Mapeado:</span>
            <span className="font-bold bg-white px-2 py-0.5 rounded border border-indigo-200">{selectedSolution.lawMapping}</span>
          </div>

          {/* Bash deployment snippet */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Terminal size={14} className="text-teal-600" />
                1. Instalación & Despliegue Rápido (Bash / Docker)
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
                <FileCode size={14} className="text-indigo-600" />
                2. Configuración & Código de Integración
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
