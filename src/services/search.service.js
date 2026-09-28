const { prisma } = require("../config/prisma");

const searchUserOrPost = async ({ query }) => {
  if (!query || !query.trim()) {
    return { users: [], posts: [] };
  }

  const trimmedQuery = query.trim();

  const [users, posts] = await Promise.all([
    prisma.user.findMany({
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
      take: 20,
    }),
    prisma.post.findMany({
      where: { content: { contains: trimmedQuery, mode: "insensitive" } },
      select: {
        id: true,
        content: true,
        images: { select: { url: true } },
      },
      take: 20,
    }),
  ]);

  return { users, posts };
};

module.exports = { searchUserOrPost };
