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
  changeBackgroundHandler,
} = require("../controllers/user.controller");
const uploadAvatar = require("../config/uploadAvatar");
const uploadBackground = require("../config/uploadBackground");

const router = express.Router();

// Update Info
router.patch("/update-bio", verifyToken, changeBioHandler);
router.patch("/update-name", verifyToken, changeNameHandler);
router.patch("/update-username", verifyToken, changeUsernameHandler);
router.patch("/update-email", verifyToken, changeEmailHandler);
router.patch("/update-password", verifyToken, changePasswordHandler);
router.patch(
  "/update-avatar",
  verifyToken,
  uploadAvatar.single("imageUrl"),
  changeAvatarHandler,
);
router.patch(
  "/update-background",
  verifyToken,
  uploadBackground.single("bgUrl"),
  changeBackgroundHandler,
);
router.get("/me/activity", verifyToken, getRecentActivityHandler);

// Profile
router.get("/:username", verifyToken, getProfileHandler);

module.exports = router;
