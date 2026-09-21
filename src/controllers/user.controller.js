const {
  changeBio,
  changeName,
  changeUsername,
  changeEmail,
  changePassword,
  changeAvatar,
  getProfile,
  getRecentActivity,
  changeBackground,
} = require("../services/user.service");

const changeBioHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { bio } = req.body;

    const updatedBio = await changeBio({
      userId,
      bio,
    });

    res.status(200).json({ status: "success", data: updatedBio });
  } catch (err) {
    next(err);
  }
};

const changeNameHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    const updatedName = await changeName({
      userId,
      name,
    });

    res.status(200).json({ status: "success", data: updatedName });
  } catch (err) {
    next(err);
  }
};

const changeUsernameHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { username } = req.body;

    const updatedUsername = await changeUsername({
      userId,
      username,
    });

    res.status(200).json({ status: "success", data: updatedUsername });
  } catch (err) {
    next(err);
  }
};

const changeEmailHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { newEmail, password } = req.body;

    const updatedEmail = await changeEmail({
      userId,
      newEmail,
      password,
    });

    res.status(200).json({ status: "success", data: updatedEmail });
  } catch (err) {
    next(err);
  }
};

const changePasswordHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const updatedPassword = await changePassword({
      userId,
      currentPassword,
      newPassword,
    });

    res.status(200).json({ status: "success", data: updatedPassword });
  } catch (err) {
    next(err);
  }
};

const changeAvatarHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const imageUrl = req.file?.path;

    const updatedAvatar = await changeAvatar({
      userId,
      imageUrl,
    });

    res.status(200).json({ status: "success", data: updatedAvatar });
  } catch (err) {
    next(err);
  }
};

const changeBackgroundHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const bgUrl = req.file?.path;

    const updatedBackground = await changeBackground({
      userId,
      bgUrl,
    });

    res.status(200).json({ status: "success", data: updatedBackground });
  } catch (err) {
    next(err);
  }
};

const getProfileHandler = async (req, res, next) => {
  try {
    const { username } = req.params;

    const userProfile = await getProfile({
      username,
      viewerId: req.user.id,
    });

    res.status(200).json({ status: "success", data: userProfile });
  } catch (err) {
    next(err);
  }
};

const getRecentActivityHandler = async (req, res, next) => {
  try {
    const userId = req.user.id; // only your own activity, always from the token

    const activity = await getRecentActivity({
      userId,
    });

    res.status(200).json({ status: "success", data: activity });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  changeBioHandler,
  changeNameHandler,
  changeUsernameHandler,
  changeEmailHandler,
  changePasswordHandler,
  changeAvatarHandler,
  getProfileHandler,
  getRecentActivityHandler,
  changeBackgroundHandler,
};
