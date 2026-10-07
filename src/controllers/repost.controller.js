const {
  repost,
  removeRepost,
  getRepostOfUser,
  hasReposted,
} = require("../services/repost.service");

const repostHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;

    const result = await repost({ userId, postId });

    res.status(201).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
};

const removeRepostHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;

    await removeRepost({ userId, postId });

    res.status(200).json({ status: "success", message: "Repost removed" });
  } catch (err) {
    next(err);
  }
};

const getRepostOfUserHandler = async (req, res, next) => {
  try {
    const { username } = req.params;

    const result = await getRepostOfUser({ username });

    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
};

const hasRepostedHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;

    const repost = await hasReposted({ userId, postId });

    res.status(200).json({ status: "success", data: repost });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  repostHandler,
  removeRepostHandler,
  getRepostOfUserHandler,
  hasRepostedHandler,
};
