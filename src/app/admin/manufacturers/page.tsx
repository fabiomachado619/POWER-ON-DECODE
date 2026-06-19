import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminManufacturersPanel } from "@/components/admin/AdminManufacturersPanel";
import { requireAdminUser } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export default async function AdminManufacturersPage() {
  let user;
  try {
    user = await requireAdminUser();
  } catch {
    redirect("/login?redirect=/admin/manufacturers");
  }

  const manufacturers = await prisma.manufacturer.findMany({
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  return (
    <AdminLayout user={user}>
      <AdminManufacturersPanel
        manufacturers={manufacturers.map((m) => ({
          id: m.id,
          name: m.name,
          slug: m.slug,
          logoUrl: m.logoUrl,
          displayOrder: m.displayOrder,
          active: m.active,
        }))}
      />
    </AdminLayout>
  );
}
