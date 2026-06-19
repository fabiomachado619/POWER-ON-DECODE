import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { requireAdminUser } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export default async function AdminDecodeLogsPage() {
  let user;
  try {
    user = await requireAdminUser();
  } catch {
    redirect("/login?redirect=/admin/decode-logs");
  }

  const logs = await prisma.decodeLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: true,
      procedure: { include: { module: true } },
    },
  });

  return (
    <AdminLayout user={user}>
      <div className="mb-6">
        <h1 className="section-title">Logs de decode</h1>
        <p className="section-subtitle">Últimas 100 operações registradas.</p>
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-divider text-ink-muted">
              <th className="px-3 py-2 text-left">Data</th>
              <th className="px-3 py-2 text-left">Usuário</th>
              <th className="px-3 py-2 text-left">Procedimento</th>
              <th className="px-3 py-2 text-left">Arquivo</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-divider/70">
                <td className="px-3 py-3 text-ink-muted">
                  {log.createdAt.toLocaleString("pt-BR")}
                </td>
                <td className="px-3 py-3">
                  <p className="text-ink">{log.user.name}</p>
                  <p className="text-ink-muted">{log.user.email}</p>
                </td>
                <td className="px-3 py-3">
                  {log.toolSlug ?? log.procedure?.name ?? "—"}
                  {log.procedure?.module?.name
                    ? ` (${log.procedure.module.name})`
                    : ""}
                  {log.technicalVersion ? (
                    <p className="text-xs text-ink-muted">v{log.technicalVersion}</p>
                  ) : null}
                </td>
                <td className="px-3 py-3">{log.originalFilename}</td>
                <td className="px-3 py-3">
                  <span
                    className={
                      log.status === "success" ? "text-brand-dark" : "text-red-600"
                    }
                  >
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
