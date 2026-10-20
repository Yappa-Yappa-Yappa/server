const rateLimiter = require("express-rate-limit");

const otpLimiter = rateLimiter({
  windowMs: 5 * 60 * 1000,
  limit: 3,
  message: {
    success: false,
    message: "Too many otp requests, please try again later.",
  },
});

const authLimiter = rateLimiter({
  windowMs: 5 * 60 * 1000,
  limit: 5,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

const oauthLimiter = rateLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  message: {
    success: false,
    message: "Too many OAuth attempts, please try again later.",
  },
});

module.exports = { otpLimiter, authLimiter, oauthLimiter };
