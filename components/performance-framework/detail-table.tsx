import type { ReactNode } from "react";

export default function DetailTable({
  title, columns, rows,
}: {
  title: string;
  columns: string[];
  rows: { id: string; cells: ReactNode[] }[];
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table aria-label={title} className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>{columns.map((column) => <th key={column} scope="col" className="px-4 py-3">{column}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map(({ id, cells }) => (
              <tr key={id}>
                {cells.map((cell, index) => (
                  <td key={columns[index]} className="min-w-24 whitespace-pre-wrap px-4 py-3 align-top">{cell}</td>
                ))}
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={columns.length} className="px-4 py-3 text-slate-500">No entries.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
