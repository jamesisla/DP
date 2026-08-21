import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  Activity, 
  Search,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Scale,
  KeyRound,
  Fingerprint,
  FileCode2,
  Check
} from "lucide-react";
import { Panel } from "../components/Panel";
import { api, API_URL } from "../lib/api";

export function AuditLogs({ auditLogs = [], token, onReload }) {
  const [activeTab, setActiveTab] = useState("audit"); // 'audit', 'mock_audit', 'ledger'
  const [filterQuery, setFilterQuery] = useState("");

  // Mock audit state
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [auditResult, setAuditResult] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  // Ledger state
  const [ledger, setLedger] = useState({ total_evidencias_selladas: 0, ledger: [] });
  const [hashInput, setHashInput] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadMockAuditQuestions();
    loadLedger();
  }, [token]);

  async function loadLedger() {
    try {
      const data = await api("/dp-integrity-ledger", token);
      setLedger(data);
    } catch (err) {
      console.error("Error cargando ledger:", err);
    }
  }

  async function handleVerifyHash(e) {
    e.preventDefault();
    if (!hashInput.trim()) return;
    setVerifying(true);
    try {
      const isHash = hashInput.trim().length === 64;
      const payload = isHash ? { hash: hashInput.trim() } : { texto: hashInput.trim() };
      const res = await api("/dp-verify-hash", token, {
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

  async function loadMockAuditQuestions() {
    try {
      const data = await api("/dp-mock-audit/questions", token);
      setQuestions(data);
      // Pre-fill answers as true by default
      const initial = {};
      data.forEach(q => { initial[String(q.id)] = true; });
      setAnswers(initial);
      evaluateAudit(initial);
    } catch (err) {
      console.error("Error cargando preguntas de fiscalización:", err);
    }
  }

  async function evaluateAudit(currentAnswers) {
    setEvaluating(true);
    try {
      const res = await api("/dp-mock-audit/evaluate", token, {
        method: "POST",
        body: JSON.stringify({ answers: currentAnswers })
      });
      setAuditResult(res);
    } catch (err) {
      console.error("Error evaluando auditoría:", err);
    } finally {
      setEvaluating(false);
    }
  }

  function handleToggleAnswer(qid) {
    const updated = { ...answers, [qid]: !answers[qid] };
    setAnswers(updated);
    evaluateAudit(updated);
  }

  // Filter logs based on search query
  const filteredLogs = auditLogs.filter(log => {
    const userStr = log.usuario ? log.usuario.full_name : "Sistema";
    const searchTarget = `${userStr} ${log.accion} ${log.entidad_afectada}`.toLowerCase();
    return searchTarget.includes(filterQuery.toLowerCase());
  });

  function exportCSV() {
    let csv = "ID,Fecha Hora,Usuario,Acción,Entidad Afectada,Detalles\n";
    filteredLogs.forEach(l => {
      const uName = l.usuario ? l.usuario.full_name : "Sistema";
      const detailStr = l.detalle_json ? JSON.stringify(l.detalle_json).replace(/"/g, '""') : "";
      csv += `${l.id},"${l.fecha_hora}","${uName}","${l.accion}","${l.entidad_afectada}","${detailStr}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Bitacora_Auditoria_SIGE_DP.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function exportJSON() {
    const jsonStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Bitacora_Auditoria_SIGE_DP.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Evidence Export Card Header */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-teal-600 tracking-wider">Acreditación & Responsabilidad Proactiva</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              Ley N° 21.719
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-teal-700" size={24} />
            Auditoría, Expediente ZIP y Simulador de Fiscalización
          </h2>
          <p className="text-xs text-slate-400">
            Descarga de paquetes de evidencias estructurados por fase legal y simulación interactiva de inspección de la Agencia de Datos.
          </p>
        </div>

        <a
          href={`${API_URL.replace("/api", "")}/api/evidence-zip?token=${token}`}
          download
          className="inline-flex items-center gap-2 rounded bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800 shadow-sm shrink-0"
        >
          <Download size={15} />
          Descargar Expediente ZIP
        </a>
      </div>

      {/* Tab Selector */}
      <div className="flex bg-slate-200/70 p-1 rounded-xl border border-slate-300 max-w-xl">
        <button
          onClick={() => setActiveTab("audit")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "audit" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
        >
          Bitácora ({auditLogs.length})
        </button>
        <button
          onClick={() => setActiveTab("mock_audit")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "mock_audit" ? "bg-white text-teal-800 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
        >
          Simulador Fiscalización
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "ledger" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
        >
          Verificador SHA-256 ({ledger.total_evidencias_selladas})
        </button>
      </div>

      {activeTab === "audit" ? (
        /* TAB 1: AUDIT LOGS */
        <Panel title="Historial Completo de Trazabilidad Administrativa" icon={Activity}>
          <div className="space-y-4">
            
            {/* Filters and export buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap pb-2 border-b border-slate-100">
              <div className="relative w-full max-w-xs">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Search size={15} />
                </span>
                <input
                  type="text"
                  className="field pl-9 text-xs h-9 min-h-0 py-0"
                  placeholder="Buscar por usuario, acción..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={exportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-800 shadow-sm"
                >
                  <FileSpreadsheet size={13} />
                  Exportar CSV
                </button>
                <button
                  onClick={exportJSON}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-800 shadow-sm"
                >
                  <FileJson size={13} />
                  Exportar JSON
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <th className="py-2.5 px-3">Fecha / Hora</th>
                    <th className="py-2.5 px-3">Funcionario</th>
                    <th className="py-2.5 px-3">Acción Realizada</th>
                    <th className="py-2.5 px-3">Entidad Afectada</th>
                    <th className="py-2.5 px-3">Detalle JSON</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.fecha_hora).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                          {log.usuario ? log.usuario.full_name : "Sistema (Automático)"}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {log.accion}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-mono">
                            {log.entidad_afectada}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400 max-w-xs truncate" title={JSON.stringify(log.detalle_json)}>
                          {JSON.stringify(log.detalle_json)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400 font-medium">
                        No se encontraron registros de auditoría que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </Panel>
      ) : (
        /* TAB 2: MOCK AUDIT SIMULATOR (LEY 21.719) */
        <div className="space-y-6">
          
          {/* Readiness Score Card */}
          <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">Simulador Oficial de Inspección</span>
              <h3 className="text-xl font-black text-slate-900">Preparación ante la Agencia de Protección de Datos</h3>
              <p className="text-xs text-slate-600 max-w-xl">
                Cuestionario de auto-diagnóstico conforme a los 10 requisitos esenciales de la Ley N° 21.719. Permite acreditar el principio de <strong>Responsabilidad Proactiva (Accountability)</strong>.
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="bg-white p-3.5 rounded-xl border border-teal-200 shadow-sm text-center">
                <span className="text-xs font-bold text-slate-400 uppercase block">Readiness Score</span>
                <span className="text-3xl font-black text-teal-800 tracking-tight">{auditResult?.score_porcentaje || 0}%</span>
                <span className="text-[10px] font-bold text-teal-600 block mt-0.5">{auditResult?.nivel_preparacion}</span>
              </div>

              <a
                href={`${API_URL.replace("/api", "")}/api/dp-mock-audit/certificate?token=${token}`}
                download
                className="flex items-center gap-2 rounded bg-teal-800 px-4 py-3 text-xs font-bold text-white hover:bg-teal-900 shadow-md transition-all"
              >
                <Award size={16} />
                Certificado Oficial (MD)
              </a>
            </div>
          </div>

          {/* Checklist Questions */}
          <div className="rounded-xl border border-line bg-white p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">Checklist de Conformidad Legal (Ley N° 21.719)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Marca los controles acreditados en la plataforma para calcular la conformidad en tiempo real.
              </p>
            </div>

            <div className="space-y-3">
              {questions.map((q) => {
                const qidStr = String(q.id);
                const isChecked = Boolean(answers[qidStr]);

                return (
                  <div
                    key={q.id}
                    onClick={() => handleToggleAnswer(qidStr)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${isChecked ? "border-teal-300 bg-teal-50/30" : "border-slate-200 bg-slate-50/50 hover:bg-white"}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4 shrink-0"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                            {q.articulo}
                          </span>
                          <h4 className="font-bold text-xs text-slate-800">{q.pregunta}</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{q.exigencia}</p>
                      </div>
                    </div>

                    <span className="text-[11px] font-bold text-slate-400 shrink-0">
                      {q.ponderacion} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        /* TAB 3: SHA-256 CRYPTOGRAPHIC LEDGER & VERIFIER */
        <div className="space-y-6">
          
          {/* Interactive Hash Verifier Tool */}
          <div className="rounded-xl border border-line bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Fingerprint size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Verificador Criptográfico de No-Repudio (SHA-256)</h3>
                <p className="text-xs text-slate-400">Ingresa un hash SHA-256 o pega el texto de un acta/documento para verificar su autenticidad contra el ledger.</p>
              </div>
            </div>

            <form onSubmit={handleVerifyHash} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="field text-xs font-mono"
                  placeholder="Pega un hash SHA-256 (64 caracteres) o texto de evidencia..."
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={verifying}
                  className="btn bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold px-4 shrink-0"
                >
                  {verifying ? "Verificando..." : "Verificar Autenticidad"}
                </button>
              </div>
            </form>

            {verificationResult && (
              <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${verificationResult.verified ? "bg-emerald-50 border-emerald-300 text-emerald-900" : "bg-rose-50 border-rose-300 text-rose-900"}`}>
                {verificationResult.verified ? <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" /> : <AlertTriangle size={20} className="text-rose-600 shrink-0 mt-0.5" />}
                <div className="space-y-1">
                  <p className="font-bold">{verificationResult.verified ? "EVIDENCIA CRIPTOGRÁFICAMENTE VÁLIDA" : "HASH NO REGISTRADO O ALTERADO"}</p>
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
                <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Libro Mayor Inmutable</span>
                <h3 className="font-bold text-slate-800 text-sm">Registro Sellado de Evidencias Institucionales</h3>
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
      )}

    </div>
  );
}
