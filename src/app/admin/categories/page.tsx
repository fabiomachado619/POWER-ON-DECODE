import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCategoriesPanel } from "@/components/admin/AdminCategoriesPanel";
import { requireAdminUser } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export default async function AdminCategoriesPage() {
  let user;
  try {
    user = await requireAdminUser();
  } catch {
    redirect("/login?redirect=/admin/categories");
  }

  const categories = await prisma.toolCategory.findMany({
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { tools: true } } },
  });

  return (
    <AdminLayout user={user}>
      <AdminCategoriesPanel
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          icon: c.icon,
          displayOrder: c.displayOrder,
          active: c.active,
          toolCount: c._count.tools,
        }))}
      />
    </AdminLayout>
  );
}
