import { db } from "@/lib/db";
import { queueNotification } from "@/lib/notifications";

export async function suspendUser({
  userId,
  adminId,
  reason,
}: {
  userId: string;
  adminId: string;
  reason?: string;
}) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      email: true,
      isSuspended: true,
      walkerProfile: { select: { id: true } },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === "ADMIN") {
    throw new Error("Cannot suspend admin accounts");
  }

  if (user.isSuspended) {
    throw new Error("User is already suspended");
  }

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: {
        isSuspended: true,
        suspendedAt: new Date(),
        suspensionReason: reason ?? null,
      },
    }),
    ...(user.walkerProfile
      ? [
          db.walkerProfile.update({
            where: { id: user.walkerProfile.id },
            data: { isActive: false },
          }),
        ]
      : []),
    db.adminAction.create({
      data: {
        adminId,
        action: "USER_SUSPENDED",
        targetType: "User",
        targetId: userId,
        notes: reason,
      },
    }),
  ]);

  queueNotification({
    userId,
    subject: "Your PawPath account has been suspended",
    emailBody: `Your PawPath account has been suspended.${reason ? `\n\nReason: ${reason}` : ""}\n\nIf you believe this is a mistake, reply to this email or contact support.`,
    smsBody: "PawPath: Your account has been suspended. Check your email for details.",
  });
}

export async function unsuspendUser({
  userId,
  adminId,
  notes,
}: {
  userId: string;
  adminId: string;
  notes?: string;
}) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, isSuspended: true, role: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.isSuspended) {
    throw new Error("User is not suspended");
  }

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: {
        isSuspended: false,
        suspendedAt: null,
        suspensionReason: null,
      },
    }),
    db.adminAction.create({
      data: {
        adminId,
        action: "USER_UNSUSPENDED",
        targetType: "User",
        targetId: userId,
        notes,
      },
    }),
  ]);
}
