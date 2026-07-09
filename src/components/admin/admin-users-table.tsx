"use client";

import { useCallback, useEffect, useState } from "react";
import { UserRole } from "@prisma/client";
import { Loader2 } from "lucide-react";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  createdAt: string;
  walkerProfile: {
    listingTier: string;
    listingReviewStatus: string;
    isActive: boolean;
    isBackgroundChecked: boolean;
    backgroundCheckStatus: string;
    city: string | null;
    zipCode: string;
  } | null;
  ownerProfile: {
    city: string | null;
    zipCode: string;
    dogName: string | null;
  } | null;
};

export function AdminUsersTable() {
  const [role, setRole] = useState<UserRole | "ALL">("ALL");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "50" });
    if (role !== "ALL") params.set("role", role);

    const response = await fetch(`/api/admin/users?${params}`);
    if (response.ok) {
      const data = await response.json();
      setUsers(data.users);
      setTotal(data.total);
    }
    setLoading(false);
  }, [role]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-sand-600">{total} users total</p>
        <select
          value={role}
          onChange={(e) =>
            setRole(e.target.value as UserRole | "ALL")
          }
          className="rounded-full border border-sand-300 bg-white px-4 py-2 text-sm"
        >
          <option value="ALL">All roles</option>
          <option value="OWNER">Owners</option>
          <option value="WALKER">Walkers</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-trail-600" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sand-200 bg-white/80">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-sand-50">
              <tr className="text-sand-500">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Walker details</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-sand-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-trail-900">{user.name ?? "—"}</p>
                    <p className="text-sand-600">{user.email}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{user.role.toLowerCase()}</td>
                  <td className="px-4 py-3 text-sand-600">
                    {user.walkerProfile
                      ? `${user.walkerProfile.city ?? user.walkerProfile.zipCode}`
                      : user.ownerProfile
                        ? `${user.ownerProfile.city ?? user.ownerProfile.zipCode}${user.ownerProfile.dogName ? ` · ${user.ownerProfile.dogName}` : ""}`
                        : "—"}
                  </td>
                  <td className="px-4 py-3 text-sand-600">
                    {user.walkerProfile ? (
                      <>
                        {user.walkerProfile.isActive ? "Live" : user.walkerProfile.listingReviewStatus}
                        {" · "}
                        {user.walkerProfile.listingTier}
                        {user.walkerProfile.isBackgroundChecked ? " · BG Verified" : ""}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-sand-600">
                    {new Date(user.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
