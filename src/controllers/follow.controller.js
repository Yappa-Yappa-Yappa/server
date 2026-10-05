const {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getSuggestedUsers,
} = require("../services/follow.service");

const followUserHandler = async (req, res, next) => {
  try {
    const followerId = req.user.id;
    const { userId: followingId } = req.params;

    const follow = await followUser({ followerId, followingId });

    res.status(201).json({ status: "success", data: follow });
  } catch (err) {
    next(err);
  }
};

const unfollowUserHandler = async (req, res, next) => {
  try {
    const followerId = req.user.id;
    const { userId: followingId } = req.params;

    const unfollow = await unfollowUser({ followerId, followingId });

    res.status(200).json({ status: "success", data: unfollow });
  } catch (err) {
    next(err);
  }
};

const getFollowersHandler = async (req, res, next) => {
  try {
    const { username } = req.params; // whose followers are we viewing

    const result = await getFollowers({ username, viewerId: req.user.id });

    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
};

const getFollowingHandler = async (req, res, next) => {
  try {
    const { username } = req.params;

    const result = await getFollowing({ username, viewerId: req.user.id });

    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
};

const getSuggestedUsersHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit } = req.query;

    const suggest = await getSuggestedUsers({
      userId,
      limit: limit ? Number(limit) : undefined,
    });

    res.status(200).json({ status: "success", data: suggest });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  followUserHandler,
  unfollowUserHandler,
  getFollowersHandler,
  getFollowingHandler,
  getSuggestedUsersHandler,
};
