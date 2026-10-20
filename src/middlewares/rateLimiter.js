const rateLimiter = require("express-rate-limit");

// creating posts: 10 per 10 minutes, per logged-in user
const postLimiter = rateLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => req.user.id, // must run AFTER verifyToken
  message: {
    success: false,
    message: "You're posting too fast, try again later",
  },
});

// comments, likes, follows: more relaxed
const actionLimiter = rateLimiter({
  windowMs: 60 * 1000,
  limit: 30,
  keyGenerator: (req) => req.user.id,
  message: {
    success: false,
    message: "Too many actions, slow down",
  },
});

module.exports = { postLimiter, actionLimiter };
