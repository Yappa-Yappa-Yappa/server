const { NotificationType } = require("@prisma/client");
const { prisma } = require("../config/prisma");
const { createNotification } = require("./notification.service");

const commentInclude = {
  images: true,
  user: {
    select: { id: true, name: true, username: true, imageUrl: true },
  },
  parent: {
    select: {
      id: true,
      user: { select: { username: true } },
    },
  },
};

const addInteractionState = async (comments, viewerId) => {
  if (!comments.length || !viewerId) return comments;

  const commentIds = comments.map((comment) => comment.id);
  const [likeState, favoriteState] = await Promise.all([
    Promise.all(
      comments.map(async (comment) => [
        comment.id,
        await prisma.like.count({ where: { commentId: comment.id } }),
      ]),
    ),
    prisma.favorite.findMany({
      where: { userId: viewerId, commentId: { in: commentIds } },
      select: { commentId: true },
    }),
  ]);
  const likedByViewer = new Set(
    (
      await prisma.like.findMany({
        where: { userId: viewerId, commentId: { in: commentIds } },
        select: { commentId: true },
      })
    ).map((like) => like.commentId),
  );
  const likeCounts = new Map(likeState);
  const favoritedByViewer = new Set(
    favoriteState.map((favorite) => favorite.commentId),
  );

  return comments.map((comment) => ({
    ...comment,
    isLiked: likedByViewer.has(comment.id),
    isFavorited: favoritedByViewer.has(comment.id),
    _count: {
      ...(comment._count || {}),
      likes: likeCounts.get(comment.id) || 0,
    },
  }));
};

const createComment = async ({
  userId,
  parentId,
  postId,
  content,
  imageUrls,
}) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });

  if (!post) {
    const error = new Error("Not post is found to comment");
    error.statusCode = 404;
    throw error;
  }

  if (!content && (!imageUrls || imageUrls.length === 0)) {
    const error = new Error("There must be something to yap");
    error.statusCode = 400;
    throw error;
  }

  const parent = parentId
    ? await prisma.comment.findUnique({ where: { id: parentId } })
    : null;

  if (parentId && !parent) {
    const error = new Error("Parent comment not found");
    error.statusCode = 404;
    throw error;
  }

  if (parentId && parent.postId !== postId) {
    const error = new Error("Parent comment belongs to another post");
    error.statusCode = 400;
    throw error;
  }

  const comment = await prisma.comment.create({
    data: {
      postId,
      userId,
      parentId: parentId || null,
      content,
      images: imageUrls?.length
        ? { create: imageUrls.map((url, index) => ({ url, position: index })) }
        : undefined,
    },
    include: {
      images: true,
      user: {
        select: { id: true, name: true, username: true, imageUrl: true },
      },
    },
  });

  await createNotification({
    userId: parent ? parent.userId : post.userId,
    actorId: userId,
    type: NotificationType.COMMENT,
    postId,
  });

  return comment;
};

const getCommentsByPost = async ({ postId, viewerId }) => {
  const comments = await prisma.comment.findMany({
    where: { postId, parentId: null },
    include: commentInclude,
    orderBy: { createdAt: "asc" },
  });

  const replyCounts = await Promise.all(
    comments.map(async (comment) => [
      comment.id,
      await prisma.comment.count({ where: { parentId: comment.id } }),
    ]),
  );
  const countsByCommentId = new Map(replyCounts);

  const commentsWithReplyCounts = comments.map((comment) => ({
    ...comment,
    _count: { replies: countsByCommentId.get(comment.id) || 0 },
  }));

  return addInteractionState(commentsWithReplyCounts, viewerId);
};

const getCommentThread = async ({ id, viewerId }) => {
  const comment = await prisma.comment.findUnique({
    where: { id },
    include: commentInclude,
  });

  if (!comment) {
    const error = new Error("Can't find the comment");
    error.statusCode = 404;
    throw error;
  }

  const replies = await prisma.comment.findMany({
    where: { postId: comment.postId, parentId: id, id: { not: id } },
    include: commentInclude,
    orderBy: { createdAt: "asc" },
  });
  const commentsWithCounts = [comment, ...replies];
  const replyCounts = await Promise.all(
    commentsWithCounts.map(async (item) => [
      item.id,
      await prisma.comment.count({ where: { parentId: item.id } }),
    ]),
  );
  const countsByCommentId = new Map(replyCounts);
  const addReplyCount = (item) => ({
    ...item,
    _count: { replies: countsByCommentId.get(item.id) || 0 },
  });

  const [commentWithState, ...repliesWithState] = await addInteractionState(
    [addReplyCount(comment), ...replies.map(addReplyCount)],
    viewerId,
  );

  return { comment: commentWithState, replies: repliesWithState };
};

const getCommentById = async ({ id }) => {
  const comment = await prisma.comment.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!comment) {
    const error = new Error("Can't find the comment");
    error.statusCode = 404;
    throw error;
  }

  return comment;
};

const updateComment = async ({ id, userId, content, imageUrls }) => {
  const exist = await prisma.comment.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!exist) {
    const error = new Error("Can't find the comment");
    error.statusCode = 404;
    throw error;
  }

  if (exist.userId !== userId) {
    const error = new Error("Not your comment to edit");
    error.statusCode = 403;
    throw error;
  }

  if (!content && (!imageUrls || imageUrls.length === 0)) {
    const error = new Error("There must be something to say");
    error.statusCode = 400;
    throw error;
  }

  if (imageUrls?.length) {
    await prisma.commentImage.deleteMany({ where: { commentId: id } });
  }

  const comment = await prisma.comment.update({
    where: { id },
    data: {
      content,
      images: imageUrls?.length
        ? { create: imageUrls.map((url, index) => ({ url, position: index })) }
        : undefined,
    },
    include: { images: true },
  });

  return comment;
};

const deleteComment = async ({ id, userId }) => {
  const exist = await prisma.comment.findUnique({
    where: { id },
  });

  if (!exist) {
    const error = new Error("Can't find the comment");
    error.statusCode = 404;
    throw error;
  }

  if (exist.userId !== userId) {
    const error = new Error("Not your comment to delete");
    error.statusCode = 403;
    throw error;
  }

  await prisma.comment.delete({
    where: { id },
  });

  return { message: "Comment deleted" };
};

module.exports = {
  createComment,
  getCommentsByPost,
  getCommentThread,
  getCommentById,
  updateComment,
  deleteComment,
};
