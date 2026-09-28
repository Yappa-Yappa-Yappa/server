const express = require("express");
const { searchUserOrPostHandler } = require("../controllers/search.controller");

const router = express.Router();

router.get("/", searchUserOrPostHandler);

module.exports = router;
