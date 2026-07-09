import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AdminAuditLogTable } from "@/components/admin/admin-audit-log-table";

export default async function AdminAuditLogPage() {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-trail-950">
        Audit log
      </h2>
      <p className="mt-1 text-sm text-sand-600">
        Every moderation and account action taken by admins.
      </p>
      <div className="mt-6">
        <AdminAuditLogTable />
      </div>
    </div>
  );
}
