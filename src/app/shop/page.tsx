import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ShopFilters } from "@/components/ShopFilters";
import { ToolCard } from "@/components/ToolCard";
import { getSessionUser } from "@/lib/auth";
import {
  getActiveCategories,
  getShopTools,
  getUserToolsCatalog,
} from "@/lib/tools";
import { getServerTranslations } from "@/i18n/server";

interface ShopPageProps {
  searchParams: { category?: string; manufacturer?: string };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { t } = await getServerTranslations();

  const [catalog, categories, shopItems] = await Promise.all([
    getUserToolsCatalog(user.id),
    getActiveCategories(),
    getShopTools(user.id, {
      categorySlug: searchParams.category,
      manufacturerSlug: searchParams.manufacturer,
    }),
  ]);

  const manufacturers = Array.from(
    new Map(
      catalog.allTools.map((item) => [item.manufacturer.slug, item.manufacturer])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="page-shell">
      <AppHeader user={user} unlockedCount={catalog.unlockedCount} />

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-8">
          <Link href="/dashboard" className="btn-link">
            ← {t.nav.myTools}
          </Link>
          <h1 className="section-title mt-4">{t.shop.title}</h1>
          <p className="section-subtitle">{t.shop.subtitle}</p>
        </div>

        <Suspense fallback={<div className="card h-20 animate-pulse" />}>
          <ShopFilters
            categories={categories}
            manufacturers={manufacturers}
            currentCategory={searchParams.category}
            currentManufacturer={searchParams.manufacturer}
          />
        </Suspense>

        {shopItems.length === 0 ? (
          <div className="empty-state mt-8">{t.shop.empty}</div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shopItems.map((tool) => (
              <ToolCard key={tool.id} tool={tool} variant="grid" />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
