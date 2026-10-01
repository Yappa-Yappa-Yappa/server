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

module.exports = { addFavorite, getFavorites, removeFavorite };
