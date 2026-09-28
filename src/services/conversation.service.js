const { prisma } = require("../config/prisma");

const userSelect = { id: true, name: true, username: true, imageUrl: true };

const getConversationForUser = async ({ id, userId }) => {
  return prisma.conversation.findFirst({
    where: { id, participants: { some: { userId } } },
    include: {
      participants: { include: { user: { select: userSelect } } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: { select: userSelect } },
      },
    },
  });
};

const formatConversation = (conversation, userId) => {
  const participant = conversation.participants.find((entry) => entry.userId !== userId);
  return {
    id: conversation.id,
    participant: participant?.user || null,
    lastMessage: conversation.messages[0] || null,
    unreadCount:
      conversation.participants.find((entry) => entry.userId === userId)
        ?.unreadCount || 0,
    createdAt: conversation.createdAt,
  };
};

const getConversations = async ({ userId }) => {
  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    include: {
      participants: { include: { user: { select: userSelect } } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: { select: userSelect } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return conversations.map((conversation) => formatConversation(conversation, userId));
};

const getOrCreateDirectConversation = async ({ userId, otherUserId }) => {
  if (userId === otherUserId) {
    const error = new Error("You cannot start a conversation with yourself");
    error.statusCode = 400;
    throw error;
  }

  const otherUser = await prisma.user.findUnique({ where: { id: otherUserId }, select: userSelect });
  if (!otherUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const existing = await prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    include: { participants: true, messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: { select: userSelect } } } },
  });
  const directConversation = existing.find((conversation) =>
    conversation.participants.length === 2 &&
    conversation.participants.some((participant) => participant.userId === otherUserId),
  );

  if (directConversation) {
    const conversation = await getConversationForUser({ id: directConversation.id, userId });
    return formatConversation(conversation, userId);
  }

  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId }, { userId: otherUserId }],
      },
    },
    include: {
      participants: { include: { user: { select: userSelect } } },
      messages: { include: { sender: { select: userSelect } } },
    },
  });

  return formatConversation(conversation, userId);
};

const getMessages = async ({ conversationId, userId, page = 1, limit = 30 }) => {
  const conversation = await getConversationForUser({ id: conversationId, userId });
  if (!conversation) {
    const error = new Error("Conversation not found");
    error.statusCode = 404;
    throw error;
  }

  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId },
    data: { unreadCount: 0 },
  });

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { sender: { select: userSelect } },
    }),
    prisma.message.count({ where: { conversationId } }),
  ]);

  return {
    messages: messages.reverse(),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const markConversationRead = async ({ conversationId, userId }) => {
  const result = await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId },
    data: { unreadCount: 0 },
  });

  if (result.count === 0) {
    const error = new Error("Conversation not found");
    error.statusCode = 404;
    throw error;
  }
};

const getUnreadConversationCount = async ({ userId }) => {
  const result = await prisma.conversationParticipant.aggregate({
    where: { userId },
    _sum: { unreadCount: true },
  });

  return result._sum.unreadCount || 0;
};

module.exports = {
  getConversationForUser,
  getConversations,
  getOrCreateDirectConversation,
  getMessages,
  markConversationRead,
  getUnreadConversationCount,
  formatConversation,
};
