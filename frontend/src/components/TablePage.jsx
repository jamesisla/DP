import React from "react";
import { ListChecks } from "lucide-react";
import { Panel } from "./Panel";

export function TablePage({ title, columns, rows, actions }) {
  return (
    <div className="p-5 lg:p-8">
      <Panel title={title} icon={ListChecks}>
        <div className="overflow-hidden rounded border border-line bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {columns.map((column) => (
                  <th className="px-4 py-3 font-semibold" key={column}>
                    {column}
                  </th>
                ))}
                {actions && <th className="px-4 py-3 font-semibold text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row, idx) => (
                <tr key={idx}>
                  {row.map((cell, cellIdx) => (
                    <td className="px-4 py-3 text-slate-700" key={cellIdx}>
                      {cell}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right">
                      {actions(idx)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
