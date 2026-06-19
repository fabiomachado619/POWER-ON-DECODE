import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getAdminDashboardStats } from "@/lib/adminStats";
import { requireAdminUser } from "@/lib/adminAuth";

export default async function AdminDashboardPage() {
  let user;
  try {
    user = await requireAdminUser();
  } catch {
    redirect("/login?redirect=/admin");
  }

  const stats = await getAdminDashboardStats();

  const cards = [
    { label: "Total de usuários", value: stats.totalUsers },
    { label: "Acessos ativos", value: stats.activeAccesses },
    { label: "Acessos vencidos", value: stats.expiredAccesses },
    { label: "Vencendo em 30 dias", value: stats.expiringSoon },
    { label: "Ferramentas cadastradas", value: stats.totalTools },
    { label: "Operações de decode", value: stats.totalDecodeLogs },
  ];

  return (
    <AdminLayout user={user}>
      <div className="mb-6">
        <h1 className="section-title">Dashboard administrativo</h1>
        <p className="section-subtitle">
          Visão geral da plataforma comercial. Regras técnicas de decode não são editáveis aqui.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="card">
            <p className="text-sm text-ink-muted">{card.label}</p>
            <p className="mt-2 text-3xl font-black text-ink">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="text-lg font-semibold text-ink">Últimos cadastros</h2>
          <ul className="mt-4 space-y-3">
            {stats.recentUsers.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span className="text-ink">{item.name}</span>
                <span className="text-ink-muted">{item.email}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2 className="text-lg font-semibold text-ink">Últimos webhooks</h2>
          <ul className="mt-4 space-y-3">
            {stats.recentWebhooks.map((item) => (
              <li key={item.id} className="text-sm">
                <p className="text-ink">{item.provider} — {item.status}</p>
                <p className="text-ink-muted">{item.customerEmail ?? "Sem email"}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AdminLayout>
  );
}
