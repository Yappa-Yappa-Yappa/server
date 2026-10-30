const { prisma } = require("../config/prisma");

const PAGE_SIZE = 5;

const searchUserOrPost = async ({ query, type, skip = 0 }) => {
  if (!query || !query.trim()) {
    return { users: [], posts: [], hasMoreUsers: false, hasMorePosts: false };
  }

  const trimmedQuery = query.trim();

  // type limits the lookup to one list when loading more ("users" | "posts").
  // PAGE_SIZE + 1 rows are fetched so we know if another page exists.
  const [users, posts] = await Promise.all([
    type === "posts"
      ? []
      : prisma.user.findMany({
          where: {
            OR: [
              // OR: u can just put name/username and it'll come as one

              // contain: word contain in it. e.g: "miz" matches "Mizu", "mizugod"

              // mode: "insensitive" : case-insensitive, any case is acceptable
              { name: { contains: trimmedQuery, mode: "insensitive" } },
              { username: { contains: trimmedQuery, mode: "insensitive" } },
            ],
          },
          select: { id: true, name: true, username: true, imageUrl: true },
          // stable order, otherwise skip-based paging can repeat or miss rows
          orderBy: [{ username: "asc" }, { id: "asc" }],
          skip,
          take: PAGE_SIZE + 1,
        }),
    type === "users"
      ? []
      : prisma.post.findMany({
          where: { content: { contains: trimmedQuery, mode: "insensitive" } },
          select: {
            id: true,
            content: true,
            images: { select: { url: true } },
            user: { select: { id: true, name: true, username: true, imageUrl: true } },
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip,
          take: PAGE_SIZE + 1,
        }),
  ]);

  return {
    users: users.slice(0, PAGE_SIZE),
    posts: posts.slice(0, PAGE_SIZE),
    hasMoreUsers: users.length > PAGE_SIZE,
    hasMorePosts: posts.length > PAGE_SIZE,
  };
};

module.exports = { searchUserOrPost };
