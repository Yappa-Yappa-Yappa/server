const express = require("express");
const {
  createReportHandler,
  getReportsHandler,
  getReportByIdHandler,
  resolveReportHandler,
} = require("../controllers/report.controller");
const verifyToken = require("../middlewares/verifyToken");
const isAdmin = require("../middlewares/isAdmin");
const validateRequest = require("../middlewares/validateRequest");
const {
  createReportSchema,
  resolveReportSchema,
} = require("../validators/report.validator");

const router = express.Router();

router.post(
  "/",
  verifyToken,
  validateRequest(createReportSchema),
  createReportHandler,
);
router.get("/", verifyToken, isAdmin, getReportsHandler);
router.get("/:reportId", verifyToken, isAdmin, getReportByIdHandler);
router.patch(
  "/:reportId",
  verifyToken,
  isAdmin,
  validateRequest(resolveReportSchema),
  resolveReportHandler,
);

module.exports = router;
