const { prisma } = require("../config/prisma");

const createMessage = async ({ conversationId, senderId, content }) => {
  const trimmedContent = content?.trim();
  if (!trimmedContent || trimmedContent.length > 2000) {
    const error = new Error("Message must be between 1 and 2000 characters");
    error.statusCode = 400;
    throw error;
  }

  // Combine authorization and participant lookup for fast query
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      participants: { some: { userId: senderId } },
    },
    select: {
      participants: { select: { userId: true } },
    },
  });

  if (!conversation) {
    const error = new Error("You're not part of this conversation");
    error.statusCode = 403;
    throw error;
  }

  const message = await prisma.$transaction(async (transaction) => {
    const createdMessage = await transaction.message.create({
      data: { conversationId, senderId, content: trimmedContent },
      include: {
        sender: {
          select: { id: true, name: true, username: true, imageUrl: true },
        },
      },
    });

    await transaction.conversationParticipant.updateMany({
      where: { conversationId, userId: { not: senderId } },
      data: { unreadCount: { increment: 1 } },
    });

    return createdMessage;
  });

  return {
    message,
    recipientIds: conversation.participants.map(({ userId }) => userId),
  };
};

module.exports = { createMessage };
