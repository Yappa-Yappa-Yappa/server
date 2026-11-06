const { z } = require("zod");

// Setting up or replacing a face needs the account password (an open session alone is not enough).
const faceSetupSchema = z.object({
  password: z.string().min(1, "Password is required").max(255),
});

module.exports = { faceSetupSchema };
