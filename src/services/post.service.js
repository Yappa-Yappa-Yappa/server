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
  WITH ranked_posts AS (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        ORDER BY "createdAt" DESC, "id" DESC
      ) AS newest_rank
    FROM "posts"
    ${userId ? Prisma.sql`WHERE "userId" = ${userId}` : Prisma.empty}
  )
  SELECT "id"
  FROM ranked_posts
  ORDER BY
    CASE
      WHEN newest_rank <= 5 THEN 0
      ELSE 1
    END,
    CASE
      WHEN newest_rank <= 5 THEN newest_rank
    END ASC,
    CASE
      WHEN newest_rank > 5 THEN md5("id" || ${seed})
    END ASC
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
      _count: { select: { likes: true, comments: true, reposts: true } },
    },
  });

  // Load the current viewer's saved post IDs so each feed item can show
  // whether its bookmark action should add or remove a favorite.
  const favoritePostIds = viewerId
    ? new Set(
        (
          await prisma.favorite.findMany({
            where: {
              userId: viewerId,
              postId: { in: postIds.map((post) => post.id) },
            },
            select: { postId: true },
          })
        ).map(({ postId }) => postId),
      )
    : new Set();

  const postsById = new Map(posts.map((post) => [post.id, post]));

  const orderedPosts = postIds
    .map(({ id }) => postsById.get(id))
    .filter(Boolean);

  const likedPostIds = viewerId
    ? new Set(
        (
          await prisma.like.findMany({
            where: {
              userId: viewerId,
              postId: { in: postIds.map((post) => post.id) },
            },
            select: { postId: true },
          })
        ).map(({ postId }) => postId),
      )
    : new Set();

  const repostedPostIds = viewerId
    ? new Set(
        (
          await prisma.repost.findMany({
            where: {
              userId: viewerId,
              postId: { in: postIds.map((post) => post.id) },
            },
            select: { postId: true },
          })
        ).map(({ postId }) => postId),
      )
    : new Set();

  // Expose per-viewer bookmark state to the client.
  const postsWithInteractionState = orderedPosts.map((post) => ({
    ...post,
    isLiked: likedPostIds.has(post.id),
    isFavorited: favoritePostIds.has(post.id),
    isReposted: repostedPostIds.has(post.id),
  }));

  return {
    posts: postsWithInteractionState,
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
      _count: { select: { likes: true, comments: true, reposts: true } },
    },
  });

  if (!post) {
    const error = new Error("Can't find the yap");
    error.statusCode = 404;
    throw error;
  }

  return post;
};

const incrementView = async ({ id }) => {
  // Increment viewCount atomically without changing updatedAt.
  // Raw SQL avoids Prisma's @updatedAt behavior for analytics-only updates.
  const rows = await prisma.$queryRaw`
    UPDATE "posts"
    SET "viewCount" = "viewCount" + 1
    WHERE "id" = ${id}
    RETURNING *
  `;

  const view = rows[0];

  if (!view) {
    const error = new Error("Can't view the yap");
    error.statusCode = 404;
    throw error;
  }

  return view;
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

const trendyPost = async ({ limit = 3 } = {}) => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const posts = await prisma.post.findMany({
    where: { createdAt: { gte: since } }, // gte = greater or eqaul >=
    include: {
      user: {
        select: { id: true, name: true, username: true, imageUrl: true },
      },
      images: true,
      _count: { select: { likes: true, comments: true, reposts: true } },
    },
    orderBy: [
      { likes: { _count: "desc" } },
      { createdAt: "desc" },
      { id: "desc" },
    ], // most-liked first, within the time window
    take: limit,
  });

  return posts;
};

const getFollowingPosts = async ({ page = 1, limit = 20, viewerId } = {}) => {
  const skip = (page - 1) * limit;

  const where = {
    user: {
      id: { not: viewerId },
      followings: {
        some: {
          followerId: viewerId, // select only the following user that has the current logged in account following
        },
      },
    },
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        images: true,
        user: {
          select: { id: true, name: true, username: true, imageUrl: true },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            reposts: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  const likedPostIds = new Set(
    (
      await prisma.like.findMany({
        where: {
          userId: viewerId,
          postId: { in: posts.map((post) => post.id) },
        },
        select: { postId: true },
      })
    ).map(({ postId }) => postId),
  );

  const favoritePostIds = new Set(
    (
      await prisma.favorite.findMany({
        where: {
          userId: viewerId,
          postId: { in: posts.map((post) => post.id) },
        },
        select: { postId: true },
      })
    ).map(({ postId }) => postId),
  );

  const repostedPostIds = new Set(
    (
      await prisma.repost.findMany({
        where: {
          userId: viewerId,
          postId: { in: posts.map((post) => post.id) },
        },
        select: { postId: true },
      })
    ).map(({ postId }) => postId),
  );

  const postsWithInteractionState = posts.map((post) => ({
    ...post,
    isLiked: likedPostIds.has(post.id),
    isFavorited: favoritePostIds.has(post.id),
    isReposted: repostedPostIds.has(post.id),
  }));

  return {
    posts: postsWithInteractionState,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  createPost,
  getPosts,
  getPostById,
  incrementView,
  updatePost,
  deletePost,
  trendyPost,
  getFollowingPosts,
};
