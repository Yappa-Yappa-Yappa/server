const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const {
  changeBioHandler,
  changeNameHandler,
  changeUsernameHandler,
  changeEmailHandler,
  changePasswordHandler,
  changeAvatarHandler,
  getProfileHandler,
  getRecentActivityHandler,
  getCommentsByUserHandler,
  changeBackgroundHandler,
} = require("../controllers/user.controller");
const uploadAvatar = require("../config/uploadAvatar");
const uploadBackground = require("../config/uploadBackground");
const { actionLimiter } = require("../middlewares/rateLimiter");

const router = express.Router();

// Update Info
router.patch("/update-bio", verifyToken, actionLimiter, changeBioHandler);
router.patch("/update-name", verifyToken, actionLimiter, changeNameHandler);
router.patch(
  "/update-username",
  verifyToken,
  actionLimiter,
  changeUsernameHandler,
);
router.patch("/update-email", verifyToken, actionLimiter, changeEmailHandler);
router.patch(
  "/update-password",
  verifyToken,
  actionLimiter,
  changePasswordHandler,
);
router.patch(
  "/update-avatar",
  verifyToken,
  actionLimiter,
  uploadAvatar.single("imageUrl"),
  changeAvatarHandler,
);
router.patch(
  "/update-background",
  verifyToken,
  actionLimiter,
  uploadBackground.single("bgUrl"),
  changeBackgroundHandler,
);
router.get("/me/activity", verifyToken, getRecentActivityHandler);
router.get("/:username/comments", verifyToken, getCommentsByUserHandler);

// Profile
router.get("/:username", verifyToken, getProfileHandler);

module.exports = router;
