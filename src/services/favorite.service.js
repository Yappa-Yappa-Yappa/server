const { prisma } = require("../config/prisma");

const addFavorite = async ({ userId, postId }) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    const error = new Error("Can't find the yap");
    error.statusCode = 404;
    throw error;
  }

  const existingFavorite = await prisma.favorite.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existingFavorite) {
    return existingFavorite;
  }

  const favorite = await prisma.favorite.create({
    data: { userId, postId },
  });

  return favorite;
};

const getFavorites = async ({ userId }) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId }, // for only viewing their own favorite
    include: {
      post: {
        include: {
          user: true,
          images: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return favorites;
};

const removeFavorite = async ({ userId, postId }) => {
  const existingFavorite = await prisma.favorite.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (!existingFavorite) {
    const error = new Error("You haven't favorited this yap");
    error.statusCode = 404;
    throw error;
  }

  await prisma.favorite.delete({
    where: { id: existingFavorite.id },
  });

  return { message: "Removed from favorite" };
};

const addCommentFavorite = async ({ userId, commentId }) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });

  if (!comment) {
    const error = new Error("Can't find the comment");
    error.statusCode = 404;
    throw error;
  }

  const existingFavorite = await prisma.favorite.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });

  if (existingFavorite) return existingFavorite;

  return prisma.favorite.create({ data: { userId, commentId } });
};

const removeCommentFavorite = async ({ userId, commentId }) => {
  const existingFavorite = await prisma.favorite.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });

  if (!existingFavorite) {
    const error = new Error("You haven't favorited this comment");
    error.statusCode = 404;
    throw error;
  }

  await prisma.favorite.delete({ where: { id: existingFavorite.id } });
  return { message: "Removed from favorite" };
};

module.exports = {
  addFavorite,
  getFavorites,
  removeFavorite,
  addCommentFavorite,
  removeCommentFavorite,
};
