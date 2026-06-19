import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ToolCard } from "@/components/ToolCard";
import { getSessionUser } from "@/lib/auth";
import { getToolsByCategory, getUserToolsCatalog } from "@/lib/tools";
import { getCategoryDescription, getCategoryLabel } from "@/i18n/helpers";
import { getServerTranslations } from "@/i18n/server";

interface CategoryPageProps {
  params: { slug: string };
  searchParams: { manufacturer?: string };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { t } = await getServerTranslations();
  const catalog = await getUserToolsCatalog(user.id);
  const data = await getToolsByCategory(
    user.id,
    params.slug,
    searchParams.manufacturer
  );

  if (!data) notFound();

  const { category, manufacturers, unlocked, locked } = data;
  const categoryName = getCategoryLabel(category.slug, t);
  const categoryDesc = getCategoryDescription(category.slug, t);

  return (
    <div className="page-shell">
      <AppHeader user={user} unlockedCount={catalog.unlockedCount} />

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <Link href="/dashboard" className="btn-link">
          ← {t.nav.myTools}
        </Link>

        <div className="mb-8 mt-4">
          <h1 className="section-title">{categoryName}</h1>
          <p className="section-subtitle">{categoryDesc}</p>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href={`/categories/${params.slug}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              !searchParams.manufacturer
                ? "bg-brand-muted text-brand-dark"
                : "bg-surface text-ink-muted ring-1 ring-divider"
            }`}
          >
            {t.categoryPage.allManufacturers}
          </Link>
          {manufacturers.map((m) => (
            <Link
              key={m.slug}
              href={`/categories/${params.slug}?manufacturer=${m.slug}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                searchParams.manufacturer === m.slug
                  ? "bg-brand-muted text-brand-dark"
                  : "bg-surface text-ink-muted ring-1 ring-divider"
              }`}
            >
              {m.name}
            </Link>
          ))}
        </div>

        {unlocked.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-ink">
              {t.categoryPage.unlocked}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {unlocked.map((tool) => (
                <ToolCard key={tool.id} tool={tool} variant="grid" />
              ))}
            </div>
          </section>
        )}

        {locked.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-ink">
              {t.categoryPage.locked}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {locked.map((tool) => (
                <ToolCard key={tool.id} tool={tool} variant="grid" />
              ))}
            </div>
          </section>
        )}

        {unlocked.length === 0 && locked.length === 0 && (
          <div className="empty-state">{t.categoryPage.empty}</div>
        )}
      </main>
    </div>
  );
}
