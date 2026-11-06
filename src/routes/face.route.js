const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const {
  getFaceStatusHandler,
  createFaceSetupLinkHandler,
} = require("../controllers/face.controller");
const { authLimiter } = require("../middlewares/authLimiter");
const validateRequest = require("../middlewares/validateRequest");
const { faceSetupSchema } = require("../validators/face.validator");

const router = express.Router();

router.get("/status", verifyToken, getFaceStatusHandler); // does this user have Face ID set up?
// Link to the scan page. Needs the password, so it gets the strict auth limiter (5 per 5 minutes).
router.post(
  "/setup",
  verifyToken,
  validateRequest(faceSetupSchema),
  authLimiter,
  createFaceSetupLinkHandler,
);

module.exports = router;
