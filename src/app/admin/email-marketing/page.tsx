import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminEmailMarketingPanel } from "@/components/admin/AdminEmailMarketingPanel";
import { requireAdminUser } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export default async function AdminEmailMarketingPage() {
  let user;
  try {
    user = await requireAdminUser();
  } catch {
    redirect("/login?redirect=/admin/email-marketing");
  }

  const tools = await prisma.tool.findMany({
    where: { active: true },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    select: { slug: true, name: true },
  });

  return (
    <AdminLayout user={user}>
      <AdminEmailMarketingPanel tools={tools} />
    </AdminLayout>
  );
}
