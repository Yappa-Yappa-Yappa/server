const { prisma } = require("../config/prisma");

const createMessage = async ({ conversationId, senderId, content }) => {
  const trimmedContent = content?.trim();
  if (!trimmedContent || trimmedContent.length > 2000) {
    const error = new Error("Message must be between 1 and 2000 characters");
    error.statusCode = 400;
    throw error;
  }
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: senderId } },
  });

  if (!participant) {
    const error = new Error("You're not part of this conversation");
    error.statusCode = 403;
    throw error;
  }

  const message = await prisma.message.create({
    data: { conversationId, senderId, content: trimmedContent },
    include: {
      sender: {
        select: { id: true, name: true, username: true, imageUrl: true },
      },
    },
  });

  return message;
};

module.exports = { createMessage };
