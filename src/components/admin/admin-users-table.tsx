"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { UserRole } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  isSuspended: boolean;
  suspendedAt: string | null;
  suspensionReason: string | null;
  createdAt: string;
  walkerProfile: {
    id: string;
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
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [error, setError] = useState("");

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

  async function handleSuspend(user: UserRow) {
    const reason = window.prompt(
      `Suspend ${user.email}? Optional reason for the user:`,
      ""
    );
    if (reason === null) return;

    setActingOn(user.id);
    setError("");

    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "suspend", reason: reason || undefined }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Failed to suspend user");
      setActingOn(null);
      return;
    }

    await load();
    setActingOn(null);
  }

  async function handleUnsuspend(user: UserRow) {
    if (!window.confirm(`Unsuspend ${user.email}?`)) return;

    setActingOn(user.id);
    setError("");

    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unsuspend" }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Failed to unsuspend user");
      setActingOn(null);
      return;
    }

    await load();
    setActingOn(null);
  }

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

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-trail-600" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sand-200 bg-white/80">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-sand-50">
              <tr className="text-sand-500">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Walker details</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Actions</th>
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
                  <td className="px-4 py-3">
                    {user.isSuspended ? (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                        Suspended
                      </span>
                    ) : (
                      <span className="text-sand-600">Active</span>
                    )}
                  </td>
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
                        <Link
                          href={`/walkers/${user.walkerProfile.id}`}
                          className="mt-1 block text-xs text-trail-700 underline"
                        >
                          View profile
                        </Link>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-sand-600">
                    {new Date(user.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {user.role !== "ADMIN" && (
                      user.isSuspended ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actingOn === user.id}
                          onClick={() => void handleUnsuspend(user)}
                        >
                          Unsuspend
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actingOn === user.id}
                          onClick={() => void handleSuspend(user)}
                        >
                          Suspend
                        </Button>
                      )
                    )}
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
