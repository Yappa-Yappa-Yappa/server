const { Prisma } = require("@prisma/client");
const { prisma } = require("../config/prisma");

const createPost = async ({ userId, content, imageUrls }) => {
  if (!content && (!imageUrls || imageUrls.length === 0)) {
    const error = new Error("There must be something to yap about");
    error.statusCode = 400;
    throw error;
  }

  const post = await prisma.post.create({
    data: {
      userId,
      content,
      images: imageUrls?.length
        ? { create: imageUrls.map((url, index) => ({ url, position: index })) }
        : undefined,
    },
    include: { images: true },
  });

  return post;
};

// const getPosts = async ({ page = 1, limit = 20, userId } = {}) => {
//   const where = userId ? { userId } : {};
//   const skip = (page - 1) * limit;

//   const [posts, total] = await Promise.all([
//     prisma.post.findMany({
//       where,
//       include: {
//         images: true,
//         user: {
//           select: { id: true, name: true, username: true, imageUrl: true },
//         },
//         _count: { select: { likes: true, comments: true } },
//       },
//       orderBy: { createdAt: "desc" },
//       skip,
//       take: limit,
//     }),
//     prisma.post.count({ where }),
//   ]);

//   return {
//     posts,
//     pagination: {
//       page,
//       limit,
//       total,
//       totalPages: Math.ceil(total / limit), // total posts/limit posts = total pages
//     },
//   };
// };

const getPosts = async ({ page = 1, limit = 20, userId, viewerId } = {}) => {
  const where = userId ? { userId } : {};
  const skip = (page - 1) * limit;

  // Daily post shuffling
  const day = new Date().toISOString().slice(0, 10);
  const seed = `${viewerId}-${day}`;

  const [postIds, total] = await Promise.all([
    prisma.$queryRaw`
      SELECT "id"
      FROM "posts"
      ${userId ? Prisma.sql`WHERE "userId" = ${userId}` : Prisma.empty}
      ORDER BY md5("id" || ${seed})
      OFFSET ${skip}
      LIMIT ${limit}
    `,
    prisma.post.count({ where }),
  ]);

  const posts = await prisma.post.findMany({
    where: {
      id: { in: postIds.map((post) => post.id) },
    },
    include: {
      images: true,
      user: {
        select: { id: true, name: true, username: true, imageUrl: true },
      },
      _count: { select: { likes: true, comments: true } },
    },
  });

  const postsById = new Map(posts.map((post) => [post.id, post]));

  const orderedPosts = postIds
    .map(({ id }) => postsById.get(id))
    .filter(Boolean);

  return {
    posts: orderedPosts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit), // total posts/limit posts = total pages
    },
  };
};

const getPostById = async ({ id }) => {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      images: true,
      user: {
        select: { id: true, name: true, username: true, imageUrl: true },
      },
      _count: { select: { likes: true, comments: true } },
    },
  });

  if (!post) {
    const error = new Error("Can't find the yap");
    error.statusCode = 404;
    throw error;
  }

  return post;
};

const updatePost = async ({ id, userId, content, imageUrls }) => {
  const exist = await prisma.post.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!exist) {
    const error = new Error("Can't find the yap");
    error.statusCode = 404;
    throw error;
  }

  if (exist.userId !== userId) {
    const error = new Error("Hey don't spill the tea, gurl");
    error.statusCode = 403;
    throw error;
  }

  if (!content && (!imageUrls || imageUrls.length === 0)) {
    const error = new Error("There must be something to yap about");
    error.statusCode = 400;
    throw error;
  }

  if (imageUrls?.length) {
    await prisma.postImage.deleteMany({ where: { postId: id } });
  }

  const post = await prisma.post.update({
    where: { id },
    data: {
      content,
      images: imageUrls?.length
        ? { create: imageUrls.map((url, index) => ({ url, position: index })) }
        : undefined,
    },
    include: { images: true },
  });

  return post;
};

const deletePost = async ({ id, userId }) => {
  const post = await prisma.post.findUnique({
    where: { id },
  });

  if (!post) {
    const error = new Error("Can't find the yap");
    error.statusCode = 404;
    throw error;
  }

  if (post.userId !== userId) {
    const error = new Error("Hey don't spill the tea, gurl");
    error.statusCode = 403;
    throw error;
  }

  await prisma.post.delete({
    where: { id },
  });

  return { message: "No more yap" };
};

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
};
