import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminEmailTemplatesPanel } from "@/components/admin/AdminEmailTemplatesPanel";
import { requireSuperAdminUser } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export default async function AdminEmailTemplatesPage() {
  let user;
  try {
    user = await requireSuperAdminUser();
  } catch {
    redirect("/admin");
  }

  const templates = await prisma.emailTemplate.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <AdminLayout user={user}>
      <AdminEmailTemplatesPanel
        templates={templates.map((t) => ({
          id: t.id,
          slug: t.slug,
          name: t.name,
          subject: t.subject,
          bodyHtml: t.bodyHtml,
          bodyText: t.bodyText,
          active: t.active,
        }))}
      />
    </AdminLayout>
  );
}
