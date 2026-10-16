const { z } = require("zod");

const createReportSchema = z
  .object({
    postId: z.string().uuid().optional(),
    commentId: z.string().uuid().optional(),
    reportedUserId: z.string().uuid().optional(),
    reason: z.enum(
      ["SPAM", "HARASSMENT", "HATE_SPEECH", "INAPPROPRIATE", "OTHER"],
      { message: "Invalid reason" },
    ),
    description: z.string().trim().max(500, "Description too long").optional(),
  })
  .refine(
    (d) =>
      [d.postId, d.commentId, d.reportedUserId].filter(Boolean).length === 1,
    { message: "Report exactly one post, comment, or user" },
  );

const resolveReportSchema = z.object({
  status: z.enum(["RESOLVED", "DISMISSED"], { message: "Invalid status" }),
});

module.exports = { createReportSchema, resolveReportSchema };
