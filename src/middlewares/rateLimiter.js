const rateLimiter = require("express-rate-limit");

const otpLimiter = rateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: { error: "Too many otp requests, please try again later." },
});

const authLimiter = rateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { error: "Too many requests, please try again later." },
});

const oauthLimiter = rateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { error: "Too many OAuth attempts, please try again later." },
});

module.exports = { otpLimiter, authLimiter, oauthLimiter };
