const { prisma } = require("../config/prisma");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateToken");
const { sendOtp, sendResetLink } = require("../utils/sendMail");

const googleClient = new OAuth2Client();

const getPublicUser = (user) => {
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const createUsername = async (transaction, name) => {
  const base =
    (name || "yapper")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 44) || "yapper";

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    const existingUsername = await transaction.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!existingUsername) return username;
  }

  const error = new Error("Could not create a unique username");
  error.statusCode = 503;
  throw error;
};

const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    const error = new Error("No refresh token provided");
    error.statusCode = 401;
    throw error;
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
  } catch {
    const error = new Error("Invalid or expired refresh token");
    error.statusCode = 401;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      name: true,
      username: true,
      imageUrl: true,
      email: true,
      isVerified: true,
    },
  });

  if (!user) {
    const error = new Error("User no logner exists");
    error.statusCode = 401;
    throw error;
  }

  const newAccessToken = generateAccessToken(user.id);

  return { user, accessToken: newAccessToken };
};

const registerUser = async ({ name, email, password }) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    const error = new Error("Email already in use");
    error.statusCode = 409; // 409 = conflict
    throw error;
  }

  const userCount = await prisma.user.count();

  const hashedPassword = await bcrypt.hash(password, 10);

  const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const username = `${name.toLowerCase().replace(/\s+/g, "")}${randomSuffix}`;

  const user = await prisma.$transaction(async (transaction) => {
    const createdUser = await transaction.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        username,
        role: userCount === 0 ? "ADMIN" : "USER",
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    await transaction.otp.create({
      data: { userId: createdUser.id, otp: otpCode, expiresAt },
    });

    return createdUser;
  });

  try {
    await sendOtp(user.email, otpCode);
  } catch (err) {
    console.error("OTP email delivery failed:", {
      statusCode: err.statusCode,
      message: err.message,
      body: err.body,
    });

    try {
      await prisma.user.delete({ where: { id: user.id } });
    } catch (cleanupError) {
      console.error(
        `Failed to clean up registration for ${user.email}:`,
        cleanupError,
      );
    }

    const emailError = new Error(
      "Could not send verification email. Please try again.",
    );
    emailError.statusCode = 503;
    throw emailError;
  }

  return user;
};

const loginUser = async ({ email, password }, res) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.password) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  if (!user.isVerified) {
    const error = new Error("Please verify your account before logging in...");
    error.statusCode = 400;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id, res);

  return { user: getPublicUser(user), accessToken, refreshToken };
};

const loginWithGoogle = async ({ credential }, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    const error = new Error("Google login is not configured");
    error.statusCode = 503;
    throw error;
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    const error = new Error("Invalid Google credential");
    error.statusCode = 401;
    throw error;
  }

  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    const error = new Error("Google account email is not verified");
    error.statusCode = 401;
    throw error;
  }

  const email = payload.email.trim().toLowerCase();
  const provider = "google";

  const user = await prisma.$transaction(async (transaction) => {
    const existingAccount = await transaction.account.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId: payload.sub,
        },
      },
      include: { user: true },
    });

    if (existingAccount) return existingAccount.user;

    const existingUser = await transaction.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      await transaction.account.create({
        data: {
          provider,
          providerId: payload.sub,
          userId: existingUser.id,
        },
      });

      return existingUser;
    }

    const userCount = await transaction.user.count();
    const username = await createUsername(
      transaction,
      payload.name || email.split("@")[0],
    );

    const newUser = await transaction.user.create({
      data: {
        name: payload.name || email.split("@")[0],
        username,
        email,
        imageUrl: payload.picture || null,
        isVerified: true,
        role: userCount === 0 ? "ADMIN" : "USER",
        accounts: {
          create: {
            provider,
            providerId: payload.sub,
          },
        },
      },
    });

    return newUser;
  });

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id, res);

  return { user: getPublicUser(user), accessToken, refreshToken };
};

const forgotPassword = async ({ email }) => {
  // Look up the user by their email (they don't know their own id)
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { message: "A reset link has been sent, please check your email" };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

  await prisma.resetToken.deleteMany({ where: { userId: user.id } }); //Clear old ones
  await prisma.resetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  await sendResetLink(user.email, resetLink);

  return { message: "A reset link has been sent, please check your email" };
};

const resetPassword = async ({ token, newPassword }) => {
  const record = await prisma.resetToken.findUnique({
    where: { token },
  });

  if (!record) {
    const error = new Error("Invalid or expired token");
    error.statusCode = 400;
    throw error;
  }

  if (record.expiresAt < new Date()) {
    const error = new Error("Token has expired");
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: record.userId },
    data: { password: hashedPassword },
  });

  await prisma.resetToken.delete({ where: { token } });

  return { message: "Password reset successful" };
};

module.exports = {
  refreshAccessToken,
  registerUser,
  loginUser,
  loginWithGoogle,
  forgotPassword,
  resetPassword,
};
