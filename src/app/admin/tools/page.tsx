import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminToolsPanel } from "@/components/admin/AdminToolsPanel";
import { requireAdminUser } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import {
  isToolImplementedInRegistry,
  isToolRegistered,
} from "@/tools/registry";

export default async function AdminToolsPage() {
  let user;
  try {
    user = await requireAdminUser();
  } catch {
    redirect("/login?redirect=/admin/tools");
  }

  const [tools, categories] = await Promise.all([
    prisma.tool.findMany({
      include: { manufacturer: true, module: true, category: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.toolCategory.findMany({
      where: { active: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <AdminLayout user={user}>
      <AdminToolsPanel
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
        }))}
        tools={tools.map((tool) => ({
          id: tool.id,
          slug: tool.slug,
          displayName: tool.displayName,
          name: tool.name,
          description: tool.description,
          longDescription: tool.longDescription,
          purchaseUrl: tool.purchaseUrl,
          buttonText: tool.buttonText,
          displayOrder: tool.displayOrder,
          featured: tool.featured,
          visible: tool.visible,
          showInStore: tool.showInStore,
          active: tool.active,
          isImplemented: tool.isImplemented,
          coverImageUrl: tool.coverImageUrl,
          manufacturerName: tool.manufacturer.name,
          categoryId: tool.categoryId,
          categoryName: tool.category.name,
          registryImplemented: isToolImplementedInRegistry(tool.slug),
          registryMissing: !isToolRegistered(tool.slug),
        }))}
      />
    </AdminLayout>
  );
}
