// socket/socket.js
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { createMessage } = require("../services/message.service");
const { getConversationForUser } = require("../services/conversation.service");

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
