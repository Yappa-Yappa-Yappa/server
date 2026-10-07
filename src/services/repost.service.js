const { NotificationType } = require("@prisma/client");
const { prisma } = require("../config/prisma");
const { createNotification } = require("./notification.service");

const repost = async ({ userId, postId }) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    const error = new Error("Yap doesn't exist");
    error.statusCode = 404;
    throw error;
  }

  const existingRepost = await prisma.repost.findUnique({
    where: { userId_postId: { userId, postId } }, // check if the current user has already reposted the post yet
  });

  if (existingRepost) {
    const error = new Error("Already reposted this yap");
    error.statusCode = 409;
    throw error;
  }

  const result = await prisma.repost.create({
    data: { userId, postId },
  });

  if (post.userId !== userId) {
    await createNotification({
      userId: post.userId,
      actorId: userId,
      type: NotificationType.REPOST,
      postId,
    });
  }

  return result;
};

const removeRepost = async ({ userId, postId }) => {
  const existingRepost = await prisma.repost.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (!existingRepost) {
    const error = new Error("You haven't reposted this yap");
    error.statusCode = 404;
    throw error;
  }

  await prisma.repost.delete({
    where: { id: existingRepost.id },
  });

  return { message: "Repost removed" };
};

const getRepostOfUser = async ({ username }) => {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const result = await prisma.repost.findMany({
    where: { userId: user.id },
    include: {
      post: {
        select: {
          id: true,
          content: true,
          viewCount: true,
          images: true,
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              imageUrl: true,
            },
          },
          _count: { select: { likes: true, comments: true, reposts: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return result;
};

const hasReposted = async ({ userId, postId }) => {
  const repost = await prisma.repost.findUnique({
    where: { userId_postId: { userId, postId } }, // for frontend to show the repost button's active/inactive state
  });
  return !!repost;
};

module.exports = {
  repost,
  removeRepost,
  getRepostOfUser,
  hasReposted,
};
