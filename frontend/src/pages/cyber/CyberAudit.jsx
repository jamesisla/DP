import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Download, 
  Fingerprint, 
  CheckCircle2, 
  AlertTriangle, 
  FileCode, 
  Lock, 
  Check, 
  FileText,
  FileArchive,
  Layers
} from "lucide-react";
import { api, API_URL } from "../../lib/api";

export function CyberAudit({ token }) {
  const [activeTab, setActiveTab] = useState("expediente"); // 'expediente', 'ledger', 'qa'
  const [ledger, setLedger] = useState({ total_evidencias_selladas: 0, ledger: [] });
  const [hashInput, setHashInput] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [qaList, setQaList] = useState([]);

  useEffect(() => {
    loadLedger();
    loadCyberQa();
  }, [token]);

  async function loadCyberQa() {
    try {
      const data = await api("/cyber/inspector-qa-cyber", token);
      setQaList(data);
    } catch (err) {
      console.error("Error cargando Q&A CISO:", err);
    }
  }

  async function loadLedger() {
    try {
      const data = await api("/cyber/integrity-ledger", token);
      setLedger(data);
    } catch (err) {
      console.error("Error cargando ledger de ciberseguridad:", err);
    }
  }

  async function handleVerifyHash(e) {
    e.preventDefault();
    if (!hashInput.trim()) return;
    setVerifying(true);
    try {
      const isHash = hashInput.trim().length === 64;
      const payload = isHash ? { hash: hashInput.trim() } : { texto: hashInput.trim() };
      const res = await api("/cyber/verify-hash", token, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setVerificationResult(res);
    } catch (err) {
      alert("Error al verificar: " + err.message);
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-indigo-600 tracking-wider">Acreditación ANCI & Cadena de Custodia</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              Ley N° 21.663
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-indigo-600" size={24} />
            Expediente ANCI (ZIP) & Verificador Criptográfico SHA-256
          </h2>
          <p className="text-xs text-slate-400">
            Descarga de compendios probatorios de ciberdefensa y validación de autenticidad inmutable ante fiscalizadores de la ANCI.
          </p>
        </div>

        <a
          href={`${API_URL.replace("/api", "")}/api/cyber/evidence-zip?token=${token}`}
          download
          className="inline-flex items-center gap-2 rounded bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-800 shadow-sm shrink-0"
        >
          <Download size={15} />
          Descargar Expediente ANCI (ZIP)
        </a>
      </div>

      {/* Tab Selector */}
      <div className="flex bg-slate-200/70 p-1 rounded-xl border border-slate-300 max-w-lg">
        <button
          onClick={() => setActiveTab("expediente")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "expediente" ? "bg-white text-indigo-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
        >
          Expediente Oficial
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "ledger" ? "bg-white text-indigo-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
        >
          Verificador SHA-256 ({ledger.total_evidencias_selladas})
        </button>
        <button
          onClick={() => setActiveTab("qa")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "qa" ? "bg-white text-indigo-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
        >
          Entrenador Q&A ({qaList.length})
        </button>
      </div>

      {activeTab === "expediente" ? (
        /* TAB 1: ZIP EVIDENCE STRUCTURE */
        <div className="rounded-xl border border-line bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
              <FileArchive size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Estructura del Expediente Maestro Digital ANCI</h3>
              <p className="text-xs text-slate-400">Compendio estructurado de evidencias requerido durante una fiscalización de la Agencia Nacional de Ciberseguridad.</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {[
              { folder: "01_Gobernanza_ANCI/", desc: "Actas de nombramiento de CISO y roles de ciberseguridad." },
              { folder: "02_Activos_Criticos_RSIC/", desc: "Inventario de servicios esenciales y escaneos CIS Benchmark." },
              { folder: "03_Gestion_Riesgos_5x5/", desc: "Matriz técnica de riesgos y brechas de seguridad mitigadas." },
              { folder: "04_Políticas_PRI_BCP/", desc: "Política PGSI, Plan de Respuesta a Incidentes y Plan BCP/DRP." },
              { folder: "05_Libro_Incidentes_Bitacora/", desc: "Bitácora forense de incidentes y cumplimiento de Alertas 3h." },
              { folder: "06_Simulacros_War_Games/", desc: "Actas suscritas de ejercicios de crisis ante Ransomware." }
            ].map((f, i) => (
              <div key={i} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3">
                <FileCode size={18} className="text-indigo-600 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-bold text-xs text-slate-800 font-mono">{f.folder}</p>
                  <p className="text-[11px] text-slate-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">Formato de entrega: Archivo comprimido `.zip` con manifiesto e índice de hashes SHA-256.</span>
            <a
              href={`${API_URL.replace("/api", "")}/api/cyber/evidence-zip?token=${token}`}
              download
              className="btn bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4"
            >
              Descargar Archivo Completo
            </a>
          </div>
        </div>
      ) : (
        /* TAB 2: CRYPTOGRAPHIC LEDGER & VERIFIER */
        <div className="space-y-6">
          
          {/* Interactive Hash Verifier Tool */}
          <div className="rounded-xl border border-line bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Fingerprint size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Verificador Criptográfico Forense ANCI (SHA-256)</h3>
                <p className="text-xs text-slate-400">Comprueba si un volcado forense, acta de crisis o registro del Libro de Incidentes mantiene su integridad de origen.</p>
              </div>
            </div>

            <form onSubmit={handleVerifyHash} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="field text-xs font-mono"
                  placeholder="Pega un hash SHA-256 (64 caracteres) o texto de incidente forense..."
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={verifying}
                  className="btn bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold px-4 shrink-0"
                >
                  {verifying ? "Verificando..." : "Verificar Integridad"}
                </button>
              </div>
            </form>

            {verificationResult && (
              <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${verificationResult.verified ? "bg-emerald-50 border-emerald-300 text-emerald-900" : "bg-rose-50 border-rose-300 text-rose-900"}`}>
                {verificationResult.verified ? <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" /> : <AlertTriangle size={20} className="text-rose-600 shrink-0 mt-0.5" />}
                <div className="space-y-1">
                  <p className="font-bold">{verificationResult.verified ? "CADENA DE CUSTODIA ÍNTEGRA Y VÁLIDA" : "HASH NO REGISTRADO O CORROMPIDO"}</p>
                  <p className="text-[11px]">{verificationResult.detalle}</p>
                  <p className="font-mono text-[10px] text-slate-500">Hash evaluado: {verificationResult.hash_analizado}</p>
                </div>
              </div>
            )}
          </div>

          {/* Ledger Table */}
          <div className="rounded-xl border border-line bg-white p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Bitácora Criptográfica Inmutable</span>
                <h3 className="font-bold text-slate-800 text-sm">Libro Mayor de Incidentes & Actas Selladas</h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                {ledger.algoritmo || "SHA-256"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Tipo de Evidencia</th>
                    <th className="py-2.5 px-3">Identificador / Título</th>
                    <th className="py-2.5 px-3">Fecha Sellado</th>
                    <th className="py-2.5 px-3 font-mono">Hash SHA-256</th>
                    <th className="py-2.5 px-3 text-right">Estado Sello</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {ledger.ledger && ledger.ledger.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-800">{item.tipo_entidad}</td>
                      <td className="py-3 px-3">{item.identificador}</td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{item.fecha}</td>
                      <td className="py-3 px-3 font-mono text-[10px] text-slate-500 truncate max-w-[200px]" title={item.hash_sha256}>
                        {item.hash_sha256}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check size={10} />
                          {item.estado_sello}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
        /* TAB 3: INSPECTOR Q&A DEFENSE GUIDE (CISO) */
        <div className="rounded-xl border border-line bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Entrenador de Entrevistas de Fiscalización (ANCI)</h3>
              <p className="text-xs text-slate-400">Guía de argumentación técnica y defensa ante auditorías de la Agencia Nacional de Ciberseguridad (Ley N° 21.663).</p>
            </div>
          </div>

          <div className="space-y-4">
            {qaList.map((qa) => (
              <div key={qa.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 shrink-0 mt-0.5">
                    Pregunta #{qa.id}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900 leading-snug">{qa.pregunta}</h4>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Fundamento Legal / Exigencia ANCI:</span>
                    <p className="font-semibold text-slate-700 mt-0.5">{qa.fundamento_legal}</p>
                  </div>

                  <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg">
                    <span className="text-[10px] font-bold text-indigo-900 uppercase block">Respuesta de Defensa Técnica del CISO:</span>
                    <p className="text-indigo-950 font-medium mt-0.5 leading-relaxed">{qa.respuesta_defensiva}</p>
                  </div>

                  <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-700">Ruta de Evidencia Demostrable:</span>
                    <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-800">{qa.ruta_evidencia}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
