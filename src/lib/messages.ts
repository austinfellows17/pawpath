import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/app-url";
import { queueNotification } from "@/lib/notifications";

export type ConversationSummary = {
  id: string;
  otherUser: {
    id: string;
    name: string | null;
    role: "OWNER" | "WALKER";
  };
  lastMessage: {
    body: string;
    createdAt: string;
    isFromMe: boolean;
  } | null;
  contactRevealed: boolean;
  updatedAt: string;
};

export type ConversationDetail = ConversationSummary & {
  messages: {
    id: string;
    body: string;
    senderId: string;
    createdAt: string;
    isFromMe: boolean;
  }[];
  walkerContact: {
    phone: string | null;
    email: string | null;
  } | null;
};

export async function requireAuthUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function getConversationsForUser(
  userId: string
): Promise<ConversationSummary[]> {
  const conversations = await db.conversation.findMany({
    where: {
      OR: [{ ownerId: userId }, { walkerUserId: userId }],
    },
    include: {
      owner: { select: { id: true, name: true, role: true } },
      walker: { select: { id: true, name: true, role: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, senderId: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return conversations.map((conversation) => {
    const isOwner = conversation.ownerId === userId;
    const otherUser = isOwner ? conversation.walker : conversation.owner;
    const last = conversation.messages[0];

    return {
      id: conversation.id,
      otherUser: {
        id: otherUser.id,
        name: otherUser.name,
        role: otherUser.role as "OWNER" | "WALKER",
      },
      lastMessage: last
        ? {
            body: last.body,
            createdAt: last.createdAt.toISOString(),
            isFromMe: last.senderId === userId,
          }
        : null,
      contactRevealed: conversation.contactRevealed,
      updatedAt: conversation.updatedAt.toISOString(),
    };
  });
}

export async function getConversationDetail(
  conversationId: string,
  userId: string
): Promise<ConversationDetail | null> {
  const conversation = await db.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ ownerId: userId }, { walkerUserId: userId }],
    },
    include: {
      owner: { select: { id: true, name: true, role: true } },
      walker: {
        select: {
          id: true,
          name: true,
          role: true,
          email: true,
          walkerProfile: { select: { phone: true, email: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, body: true, senderId: true, createdAt: true },
      },
    },
  });

  if (!conversation) return null;

  const isOwner = conversation.ownerId === userId;
  const otherUser = isOwner ? conversation.walker : conversation.owner;

  return {
    id: conversation.id,
    otherUser: {
      id: otherUser.id,
      name: otherUser.name,
      role: otherUser.role as "OWNER" | "WALKER",
    },
    lastMessage: conversation.messages.length
      ? {
          body: conversation.messages[conversation.messages.length - 1].body,
          createdAt:
            conversation.messages[
              conversation.messages.length - 1
            ].createdAt.toISOString(),
          isFromMe:
            conversation.messages[conversation.messages.length - 1].senderId ===
            userId,
        }
      : null,
    contactRevealed: conversation.contactRevealed,
    updatedAt: conversation.updatedAt.toISOString(),
    messages: conversation.messages.map((message) => ({
      id: message.id,
      body: message.body,
      senderId: message.senderId,
      createdAt: message.createdAt.toISOString(),
      isFromMe: message.senderId === userId,
    })),
    walkerContact:
      conversation.contactRevealed && isOwner
        ? {
            phone: conversation.walker.walkerProfile?.phone ?? null,
            email:
              conversation.walker.walkerProfile?.email ??
              conversation.walker.email,
          }
        : null,
  };
}

export async function startConversationWithWalker(
  ownerId: string,
  walkerProfileId: string
) {
  const walkerProfile = await db.walkerProfile.findUnique({
    where: { id: walkerProfileId, isActive: true },
    select: { userId: true },
  });

  if (!walkerProfile) {
    throw new Error("Walker not found");
  }

  if (walkerProfile.userId === ownerId) {
    throw new Error("Cannot message yourself");
  }

  return db.conversation.upsert({
    where: {
      ownerId_walkerUserId: {
        ownerId,
        walkerUserId: walkerProfile.userId,
      },
    },
    update: {},
    create: {
      ownerId,
      walkerUserId: walkerProfile.userId,
    },
  });
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: string
) {
  const conversation = await db.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ ownerId: senderId }, { walkerUserId: senderId }],
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const isOwnerSender = conversation.ownerId === senderId;
  const contactRevealed = conversation.contactRevealed || isOwnerSender;

  const [message] = await db.$transaction([
    db.message.create({
      data: {
        conversationId,
        senderId,
        body,
      },
    }),
    db.conversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date(),
        contactRevealed,
      },
    }),
  ]);

  const participants = await db.conversation.findUnique({
    where: { id: conversationId },
    select: {
      ownerId: true,
      walkerUserId: true,
      owner: { select: { name: true } },
      walker: { select: { name: true } },
    },
  });

  if (participants) {
    const recipientId =
      participants.ownerId === senderId
        ? participants.walkerUserId
        : participants.ownerId;
    const senderName =
      participants.ownerId === senderId
        ? (participants.owner.name ?? "A dog owner")
        : (participants.walker.name ?? "A walker");
    const preview =
      body.length > 120 ? `${body.slice(0, 117).trimEnd()}...` : body;

    queueNotification({
      userId: recipientId,
      subject: `New PawPath message from ${senderName}`,
      emailBody: `${senderName} sent you a message on PawPath:\n\n"${preview}"\n\nReply: ${appUrl(`/messages/${conversationId}`)}`,
      smsBody: `PawPath: New message from ${senderName}. "${preview}" Reply: ${appUrl(`/messages/${conversationId}`)}`,
    });
  }

  return message;
}

export async function getConversationWithWalker(
  ownerId: string,
  walkerProfileId: string
) {
  const walkerProfile = await db.walkerProfile.findUnique({
    where: { id: walkerProfileId },
    select: { userId: true },
  });

  if (!walkerProfile) return null;

  return db.conversation.findUnique({
    where: {
      ownerId_walkerUserId: {
        ownerId,
        walkerUserId: walkerProfile.userId,
      },
    },
    select: { id: true, contactRevealed: true },
  });
}
