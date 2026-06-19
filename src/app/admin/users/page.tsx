import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import { requireAdminUser } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  let user;
  try {
    user = await requireAdminUser();
  } catch {
    redirect("/login?redirect=/admin/users");
  }

  const [users, modules] = await Promise.all([
    prisma.user.findMany({
      where: { role: "customer" },
      orderBy: { createdAt: "desc" },
      include: {
        userModules: { include: { module: true } },
      },
    }),
    prisma.module.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <AdminLayout user={user}>
      <AdminUsersPanel
        users={users.map((entry) => ({
          id: entry.id,
          name: entry.name,
          email: entry.email,
          createdAt: entry.createdAt.toISOString(),
          accesses: entry.userModules.map((access) => ({
            id: access.id,
            moduleName: access.module.name,
            accessStatus: access.accessStatus,
            expiresAt: access.expiresAt?.toISOString() ?? null,
          })),
        }))}
        modules={modules.map((m) => ({ slug: m.slug, name: m.name }))}
      />
    </AdminLayout>
  );
}
