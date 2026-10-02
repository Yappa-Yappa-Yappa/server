const {
  refreshAccessToken,
  registerUser,
  loginUser,
  loginWithGoogle,
  forgotPassword,
  resetPassword,
} = require("../services/auth.service");

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    const { user, accessToken } = await refreshAccessToken(token);
    res.status(200).json({ status: "success", data: { accessToken, user } });
  } catch (err) {
    next(err);
  }
};

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const user = await registerUser({ name, email, password });

    res.status(201).json({
      status: "success",
      message:
        "Registered successful! Please verify your email before logging in...",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken } = await loginUser({ email, password }, res);

    res.status(200).json({ status: "success", data: { user, accessToken } });
  } catch (err) {
    next(err);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;
    const { user, accessToken } = await loginWithGoogle({ credential }, res);

    res.status(200).json({ status: "success", data: { user, accessToken } });
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" ? "none" : "lax",
    sameSite: "strict",
  });
  res.status(200).json({ status: "success", message: "Logged out" });
};

const forgotPasswordHandler = async (req, res, next) => {
  try {
    const { email } = req.body;

    const data = await forgotPassword({ email });

    res.status(200).json({
      status: "success",
      data,
    });
  } catch (err) {
    next(err);
  }
};

const resetPasswordHandler = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const data = await resetPassword({ token, newPassword });

    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  refresh,
  logout,
  forgotPasswordHandler,
  resetPasswordHandler,
};
