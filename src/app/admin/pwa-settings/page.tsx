import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPwaSettingsPanel } from "@/components/admin/AdminPwaSettingsPanel";
import { requireAdminUser } from "@/lib/adminAuth";

export default async function AdminPwaSettingsPage() {
  let user;
  try {
    user = await requireAdminUser();
  } catch {
    redirect("/login?redirect=/admin/pwa-settings");
  }

  return (
    <AdminLayout user={user}>
      <AdminPwaSettingsPanel />
    </AdminLayout>
  );
}
