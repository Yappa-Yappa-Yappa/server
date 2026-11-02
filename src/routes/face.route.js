const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const {
  getFaceStatusHandler,
  createFaceSetupLinkHandler,
} = require("../controllers/face.controller");
const { actionLimiter } = require("../middlewares/rateLimiter");

const router = express.Router();

router.get("/status", verifyToken, getFaceStatusHandler); // does this user have Face ID set up?
router.post("/setup", verifyToken, actionLimiter, createFaceSetupLinkHandler); // link to the scan page

module.exports = router;
