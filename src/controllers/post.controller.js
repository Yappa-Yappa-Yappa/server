const {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  incrementView,
  trendyPost,
} = require("../services/post.service");

const createPostHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { content } = req.body;
    const imageUrls = req.files ? req.files.map((file) => file.path) : [];

    const post = await createPost({
      userId,
      content,
      imageUrls,
    });
    res.status(201).json({ status: "success", data: post });
  } catch (err) {
    next(err);
  }
};

const getPostsHandler = async (req, res, next) => {
  try {
    const { page, limit, userId } = req.query;
    const viewerId = req.user.id;

    const result = await getPosts({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      userId,
      viewerId,
    });

    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
};

const getPostByIdHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await getPostById({ id });

    res.status(200).json({ status: "success", data: post });
  } catch (err) {
    next(err);
  }
};

const incrementViewHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const view = await incrementView({ id });

    res.status(200).json({ status: "success", data: view });
  } catch (err) {
    next(err);
  }
};

const updatePostHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { content } = req.body;
    const imageUrls = req.files ? req.files.map((file) => file.path) : [];

    const post = await updatePost({
      id,
      userId,
      content,
      imageUrls,
    });

    res.status(200).json({ status: "success", data: post });
  } catch (err) {
    next(err);
  }
};

const deletePostHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await deletePost({ id, userId });

    res.status(200).json({ status: "success" });
  } catch (err) {
    next(err);
  }
};

const trendyPostHandler = async (req, res, next) => {
  try {
    const { limit } = req.query;

    const posts = await trendyPost({
      limit: limit ? Number(limit) : undefined, // convert string to number, or let the service's default (3) apply
    });

    res.status(200).json({ status: "success", data: posts });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPostHandler,
  getPostByIdHandler,
  incrementViewHandler,
  getPostsHandler,
  updatePostHandler,
  deletePostHandler,
  trendyPostHandler,
};
