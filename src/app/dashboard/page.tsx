import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { CategoryCard } from "@/components/CategoryCard";
import { ContentSection } from "@/components/ContentSection";
import { HorizontalScrollRow } from "@/components/HorizontalScrollRow";
import { HistoryTable } from "@/components/HistoryTable";
import { ToolCard } from "@/components/ToolCard";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserToolsCatalog } from "@/lib/tools";
import { interpolate } from "@/i18n";
import { getServerTranslations } from "@/i18n/server";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { t } = await getServerTranslations();

  const [catalog, logs] = await Promise.all([
    getUserToolsCatalog(user.id),
    prisma.decodeLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { procedure: { include: { module: true } } },
    }),
  ]);

  const recentLogs = logs.map((log) => ({
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

  const unlockedLabel =
    catalog.unlockedCount === 1
      ? interpolate(t.dashboard.toolsUnlocked, { count: catalog.unlockedCount })
      : interpolate(t.dashboard.toolsUnlockedPlural, {
          count: catalog.unlockedCount,
        });

  return (
    <div className="page-shell">
      <AppHeader user={user} unlockedCount={catalog.unlockedCount} />

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <section className="relative mb-12 overflow-hidden rounded-3xl border border-divider bg-surface p-8 shadow-elevated">
          <div className="absolute inset-0 bg-hero-accent" />
          <div className="relative">
            <span className="badge-unlocked mb-4">{unlockedLabel}</span>
            <h1 className="text-3xl font-black tracking-tight text-ink md:text-4xl">
              {t.nav.myTools}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-ink-muted">
              {interpolate(t.dashboard.welcome, { name: user.name })}{" "}
              {t.dashboard.heroSubtitle}
            </p>
          </div>
        </section>

        <ContentSection
          title={t.dashboard.chooseService}
          subtitle={t.dashboard.chooseServiceSubtitle}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {catalog.categories.map((category) => (
              <CategoryCard key={category.slug} category={category} />
            ))}
          </div>
        </ContentSection>

        {catalog.categories.map((category) => {
          const tools = catalog.unlockedByCategory[category.slug] ?? [];
          const categoryName =
            t.categories[category.slug as keyof typeof t.categories] ??
            category.name;
          return (
            <ContentSection
              key={category.slug}
              title={interpolate(t.dashboard.categoryUnlocked, {
                category: categoryName,
              })}
              subtitle={interpolate(t.dashboard.categoryUnlockedSubtitle, {
                category: categoryName.toLowerCase(),
              })}
              actionHref={`/categories/${category.slug}`}
              actionLabel={interpolate(t.dashboard.viewCategory, {
                category: categoryName,
              })}
              isEmpty={tools.length === 0}
              emptyMessage={t.dashboard.emptyCategory}
            >
              {tools.length > 0 && (
                <HorizontalScrollRow>
                  {tools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </HorizontalScrollRow>
              )}
            </ContentSection>
          );
        })}

        <ContentSection
          title={t.dashboard.shopTitle}
          subtitle={t.dashboard.shopSubtitle}
          actionHref="/shop"
          actionLabel={t.dashboard.viewShop}
          isEmpty={catalog.shopItems.length === 0}
          emptyMessage={t.dashboard.shopEmpty}
        >
          <HorizontalScrollRow>
            {catalog.shopItems.slice(0, 8).map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </HorizontalScrollRow>
        </ContentSection>

        <ContentSection
          title={t.dashboard.recentHistory}
          subtitle={t.dashboard.recentHistorySubtitle}
          actionHref="/modules"
          actionLabel={t.dashboard.viewFullHistory}
        >
          <HistoryTable logs={recentLogs} />
        </ContentSection>
      </main>
    </div>
  );
}
