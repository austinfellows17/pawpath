import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AdminUsersTable } from "@/components/admin/admin-users-table";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-trail-950">
        User directory
      </h2>
      <p className="mt-1 text-sm text-sand-600">
        All platform users with role, location, and walker status.
      </p>
      <div className="mt-6">
        <AdminUsersTable />
      </div>
    </div>
  );
}
