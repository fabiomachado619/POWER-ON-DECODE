import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { getSessionUser } from "@/lib/auth";
import { getUserAccessList } from "@/lib/accessControl";
import { canAccessAdminArea } from "@/lib/roles";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=/account");

  const accesses = await getUserAccessList(user.id);
  const activeCount = accesses.filter((a) => a.isActive).length;

  return (
    <div className="page-shell">
      <AppHeader user={user} unlockedCount={activeCount} />

      <main className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
        <h1 className="section-title">Minha conta</h1>
        <p className="section-subtitle">Gerencie seus dados e acessos.</p>

        <div className="mt-8 grid gap-4">
          <div className="card">
            <h2 className="text-lg font-semibold text-ink">Dados pessoais</h2>
            <p className="mt-2 text-sm text-ink-muted">Nome: {user.name}</p>
            <p className="text-sm text-ink-muted">E-mail: {user.email}</p>
          </div>

          <Link href="/account/access" className="card card-hover block">
            <h2 className="text-lg font-semibold text-ink">Meus acessos</h2>
            <p className="mt-2 text-sm text-ink-muted">
              {activeCount} acesso{activeCount === 1 ? "" : "s"} ativo
              {activeCount === 1 ? "" : "s"}. Veja datas de vencimento e renove quando necessário.
            </p>
          </Link>

          <Link href="/account/password" className="card card-hover block">
            <h2 className="text-lg font-semibold text-ink">Alterar senha</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Atualize sua senha de acesso à plataforma.
            </p>
          </Link>

          {canAccessAdminArea(user.role) && (
            <Link href="/admin" className="card card-hover block border-brand/20">
              <h2 className="text-lg font-semibold text-brand-dark">Painel administrativo</h2>
              <p className="mt-2 text-sm text-ink-muted">
                Acessar área de administração.
              </p>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
