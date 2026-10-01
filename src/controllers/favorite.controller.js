const {
  addFavorite,
  removeFavorite,
  getFavorites,
} = require("../services/favorite.service");

const addFavoriteHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;

    const favorite = await addFavorite({ userId, postId });

    res.status(201).json({ status: "success", data: favorite });
  } catch (err) {
    next(err);
  }
};

const getFavoritesHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const favorites = await getFavorites({ userId });

    res.status(200).json({ status: "success", data: favorites });
  } catch (err) {
    next(err);
  }
};

const removeFavoriteHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;

    await removeFavorite({ userId, postId });

    res
      .status(200)
      .json({ status: "success", message: "Removed from favorite" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addFavoriteHandler,
  getFavoritesHandler,
  removeFavoriteHandler,
};
