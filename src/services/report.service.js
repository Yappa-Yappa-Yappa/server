const { prisma } = require("../config/prisma");

const createReport = async ({
  reporterId,
  postId,
  commentId,
  reportedUserId,
  reason,
  description,
}) => {
  // exactly one target must be set
  const targets = [postId, commentId, reportedUserId].filter(Boolean);
  if (targets.length !== 1) {
    const error = new Error("Report exactly one post, comment, or user");
    error.statusCode = 400;
    throw error;
  }

  if (reportedUserId === reporterId) {
    const error = new Error("You can't report yourself");
    error.statusCode = 400;
    throw error;
  }

  let existing;

  if (postId) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      throw error;
    }
    existing = await prisma.report.findUnique({
      where: { reporterId_postId: { reporterId, postId } },
    });
  } else if (commentId) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      const error = new Error("Comment not found");
      error.statusCode = 404;
      throw error;
    }
    existing = await prisma.report.findUnique({
      where: { reporterId_commentId: { reporterId, commentId } },
    });
  } else {
    const user = await prisma.user.findUnique({
      where: { id: reportedUserId },
    });
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    existing = await prisma.report.findUnique({
      where: { reporterId_reportedUserId: { reporterId, reportedUserId } },
    });
  }

  if (existing) return existing; // already reported, return it instead of erroring

  return prisma.report.create({
    data: {
      reporterId,
      postId,
      commentId,
      reportedUserId,
      reason,
      description,
    },
  });
};

const getReports = async () => {
  const result = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
  });

  return result;
};

const getReportById = async ({ reportId }) => {
  const result = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      reporter: { select: { id: true, name: true, username: true } },
      reportedUser: { select: { id: true, name: true, username: true } },
      post: { select: { id: true, content: true } },
      comment: { select: { id: true, content: true } },
    },
  });

  if (!result) {
    const error = new Error("Report not found");
    error.statusCode = 404;
    throw error;
  }

  return result;
};

const resolveReport = async ({ reportId, resolverId, status }) => {
  if (!["RESOLVED", "DISMISSED"].includes(status)) {
    const error = new Error("Invalid status");
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.report.findUnique({
    where: { id: reportId },
  });

  if (!existing) {
    const error = new Error("Report not found");
    error.statusCode = 404;
    throw error;
  }

  if (existing.status !== "PENDING") {
    const error = new Error("Report already handled");
    error.statusCode = 409;
    throw error;
  }

  const result = await prisma.report.update({
    where: { id: reportId },
    data: {
      status,
      resolvedById: resolverId,
      resolvedAt: new Date(),
    },
  });

  return result;
};

module.exports = { createReport, getReports, getReportById, resolveReport };
