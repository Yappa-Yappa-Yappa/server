const {
  getConversations,
  getOrCreateDirectConversation,
  getMessages,
  markConversationRead,
  getUnreadConversationCount,
} = require("../services/conversation.service");

const getConversationsHandler = async (req, res, next) => {
  try {
    const conversations = await getConversations({ userId: req.user.id });
    res.status(200).json({ status: "success", data: conversations });
  } catch (err) { next(err); }
};

const getOrCreateDirectConversationHandler = async (req, res, next) => {
  try {
    const conversation = await getOrCreateDirectConversation({ userId: req.user.id, otherUserId: req.params.userId });
    res.status(200).json({ status: "success", data: conversation });
  } catch (err) { next(err); }
};

const getUnreadConversationCountHandler = async (req, res, next) => {
  try {
    const count = await getUnreadConversationCount({ userId: req.user.id });
    res.status(200).json({ status: "success", data: { count } });
  } catch (err) { next(err); }
};

const markConversationReadHandler = async (req, res, next) => {
  try {
    await markConversationRead({
      conversationId: req.params.id,
      userId: req.user.id,
    });
    res.status(200).json({ status: "success" });
  } catch (err) { next(err); }
};

const getMessagesHandler = async (req, res, next) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 30, 100);
    const result = await getMessages({ conversationId: req.params.id, userId: req.user.id, page, limit });
    res.status(200).json({ status: "success", data: result });
  } catch (err) { next(err); }
};

module.exports = {
  getConversationsHandler,
  getOrCreateDirectConversationHandler,
  getMessagesHandler,
  getUnreadConversationCountHandler,
  markConversationReadHandler,
};
