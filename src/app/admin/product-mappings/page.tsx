import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProductMappingsPanel } from "@/components/admin/AdminProductMappingsPanel";
import { requireAdminUser } from "@/lib/adminAuth";
import { listProductMappings } from "@/lib/productMapping";
import { prisma } from "@/lib/prisma";

export default async function AdminProductMappingsPage() {
  let user;
  try {
    user = await requireAdminUser();
  } catch {
    redirect("/login?redirect=/admin/product-mappings");
  }

  const [mappings, tools] = await Promise.all([
    listProductMappings(),
    prisma.tool.findMany({
      where: { active: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      select: { slug: true, name: true },
    }),
  ]);

  return (
    <AdminLayout user={user}>
      <AdminProductMappingsPanel mappings={mappings} tools={tools} />
    </AdminLayout>
  );
}
