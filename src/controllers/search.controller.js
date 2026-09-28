const { searchUserOrPost } = require("../services/search.service");

const searchUserOrPostHandler = async (req, res, next) => {
  try {
    const { q } = req.query;

    const result = await searchUserOrPost({ query: q });

    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  searchUserOrPostHandler,
};
