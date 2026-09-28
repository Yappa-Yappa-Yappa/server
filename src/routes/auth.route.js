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

const router = express.Router();

router.post("/refresh", refresh);
router.post("/register", validateRequest(registerSchema), register);
router.post("/login", validateRequest(loginSchema), login);
router.post("/google", validateRequest(googleLoginSchema), googleLogin);
router.post("/logout", logout);

module.exports = router;
