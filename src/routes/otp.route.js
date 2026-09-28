const express = require("express");
const {
  requestOtpHandler,
  verifyOtpHandler,
} = require("../controllers/otp.controller");
const { otpLimiter } = require("../middlewares/rateLimiter");

const router = express.Router();

router.post("/request-otp", otpLimiter, requestOtpHandler);
router.post("/verify-otp", otpLimiter, verifyOtpHandler);

module.exports = router;
