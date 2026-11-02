const { getFaceStatus, createFaceSetupLink } = require("../services/face.service");

const getFaceStatusHandler = async (req, res, next) => {
  try {
    const status = await getFaceStatus({ email: req.user.email });

    res.status(200).json({ status: "success", data: status });
  } catch (err) {
    next(err);
  }
};

const createFaceSetupLinkHandler = async (req, res, next) => {
  try {
    const link = await createFaceSetupLink({
      email: req.user.email,
      name: req.user.name,
    });

    res.status(200).json({ status: "success", data: link });
  } catch (err) {
    next(err);
  }
};

module.exports = { getFaceStatusHandler, createFaceSetupLinkHandler };
