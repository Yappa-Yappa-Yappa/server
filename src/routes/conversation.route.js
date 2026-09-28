const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const {
  getConversationsHandler,
  getOrCreateDirectConversationHandler,
  getMessagesHandler,
  getUnreadConversationCountHandler,
  markConversationReadHandler,
} = require("../controllers/conversation.controller");

const router = express.Router();
router.use(verifyToken);
router.get("/", getConversationsHandler);
router.get("/unread-count", getUnreadConversationCountHandler);
router.post("/direct/:userId", getOrCreateDirectConversationHandler);
router.get("/:id/messages", getMessagesHandler);
router.post("/:id/read", markConversationReadHandler);

module.exports = router;
