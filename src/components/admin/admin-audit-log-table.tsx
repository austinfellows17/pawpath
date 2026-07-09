"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type AuditRow = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  notes: string | null;
  createdAt: string;
  admin: { name: string | null; email: string };
};

const actionLabels: Record<string, string> = {
  LISTING_APPROVED: "Listing approved",
  LISTING_REJECTED: "Listing rejected",
  USER_SUSPENDED: "User suspended",
  USER_UNSUSPENDED: "User unsuspended",
};

export function AdminAuditLogTable() {
  const [actions, setActions] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/audit-log?limit=100");
    if (response.ok) {
      const data = await response.json();
      setActions(data.actions);
      setTotal(data.total);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-sand-600">{total} admin actions logged</p>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-trail-600" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sand-200 bg-white/80">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-sand-50">
              <tr className="text-sand-500">
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((row) => (
                <tr key={row.id} className="border-t border-sand-100">
                  <td className="px-4 py-3 text-sand-600">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-trail-900">
                      {row.admin.name ?? "Admin"}
                    </p>
                    <p className="text-sand-600">{row.admin.email}</p>
                  </td>
                  <td className="px-4 py-3 text-trail-800">
                    {actionLabels[row.action] ?? row.action}
                  </td>
                  <td className="px-4 py-3 text-sand-600">
                    {row.targetType}
                    <span className="block font-mono text-xs text-sand-500">
                      {row.targetId}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sand-600">
                    {row.notes ?? "—"}
                  </td>
                </tr>
              ))}
              {actions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sand-500">
                    No admin actions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
