// socket/socket.js
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const {
  createMessage,
  markMessageDelivered,
} = require("../services/message.service");
const {
  getConversationForUser,
  markConversationRead,
  getUnreadConversationCount,
} = require("../services/conversation.service");

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL, credentials: true },
  });

  // Authenticate socket connections using your existing JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(socket.userId); // personal room, for direct targeting

    socket.on(
      "conversation:join",
      async ({ conversationId } = {}, acknowledge) => {
        const conversation = await getConversationForUser({
          id: conversationId,
          userId: socket.userId,
        });
        if (!conversation)
          return acknowledge?.({ ok: false, error: "Conversation not found" });
        socket.join(`conversation:${conversationId}`);
        acknowledge?.({ ok: true });
      },
    );

    socket.on("conversation:leave", ({ conversationId } = {}) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on(
      "conversation:read",
      async ({ conversationId } = {}, acknowledge) => {
        try {
          const seenMessages = await markConversationRead({
            conversationId,
            userId: socket.userId,
          });
          const count = await getUnreadConversationCount({
            userId: socket.userId,
          });
          io.to(socket.userId).emit("conversation:unread-count", { count });
          seenMessages.forEach(({ id, senderId, seenAt }) => {
            io.to(senderId).emit("message:status", {
              messageId: id,
              status: "seen",
              seenAt,
            });
          });
          acknowledge?.({ ok: true, count });
        } catch (error) {
          acknowledge?.({
            ok: false,
            error: error.message || "Could not mark conversation as read",
          });
        }
      },
    );

    socket.on(
      "message:delivered",
      async ({ messageId } = {}, acknowledge) => {
        try {
          const deliveredMessage = await markMessageDelivered({
            messageId,
            userId: socket.userId,
          });

          if (deliveredMessage) {
            io.to(deliveredMessage.senderId).emit("message:status", {
              messageId: deliveredMessage.id,
              status: "delivered",
              deliveredAt: deliveredMessage.deliveredAt,
            });
          }

          acknowledge?.({ ok: Boolean(deliveredMessage) });
        } catch (error) {
          acknowledge?.({
            ok: false,
            error: error.message || "Could not mark message as delivered",
          });
        }
      },
    );

    socket.on(
      "message:send",
      async ({ conversationId, content, clientMessageId } = {}, acknowledge) => {
        try {
          const { message, recipientIds } = await createMessage({
            senderId: socket.userId,
            conversationId,
            content,
          });
          const eventMessage = clientMessageId
            ? { ...message, clientMessageId }
            : message;
          recipientIds.forEach((userId) =>
            io.to(userId).emit("message:new", eventMessage),
          );
          acknowledge?.({ ok: true, message: eventMessage });
        } catch (error) {
          acknowledge?.({
            ok: false,
            error: error.message || "Could not send message",
          });
        }
      },
    );

    socket.on("disconnect", () => {
      // cleanup if needed
    });
  });

  return io;
};

module.exports = initSocket;
