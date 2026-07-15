import type { ReactNode } from "react";

import { RiskBadge } from "./RiskBadge";
import { StatusBadge } from "./StatusBadge";

type DataTableProps = {
  columns: string[];
  rows: readonly (readonly string[])[];
  riskColumns?: number[];
  statusColumns?: number[];
  booleanColumns?: number[];
  actions?: ReactNode[];
};

export function DataTable({ columns, rows, riskColumns = [], statusColumns = [], booleanColumns = [], actions = [] }: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/10">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-[#f7f7f4] text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((column) => (
                <th className="px-4 py-3 font-semibold" key={column}>
                  {column}
                </th>
                ))}
                {actions.length ? <th className="px-4 py-3 text-right font-semibold">Acciones</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 bg-white">
            {rows.map((row, rowIndex) => (
              <tr className="hover:bg-[#f7f7f4]" key={row.join("-")}>
                {row.map((cell, index) => (
                  <td className="px-4 py-3 text-slate-700" key={`${cell}-${index}`}>
                    {riskColumns.includes(index) ? (
                      <RiskBadge level={cell} />
                    ) : statusColumns.includes(index) ? (
                      <StatusBadge status={cell} />
                    ) : booleanColumns.includes(index) ? (
                      <StatusBadge status={cell === "true" ? "Si" : "No"} />
                    ) : (
                      cell
                    )}
                  </td>
                ))}
                {actions.length ? <td className="px-4 py-3 text-right">{actions[rowIndex]}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
