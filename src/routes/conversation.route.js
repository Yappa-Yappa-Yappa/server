const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const {
  getConversationsHandler,
  getOrCreateDirectConversationHandler,
  getMessagesHandler,
} = require("../controllers/conversation.controller");

const router = express.Router();
router.use(verifyToken);
router.get("/", getConversationsHandler);
router.post("/direct/:userId", getOrCreateDirectConversationHandler);
router.get("/:id/messages", getMessagesHandler);

module.exports = router;
