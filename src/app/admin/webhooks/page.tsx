import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminWebhooksPanel } from "@/components/admin/AdminWebhooksPanel";
import { requireAdminUser } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export default async function AdminWebhooksPage() {
  let user;
  try {
    user = await requireAdminUser();
  } catch {
    redirect("/login?redirect=/admin/webhooks");
  }

  const tools = await prisma.tool.findMany({
    where: { active: true },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    include: { category: true },
  });

  return (
    <AdminLayout user={user}>
      <AdminWebhooksPanel
        tools={tools.map((tool) => ({
          slug: tool.slug,
          name: tool.displayName ?? tool.name,
          categorySlug: tool.category.slug,
          categoryName: tool.category.name,
        }))}
      />
    </AdminLayout>
  );
}
