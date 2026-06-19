import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { getSessionUser } from "@/lib/auth";
import { getUserAccessList } from "@/lib/accessControl";
import { prisma } from "@/lib/prisma";

function daysUntil(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const ms = new Date(isoDate).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export default async function AccountAccessPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=/account/access");

  const accesses = await getUserAccessList(user.id);

  const tools = await prisma.tool.findMany({
    where: { active: true },
    select: { moduleId: true, purchaseUrl: true, slug: true },
  });
  const purchaseByModule = new Map(
    tools.map((t) => [t.moduleId, t.purchaseUrl ?? `https://exemplo.com/comprar/${t.slug}`])
  );

  const activeCount = accesses.filter((a) => a.isActive).length;

  return (
    <div className="page-shell">
      <AppHeader user={user} unlockedCount={activeCount} />

      <main className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
        <Link href="/account" className="text-sm text-brand-dark hover:underline">
          ← Minha conta
        </Link>
        <h1 className="section-title mt-4">Meus acessos</h1>
        <p className="section-subtitle">
          Validade de cada ferramenta liberada na sua conta.
        </p>

        <div className="mt-8 space-y-4">
          {accesses.length === 0 ? (
            <div className="card text-sm text-ink-muted">
              Nenhum acesso registrado. Adquira ferramentas na Loja Power On.
            </div>
          ) : (
            accesses.map((access) => {
              const days = daysUntil(access.expiresAt);
              const nearExpiry = days !== null && days <= 30 && days > 0;
              const purchaseUrl =
                purchaseByModule.get(access.moduleId) ??
                "https://exemplo.com/comprar";

              return (
                <div key={access.id} className="card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-ink">
                        {access.moduleName}
                      </h2>
                      <p className="text-sm text-ink-muted">
                        Status:{" "}
                        <span
                          className={
                            access.isActive
                              ? "text-brand-dark"
                              : access.isExpired
                                ? "text-red-600"
                                : "text-ink-muted"
                          }
                        >
                          {access.isActive
                            ? "Ativo"
                            : access.isExpired
                              ? "Vencido"
                              : access.accessStatus}
                        </span>
                      </p>
                      {access.expiresAt && (
                        <p className="mt-1 text-sm text-ink-muted">
                          Vence em:{" "}
                          {new Date(access.expiresAt).toLocaleDateString("pt-BR")}
                          {days !== null && days > 0 && ` (${days} dias)`}
                        </p>
                      )}
                    </div>
                    {(access.isExpired || nearExpiry) && (
                      <a
                        href={purchaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary"
                      >
                        Renovar acesso
                      </a>
                    )}
                  </div>
                  {access.isExpired && (
                    <p className="mt-3 text-sm text-red-600">
                      Seu acesso a esta ferramenta venceu. Clique acima para renovar.
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
