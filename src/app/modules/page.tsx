import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { HistoryTable } from "@/components/HistoryTable";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserToolsCatalog } from "@/lib/tools";

export default async function ModulesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [catalog, logs] = await Promise.all([
    getUserToolsCatalog(user.id),
    prisma.decodeLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        procedure: {
          include: { module: true },
        },
      },
    }),
  ]);

  const history = logs.map((log) => ({
    id: log.id,
    originalFilename: log.originalFilename,
    fileSize: log.fileSize,
    offsetApplied: log.offsetApplied,
    status: log.status,
    errorMessage: log.errorMessage,
    createdAt: log.createdAt.toISOString(),
    procedureName: log.procedure?.name ?? log.toolSlug ?? "Ferramenta",
    moduleName: log.procedure?.module?.name ?? log.category ?? "—",
  }));

  return (
    <div className="page-shell">
      <AppHeader user={user} unlockedCount={catalog.unlockedCount} />

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="section-title">Histórico de operações</h1>
          <p className="section-subtitle">
            Registro técnico das suas aplicações de decode. Nenhum conteúdo de
            arquivo é armazenado.
          </p>
        </div>

        <HistoryTable logs={history} />
      </main>
    </div>
  );
}
