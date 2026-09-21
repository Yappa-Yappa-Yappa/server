const { prisma } = require("../config/prisma");
const bcrypt = require("bcrypt");

const changeBio = async ({ userId, bio }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const updatedBios = await prisma.user.update({
    where: { id: userId },
    data: { bio },
  });

  return { message: "Bio updated", updatedBios };
};

const changeName = async ({ userId, name }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const updatedName = await prisma.user.update({
    where: { id: userId },
    data: { name },
    select: { id: true, name: true, email: true },
  });

  return updatedName;
};

const changeUsername = async ({ userId, username }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const exist = await prisma.user.findUnique({
    where: { username },
  });

  if (exist) {
    const error = new Error("Username already existed");
    error.statusCode = 400;
    throw error;
  }

  const result = await prisma.user.update({
    where: { id: userId },
    data: { username },
    select: { id: true, name: true, username: true, email: true },
  });

  return result;
};

const changeEmail = async ({ userId, newEmail, password }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const isPassword = await bcrypt.compare(password, user.password);

  if (!isPassword) {
    const error = new Error("Incorrect password");
    error.statusCode = 401;
    throw error;
  }

  const exist = await prisma.user.findUnique({
    where: { email: newEmail },
  });

  if (exist) {
    const error = new Error("Email already existed");
    error.statusCode = 400;
    throw error;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { email: newEmail },
  });

  return { message: "Email updated" };
};

const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const isPassword = await bcrypt.compare(currentPassword, user.password);

  if (!isPassword) {
    const error = new Error("Incorrect password");
    error.statusCode = 401;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { message: "Password updated" };
};

const changeAvatar = async ({ userId, imageUrl }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const result = await prisma.user.update({
    where: { id: userId },
    data: { imageUrl },
    select: { id: true, imageUrl: true },
  });

  return { message: "Avatar updated", result };
};

const getProfile = async ({ username }) => {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      imageUrl: true,
      bio: true,
      role: true,
      isVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

const getRecentActivity = async ({ userId }) => {
  const [likedPosts, commentedPosts] = await Promise.all([
    prisma.like.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            user: { select: { id: true, name: true, username: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.comment.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            user: { select: { id: true, name: true, username: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return { likedPosts, commentedPosts };
};

module.exports = {
  changeBio,
  changeName,
  changeUsername,
  changeEmail,
  changePassword,
  changeAvatar,
  getProfile,
  getRecentActivity,
};
