import type { DecodeLogEntry } from "@/types";

interface HistoryTableProps {
  logs: DecodeLogEntry[];
}

export function HistoryTable({ logs }: HistoryTableProps) {
  if (logs.length === 0) {
    return <div className="empty-state">Nenhuma operação registrada ainda.</div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-divider bg-surface shadow-elevated">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-divider bg-canvas text-ink-muted">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Módulo</th>
              <th className="px-4 py-3 font-medium">Procedimento</th>
              <th className="px-4 py-3 font-medium">Arquivo</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                className="border-b border-divider/70 transition hover:bg-canvas/80"
              >
                <td className="px-4 py-3 text-ink">
                  {new Date(log.createdAt).toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-3 text-ink">{log.moduleName}</td>
                <td className="px-4 py-3 text-ink">{log.procedureName}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {log.originalFilename}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      log.status === "success"
                        ? "bg-brand-light text-brand-dark"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {log.status === "success" ? "Sucesso" : "Erro"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
