import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ProcedureListItem } from "@/components/ProcedureListItem";
import { getSessionUser } from "@/lib/auth";
import { getManufacturerTools, getUserToolsCatalog } from "@/lib/tools";

interface ManufacturerPageProps {
  params: { manufacturerSlug: string };
}

export default async function ManufacturerProceduresPage({
  params,
}: ManufacturerPageProps) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { manufacturerSlug } = params;
  const group = await getManufacturerTools(user.id, manufacturerSlug);

  if (!group) {
    notFound();
  }

  const catalog = await getUserToolsCatalog(user.id);

  return (
    <div className="page-shell">
      <AppHeader user={user} unlockedCount={catalog.unlockedCount} />

      <main className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
        <Link href="/catalog" className="btn-link">
          ← Voltar ao catálogo completo
        </Link>

        <div className="mb-8 mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-dark">
            Montadora
          </p>
          <h1 className="mt-1 text-3xl font-black text-ink">
            {group.manufacturer.name}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Procedimentos disponíveis para esta montadora. Ferramentas liberadas
            abrem diretamente; bloqueadas redirecionam para compra.
          </p>
        </div>

        <div className="space-y-4">
          {group.tools.map((tool) => (
            <ProcedureListItem key={tool.id} tool={tool} />
          ))}
        </div>
      </main>
    </div>
  );
}
