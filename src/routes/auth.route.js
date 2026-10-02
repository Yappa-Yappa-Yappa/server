const express = require("express");
const {
  register,
  login,
  googleLogin,
  refresh,
  logout,
  forgotPasswordHandler,
  resetPasswordHandler,
} = require("../controllers/auth.controller");
const validateRequest = require("../middlewares/validateRequest");
const {
  registerSchema,
  loginSchema,
  googleLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../validators/auth.validator");
const { authLimiter, oauthLimiter } = require("../middlewares/rateLimiter");

const router = express.Router();

router.post("/refresh", refresh);
router.post(
  "/register",
  validateRequest(registerSchema),
  authLimiter,
  register,
);
router.post("/login", validateRequest(loginSchema), authLimiter, login);
router.post(
  "/google",
  validateRequest(googleLoginSchema),
  oauthLimiter,
  googleLogin,
);
router.post("/logout", logout);
router.post(
  "/forgot-password",
  validateRequest(forgotPasswordSchema),
  authLimiter,
  forgotPasswordHandler,
);
router.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  authLimiter,
  resetPasswordHandler,
);

module.exports = router;
