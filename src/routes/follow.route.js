const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const {
  followUserHandler,
  unfollowUserHandler,
  getFollowersHandler,
  getFollowingHandler,
  getSuggestedUsersHandler,
} = require("../controllers/follow.controller");

const router = express.Router();

router.post("/:userId/follow", verifyToken, followUserHandler);
router.delete("/:userId/unfollow", verifyToken, unfollowUserHandler);

router.get("/suggestions", verifyToken, getSuggestedUsersHandler);
router.get("/:username/followers", verifyToken, getFollowersHandler); // check who follows the user
router.get("/:username/following", verifyToken, getFollowingHandler); // check who the user is following

module.exports = router;
