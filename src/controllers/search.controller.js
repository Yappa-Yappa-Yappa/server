const { searchUserOrPost } = require("../services/search.service");

const searchUserOrPostHandler = async (req, res, next) => {
  try {
    const { q, type } = req.query;
    const skip = Math.max(0, parseInt(req.query.skip, 10) || 0);

    const result = await searchUserOrPost({
      query: q,
      type: type === "users" || type === "posts" ? type : undefined,
      skip,
    });

    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  searchUserOrPostHandler,
};
