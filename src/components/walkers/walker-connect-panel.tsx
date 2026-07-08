import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getConversationWithWalker } from "@/lib/messages";
import { StartMessageButton } from "@/components/messages/start-message-button";
import { Phone, Mail, Lock } from "lucide-react";
import { db } from "@/lib/db";

export async function WalkerConnectPanel({
  walkerProfileId,
  walkerName,
  walkerUserId,
}: {
  walkerProfileId: string;
  walkerName: string;
  walkerUserId: string;
}) {
  const session = await getServerSession(authOptions);
  let existingConversationId: string | null = null;
  let contactRevealed = false;
  let phone: string | null = null;
  let email: string | null = null;

  const walkerProfile = await db.walkerProfile.findUnique({
    where: { id: walkerProfileId },
    select: { phone: true, email: true },
  });

  if (session?.user?.role === "OWNER") {
    const conversation = await getConversationWithWalker(
      session.user.id,
      walkerProfileId
    );
    existingConversationId = conversation?.id ?? null;
    contactRevealed = conversation?.contactRevealed ?? false;
  }

  if (contactRevealed && walkerProfile) {
    phone = walkerProfile.phone;
    email = walkerProfile.email;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-trail-200 bg-trail-50 p-5">
        <h3 className="font-medium text-trail-900">Connect</h3>
        <p className="mt-2 text-sm text-trail-700">
          Send a message to start a conversation. Contact info is shared only
          after you reach out.
        </p>
        <div className="mt-4">
          <StartMessageButton
            walkerProfileId={walkerProfileId}
            walkerName={walkerName}
            existingConversationId={existingConversationId}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-sand-200 bg-sand-50 p-5">
        <h3 className="flex items-center gap-2 font-medium text-sand-800">
          <Lock className="h-4 w-4" />
          Contact info
        </h3>
        {contactRevealed ? (
          <div className="mt-3 space-y-2 text-sm text-trail-800">
            {phone ? (
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {phone}
              </p>
            ) : (
              <p className="flex items-center gap-2 text-sand-500">
                <Phone className="h-4 w-4" />
                Phone not provided
              </p>
            )}
            {email ? (
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {email}
              </p>
            ) : (
              <p className="flex items-center gap-2 text-sand-500">
                <Mail className="h-4 w-4" />
                Email not provided
              </p>
            )}
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-sand-600">
              Phone and email are hidden until you send a message.
            </p>
            <div className="mt-3 space-y-2 text-sm text-sand-500">
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> ••• ••• ••••
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> •••@•••.com
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
