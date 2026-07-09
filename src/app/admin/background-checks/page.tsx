import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { BackgroundCheckQueue } from "@/components/admin/background-check-queue";
import { getBackgroundCheckQueue } from "@/lib/background-check";
import { isCheckrConfigured } from "@/lib/checkr";

export default async function AdminBackgroundChecksPage() {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const items = await getBackgroundCheckQueue();

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-trail-950">
        Background checks ({items.length} pending)
      </h2>
      <p className="mt-1 text-sm text-sand-600">
        {isCheckrConfigured()
          ? "Paid tier upgrades automatically send Checkr invitations. Results sync via webhook."
          : "Checkr not configured — run npm run checkr:setup or manually mark walkers after external screening."}
      </p>
      <BackgroundCheckQueue initialItems={items} />
    </div>
  );
}
