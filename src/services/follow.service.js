const { NotificationType } = require("@prisma/client");
const { prisma } = require("../config/prisma");
const { createNotification } = require("./notification.service");

const followUser = async ({ followerId, followingId }) => {
  if (followerId === followingId) {
    const error = new Error("Trying to follow yourself?");
    error.statusCode = 400;
    throw error;
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: followingId },
  });

  if (!targetUser) {
    const error = new Error("User doesn't exist");
    error.statusCode = 404;
    throw error;
  }

  const existingFollow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });

  if (existingFollow) {
    const error = new Error("You already followed them");
    error.statusCode = 409;
    throw error;
  }

  const follow = await prisma.follow.create({
    data: { followerId, followingId },
  });

  await createNotification({
    userId: followingId,
    actorId: followerId,
    type: NotificationType.FOLLOW,
  });

  return follow;
};

const unfollowUser = async ({ followerId, followingId }) => {
  const existingFollow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });

  if (!existingFollow) {
    const error = new Error("You haven't follow them yet");
    error.statusCode = 404;
    throw error;
  }

  await prisma.follow.delete({
    where: { id: existingFollow.id },
  });

  return { message: "Unfollowed" };
};

const getUserIdByUsername = async (username) => {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user.id;
};

const getFollowers = async ({ username, viewerId }) => {
  const userId = await getUserIdByUsername(username);

  // user that we want the followers of their
  const [count, followers] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }), // find who follows the user
    prisma.follow.findMany({
      where: { followingId: userId },
      select: {
        follower: {
          select: { id: true, name: true, username: true, imageUrl: true },
        }, // get the followers info
      },
    }),
  ]);

  // Pull out just the ids of the followers (drop any nulls)
  const followerIds = followers
    .map(({ follower }) => follower?.id)
    .filter(Boolean);

  // Of those followers, find out which ones the VIEWER (current logged-in user) also follows
  // (this is what powers the "Follow"/"Following" button next to each follower in the list)
  const viewerFollowing = await prisma.follow.findMany({
    where: {
      followerId: viewerId,
      followingId: { in: followerIds },
    },
    select: { followingId: true },
  });

  // Convert to a Set for O(1) lookups instead of scanning an array each time
  const viewerFollowingIds = new Set(
    viewerFollowing.map(({ followingId }) => followingId),
  );

  return {
    count,
    // Attach an `isFollowing` flag to each follower, so the UI knows
    // whether the viewer already follows them too
    followers: followers.map((entry) => ({
      ...entry,
      follower: entry.follower
        ? {
            ...entry.follower,
            isFollowing: viewerFollowingIds.has(entry.follower.id),
          }
        : entry.follower, // stays null/undefined if the relation was missing
    })),
  };
};

const getFollowing = async ({ username, viewerId }) => {
  const userId = await getUserIdByUsername(username);

  const [count, followings] = await Promise.all([
    prisma.follow.count({ where: { followerId: userId } }), // find who the user following
    prisma.follow.findMany({
      where: { followerId: userId },
      select: {
        following: {
          select: { id: true, name: true, username: true, imageUrl: true },
        },
      }, // get the followers info
    }),
  ]);

  // Pull out just the ids of the people being followed (drop any nulls)
  const followingIds = followings
    .map(({ following }) => following?.id)
    .filter(Boolean);

  // Of those people, find out which ones the VIEWER (current logged-in user) also follows
  const viewerFollowing = await prisma.follow.findMany({
    where: {
      followerId: viewerId,
      followingId: { in: followingIds },
    },
    select: { followingId: true },
  });

  // Convert to a Set for O(1) lookups instead of scanning an array each time
  const viewerFollowingIds = new Set(
    viewerFollowing.map(({ followingId }) => followingId),
  );

  return {
    count,
    // Attach an `isFollowing` flag to each person, so the UI knows
    // whether to show "Follow" or "Following" next to their name
    followings: followings.map((entry) => ({
      ...entry,
      following: entry.following
        ? {
            ...entry.following,
            isFollowing: viewerFollowingIds.has(entry.following.id),
          }
        : entry.following, // stays null/undefined if the relation was missing
    })),
  };
};

module.exports = { followUser, unfollowUser, getFollowers, getFollowing };
