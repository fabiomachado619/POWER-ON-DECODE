import { redirect } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import {
  ToolAccessGuard,
  ToolHeader,
  ToolRunnerPage,
} from "@/components/tool-runner";
import { assertToolAccess } from "@/lib/toolEngine";
import { getSessionUser } from "@/lib/auth";
import { getUserToolsCatalog, isToolVisibleForCustomers } from "@/lib/tools";
import { getServerTranslations } from "@/i18n/server";
import { getRegisteredTool } from "@/tools/registry";

interface ToolPageParams {
  params: { slug: string };
}

export default async function DynamicToolPage({ params }: ToolPageParams) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const tool = getRegisteredTool(params.slug);
  if (!tool || !tool.config.isImplemented) {
    redirect("/dashboard");
  }

  const visible = await isToolVisibleForCustomers(params.slug);

  const [{ t }, catalog, access] = await Promise.all([
    getServerTranslations(),
    getUserToolsCatalog(user.id),
    assertToolAccess(user, tool),
  ]);

  const catalogTool = catalog.allTools.find(
    (item) => item.slug === tool.config.slug
  );

  if (!visible) {
    return (
      <div className="page-shell">
        <AppHeader user={user} unlockedCount={catalog.unlockedCount} />
        <main className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
          <Link href="/dashboard" className="btn-link">
            {t.tool.backHome}
          </Link>
          <div className="card mt-6">
            <h1 className="text-xl font-bold text-ink">
              {catalogTool?.displayName ?? tool.config.name}
            </h1>
            <p className="mt-3 text-sm text-ink-muted">
              {t.tool.temporarilyUnavailable}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <AppHeader user={user} unlockedCount={catalog.unlockedCount} />

      <main className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
        <Link href="/dashboard" className="btn-link">
          {t.tool.backHome}
        </Link>

        <ToolHeader
          title={catalogTool?.displayName ?? tool.config.name}
          description={catalogTool?.description ?? tool.config.name}
          badge={access.allowed ? t.tool.toolUnlocked : undefined}
        />

        <ToolAccessGuard
          allowed={access.allowed}
          reason={access.reason}
          purchaseUrl={catalogTool?.purchaseUrl ?? tool.config.purchaseUrl}
          dashboardHref="/dashboard"
          dashboardLabel={t.tool.backHome}
          buyLabel={t.card.buyAccess}
        >
          <ToolRunnerPage tool={tool} />
        </ToolAccessGuard>
      </main>
    </div>
  );
}
