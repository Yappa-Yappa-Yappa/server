const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const {
  createPostHandler,
  getPostsHandler,
  getPostByIdHandler,
  updatePostHandler,
  deletePostHandler,
} = require("../controllers/post.controller");
const upload = require("../config/upload");
const {
  getCommentsByPostHandler,
  createCommentHandler,
  deleteCommentHandler,
} = require("../controllers/comment.controller");
const {
  likePostHandler,
  getLikesByPostHandler,
  unlikePostHandler,
} = require("../controllers/like.controller");

const router = express.Router();

// Posts
router.post("/", verifyToken, upload.array("images", 5), createPostHandler);
router.get("/", verifyToken, getPostsHandler);
router.get("/:id", getPostByIdHandler);
router.put("/:id", verifyToken, upload.array("images", 5), updatePostHandler);
router.delete("/:id", verifyToken, deletePostHandler);

// Comments
router.post(
  "/:postId/comments",
  verifyToken,
  upload.array("images", 3),
  createCommentHandler,
);
router.get("/:postId/comments", getCommentsByPostHandler);
router.delete("/comments/:id", verifyToken, deleteCommentHandler);

// Likes
router.post("/:postId/like", verifyToken, likePostHandler);
router.get("/:postId/likes", getLikesByPostHandler);
router.delete("/:postId/like", verifyToken, unlikePostHandler);

module.exports = router;
