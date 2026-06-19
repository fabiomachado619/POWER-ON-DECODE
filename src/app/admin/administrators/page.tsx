import { redirect } from "next/navigation";
import { AdminAdministratorsPanel } from "@/components/admin/AdminAdministratorsPanel";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { requireSuperAdminUser } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export default async function AdminAdministratorsPage() {
  let user;
  try {
    user = await requireSuperAdminUser();
  } catch {
    redirect("/admin");
  }

  const administrators = await prisma.user.findMany({
    where: { role: { in: ["admin", "super_admin"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <AdminLayout user={user}>
      <AdminAdministratorsPanel
        administrators={administrators.map((administrator) => ({
          ...administrator,
          createdAt: administrator.createdAt.toISOString(),
        }))}
      />
    </AdminLayout>
  );
}
