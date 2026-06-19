import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ToolCard } from "@/components/ToolCard";
import { getSessionUser } from "@/lib/auth";
import { getFullCatalogGrouped, getUserToolsCatalog } from "@/lib/tools";
import { getCategoryDescription, getCategoryLabel } from "@/i18n/helpers";
import { getServerTranslations } from "@/i18n/server";

export default async function CatalogPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { t } = await getServerTranslations();
  const [catalog, groups] = await Promise.all([
    getUserToolsCatalog(user.id),
    getFullCatalogGrouped(user.id),
  ]);

  return (
    <div className="page-shell">
      <AppHeader user={user} unlockedCount={catalog.unlockedCount} />

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-10">
          <h1 className="section-title">{t.catalog.title}</h1>
          <p className="section-subtitle">{t.catalog.subtitle}</p>
        </div>

        <div className="space-y-12">
          {groups.map(({ category, manufacturers }) => {
            const categoryName = getCategoryLabel(category.slug, t);
            const categoryDesc = getCategoryDescription(category.slug, t);
            return (
              <section key={category.slug}>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold text-ink">{categoryName}</h2>
                    <p className="mt-1 text-sm text-ink-muted">{categoryDesc}</p>
                  </div>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="btn-secondary text-sm"
                  >
                    {t.catalog.viewCategory}
                  </Link>
                </div>

                {manufacturers.map(({ manufacturer, tools }) => (
                  <div key={manufacturer.slug} className="mb-8">
                    <h3 className="mb-4 text-lg font-semibold text-brand-dark">
                      {manufacturer.name}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {tools.map((tool) => (
                        <ToolCard key={tool.id} tool={tool} variant="grid" />
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
