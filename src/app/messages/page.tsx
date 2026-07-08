import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { MessagesInbox } from "@/components/messages/inbox-list";

export default async function MessagesPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <>
      <div className="hero-band border-b border-sand-200/50">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-14">
          <p className="section-label">Inbox</p>
          <h1 className="headline-lg mt-3">Messages</h1>
          <p className="body-lg mt-3">
            In-app messaging connects you with walkers. Contact info is revealed
            after you send the first message.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <MessagesInbox />
      </div>
    </>
  );
}
