"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Preferences = {
  emailEnabled: boolean;
  smsEnabled: boolean;
  phone: string | null;
  emailConfigured: boolean;
  smsConfigured: boolean;
};

export function NotificationSettingsForm() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [phone, setPhone] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/notifications/preferences")
      .then((res) => res.json())
      .then((data: { preferences?: Preferences }) => {
        if (!data.preferences) return;
        setPreferences(data.preferences);
        setEmailEnabled(data.preferences.emailEnabled);
        setSmsEnabled(data.preferences.smsEnabled);
        setPhone(data.preferences.phone ?? "");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    const response = await fetch("/api/notifications/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emailEnabled,
        smsEnabled,
        phone: phone || null,
      }),
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(data.error ?? "Failed to save preferences");
      return;
    }

    setPreferences(data.preferences);
    setSaved(true);
  }

  if (loading) {
    return <p className="text-sm text-sand-600">Loading notification settings...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <label className="flex items-start gap-3 rounded-2xl border border-sand-200/80 bg-white/70 p-4">
        <input
          type="checkbox"
          checked={emailEnabled}
          onChange={(e) => setEmailEnabled(e.target.checked)}
          className="mt-1 rounded border-sand-300 text-trail-600 focus:ring-trail-500"
        />
        <span>
          <span className="block font-medium text-trail-900">Email notifications</span>
          <span className="mt-1 block text-sm text-sand-600">
            New messages, verification updates, and support replies.
          </span>
          {preferences && !preferences.emailConfigured && (
            <span className="mt-2 block text-sm text-amber-700">
              Email delivery isn&apos;t configured in this environment yet.
            </span>
          )}
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-2xl border border-sand-200/80 bg-white/70 p-4">
        <input
          type="checkbox"
          checked={smsEnabled}
          onChange={(e) => setSmsEnabled(e.target.checked)}
          className="mt-1 rounded border-sand-300 text-trail-600 focus:ring-trail-500"
        />
        <span>
          <span className="block font-medium text-trail-900">Text (SMS) notifications</span>
          <span className="mt-1 block text-sm text-sand-600">
            Short alerts to your mobile number. You can enable email and text together.
          </span>
          {preferences && !preferences.smsConfigured && (
            <span className="mt-2 block text-sm text-amber-700">
              SMS delivery isn&apos;t configured in this environment yet.
            </span>
          )}
        </span>
      </label>

      <div>
        <label htmlFor="notification-phone" className="text-sm font-medium text-trail-800">
          Mobile number for texts
        </label>
        <input
          id="notification-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(760) 555-0100"
          className="mt-1 w-full rounded-xl border border-sand-300 px-4 py-2.5 focus:border-trail-500 focus:outline-none focus:ring-2 focus:ring-trail-200"
        />
        <p className="mt-2 text-sm text-sand-600">
          Required when text notifications are enabled. Walkers can also use the
          phone on their listing if this is blank.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && (
        <p className="text-sm text-trail-700">Notification preferences saved.</p>
      )}

      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save preferences"}
      </Button>
    </form>
  );
}
