import React, { useState } from "react";
import { ShieldCheck, Download, FileJson, FileSpreadsheet, Activity, Search } from "lucide-react";
import { Panel } from "../components/Panel";
import { API_URL } from "../lib/api";

export function AuditLogs({ auditLogs, token, onReload }) {
  const [filterQuery, setFilterQuery] = useState("");

  // Filter logs based on search query
  const filteredLogs = auditLogs.filter(log => {
    const userStr = log.usuario ? log.usuario.full_name : "Sistema";
    const searchTarget = `${userStr} ${log.accion} ${log.entidad_afectada}`.toLowerCase();
    return searchTarget.includes(filterQuery.toLowerCase());
  });

  // Client-side CSV export
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

  // Client-side JSON export
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
          <span className="text-xs uppercase font-bold text-teal-600 tracking-wider">Expediente de Cumplimiento Estatal</span>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-brand" size={24} />
            Consolidado de Evidencias Fiscalizables (ZIP)
          </h2>
          <p className="text-xs text-slate-400">
            Descarga en un solo paquete comprimido (.ZIP) todas las matrices, actas de comité, políticas y logs estructurados por fase legal.
          </p>
        </div>

        <a
          href={`${API_URL.replace("/api", "")}/api/evidence-zip?token=${token}`}
          download
          className="inline-flex items-center gap-2 rounded bg-[#0f766e] px-4 py-2.5 text-sm font-bold text-white hover:bg-opacity-95 shadow-md hover:shadow-lg transition-all"
        >
          <Download size={16} className="animate-bounce" />
          Descargar Expediente ZIP
        </a>
      </div>

      {/* Logs Table with Filters & Local Exporters */}
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

          {/* Logs Table */}
          <div className="overflow-x-auto">
            {filteredLogs.length > 0 ? (
              <table className="w-full border-collapse text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-150 bg-slate-50 font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-3">Fecha Hora</th>
                    <th className="p-3">Funcionario</th>
                    <th className="p-3">Acción Realizada</th>
                    <th className="p-3">Entidad Afectada</th>
                    <th className="p-3">Detalle JSON</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="p-3 whitespace-nowrap text-slate-400">
                        {new Date(log.fecha_hora).toLocaleString()}
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        {log.usuario ? log.usuario.full_name : "Sistema"}
                      </td>
                      <td className="p-3">{log.accion}</td>
                      <td className="p-3">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                          {log.entidad_afectada}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[10px] text-slate-400 max-w-sm truncate" title={JSON.stringify(log.detalle_json)}>
                        {log.detalle_json ? JSON.stringify(log.detalle_json) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-10 text-slate-400">
                No se encontraron registros de auditoría coincidentes.
              </div>
            )}
          </div>

        </div>
      </Panel>

    </div>
  );
}
