import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ReviewInquiryThread } from "@/components/messages/review-inquiry-thread";

export default async function ReviewInquiryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "WALKER") {
    redirect("/messages");
  }

  const { id } = await params;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <ReviewInquiryThread inquiryId={id} />
    </div>
  );
}
