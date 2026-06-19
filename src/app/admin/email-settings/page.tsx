import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminEmailSettingsPanel } from "@/components/admin/AdminEmailSettingsPanel";
import { requireSuperAdminUser } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export default async function AdminEmailSettingsPage() {
  let user;
  try {
    user = await requireSuperAdminUser();
  } catch {
    redirect("/admin");
  }

  const settings = await prisma.emailSettings.findUnique({
    where: { id: "default" },
  });

  const initial = {
    smtpHost: settings?.smtpHost ?? process.env.SMTP_HOST ?? "",
    smtpPort: String(settings?.smtpPort ?? process.env.SMTP_PORT ?? 587),
    smtpUser: settings?.smtpUser ?? process.env.SMTP_USER ?? "",
    smtpPassword: settings?.smtpPassword ? "********" : "",
    smtpFromName:
      settings?.smtpFromName ?? process.env.SMTP_FROM_NAME ?? "Power On Decode",
    smtpFromEmail:
      settings?.smtpFromEmail ?? process.env.SMTP_FROM_EMAIL ?? "",
    smtpSecure: settings?.smtpSecure ?? process.env.SMTP_SECURE === "true",
  };

  return (
    <AdminLayout user={user}>
      <AdminEmailSettingsPanel initial={initial} />
    </AdminLayout>
  );
}
