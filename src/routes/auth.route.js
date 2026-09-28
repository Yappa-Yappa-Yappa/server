const express = require("express");
const {
  register,
  login,
  googleLogin,
  refresh,
  logout,
} = require("../controllers/auth.controller");
const validateRequest = require("../middlewares/validateRequest");
const {
  registerSchema,
  loginSchema,
  googleLoginSchema,
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

module.exports = router;
