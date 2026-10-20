const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const {
  getCommentByIdHandler,
  getCommentThreadHandler,
  updateCommentHandler,
  deleteCommentHandler,
} = require("../controllers/comment.controller");
const {
  addCommentFavoriteHandler,
  removeCommentFavoriteHandler,
} = require("../controllers/favorite.controller");
const upload = require("../config/upload");
const {
  likeCommentHandler,
  getLikesByCommentHandler,
  unlikeCommentHandler,
} = require("../controllers/like.controller");
const { actionLimiter } = require("../middlewares/rateLimiter");

const router = express.Router();

// Comments
router.get("/:id/thread", verifyToken, getCommentThreadHandler);
router.post(
  "/:commentId/favorite",
  verifyToken,
  actionLimiter,
  addCommentFavoriteHandler,
);
router.delete(
  "/:commentId/favorite",
  verifyToken,
  removeCommentFavoriteHandler,
);
router.get("/:id", getCommentByIdHandler);
router.patch(
  "/:id",
  verifyToken,
  upload.array("images", 3),
  updateCommentHandler,
);
router.delete("/:id", verifyToken, deleteCommentHandler);

// Likes
router.post("/:commentId/like", verifyToken, actionLimiter, likeCommentHandler);
router.get("/:commentId/likes", getLikesByCommentHandler);
router.delete("/:commentId/like", verifyToken, unlikeCommentHandler);

module.exports = router;
