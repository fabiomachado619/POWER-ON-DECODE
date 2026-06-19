import Link from "next/link";
import { ContentSection } from "@/components/ContentSection";
import { HorizontalScrollRow } from "@/components/HorizontalScrollRow";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicToolCard } from "@/components/PublicToolCard";
import { getSessionUser } from "@/lib/auth";
import { getPublicStoreCatalog } from "@/lib/tools";
import { getCategoryLabel } from "@/i18n/helpers";
import { getServerTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [user, catalog, { t }] = await Promise.all([
    getSessionUser(),
    getPublicStoreCatalog(),
    getServerTranslations(),
  ]);

  const categoryOrder = ["decode", "reset", "odometro", "checksum"];
  const hasAnyTools = catalog.totalCount > 0;

  return (
    <div className="page-shell">
      <PublicHeader user={user} />

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <section
          id="hero"
          className="relative mb-12 overflow-hidden rounded-3xl border border-divider bg-surface p-8 shadow-elevated md:p-12"
        >
          <div className="absolute inset-0 bg-hero-accent" />
          <div className="relative max-w-3xl">
            <h1 className="text-3xl font-black tracking-tight text-ink md:text-5xl">
              {t.home.heroTitle}
            </h1>
            <p className="mt-4 text-base text-ink-muted md:text-lg">
              {t.home.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#featured" className="btn-primary">
                {t.home.viewTools}
              </a>
              <Link href="/login" className="btn-secondary">
                {t.home.loginToAccount}
              </Link>
            </div>
          </div>
        </section>

        {!hasAnyTools ? (
          <div className="empty-state">{t.home.emptyStore}</div>
        ) : (
          <>
            <div id="featured">
              <ContentSection
                title={t.home.featuredTitle}
                isEmpty={catalog.featured.length === 0}
                emptyMessage={t.home.emptyFeatured}
              >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {catalog.featured.map((tool) => (
                    <PublicToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </ContentSection>
            </div>

            {categoryOrder.map((slug) => {
              const tools = catalog.byCategory[slug] ?? [];
              const categoryName = getCategoryLabel(slug, t);
              return (
                <ContentSection
                  key={slug}
                  title={categoryName}
                  isEmpty={tools.length === 0}
                  emptyMessage={t.home.emptyCategory}
                >
                  <HorizontalScrollRow>
                    {tools.map((tool) => (
                      <div
                        key={tool.id}
                        className="min-w-[280px] max-w-[280px] shrink-0"
                      >
                        <PublicToolCard tool={tool} />
                      </div>
                    ))}
                  </HorizontalScrollRow>
                </ContentSection>
              );
            })}
          </>
        )}
      </main>
    </div>
  );
}
