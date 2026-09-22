const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const {
  followUserHandler,
  unfollowUserHandler,
  getFollowersHandler,
  getFollowingHandler,
} = require("../controllers/follow.controller");

const router = express.Router();

router.post("/:userId/follow", verifyToken, followUserHandler);
router.delete("/:userId/unfollow", verifyToken, unfollowUserHandler);

router.get("/:username/followers", getFollowersHandler); // check who follows the user
router.get("/:username/following", getFollowingHandler); // check who the user is following

module.exports = router;
