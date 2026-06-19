import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminAccessPanel } from "@/components/admin/AdminAccessPanel";
import { requireAdminUser } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export default async function AdminAccessPage() {
  let user;
  try {
    user = await requireAdminUser();
  } catch {
    redirect("/login?redirect=/admin/access");
  }

  const [accesses, modules] = await Promise.all([
    prisma.userModule.findMany({
      include: { user: true, module: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.module.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <AdminLayout user={user}>
      <AdminAccessPanel
        modules={modules.map((m) => ({ slug: m.slug, name: m.name }))}
        accesses={accesses.map((a) => ({
          id: a.id,
          userName: a.user.name,
          userEmail: a.user.email,
          moduleName: a.module.name,
          moduleSlug: a.module.slug,
          accessStatus: a.accessStatus,
          startsAt: a.startsAt?.toISOString() ?? null,
          expiresAt: a.expiresAt?.toISOString() ?? null,
          source: a.source,
        }))}
      />
    </AdminLayout>
  );
}
