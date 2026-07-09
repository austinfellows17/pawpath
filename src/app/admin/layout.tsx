import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <>
      <div className="hero-band border-b border-sand-200/50">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <p className="section-label">Administration</p>
          <h1 className="headline-lg mt-2">PawPath Admin</h1>
          <p className="body-lg mt-2 max-w-2xl">
            Live platform metrics, user directory, background checks, and
            moderation queues.
          </p>
          <div className="mt-6">
            <AdminNav />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </>
  );
}
