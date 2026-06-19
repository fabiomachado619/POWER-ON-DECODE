import { redirect } from "next/navigation";

export default function AdminPaymentEventsRedirectPage() {
  redirect("/admin/webhooks");
}
