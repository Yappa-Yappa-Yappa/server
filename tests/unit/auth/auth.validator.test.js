const { describe, test, expect } = require("@jest/globals");
const {
  registerSchema,
  loginSchema,
} = require("../../../src/validators/auth.validator");

describe("auth validators", () => {
  test("accepts registration", () => {
    const result = registerSchema.safeParse({
      name: "Mizu",
      email: "mizu@example.com",
      password: "Password1!",
    });
    expect(result.success).toBe(true);
  });

  test("rejects weak password", () => {
    const result = registerSchema.safeParse({
      name: "Mizu",
      email: "mizu@example.com",
      password: "weak",
    });
    expect(result.success).toBe(false);
  });

  test("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      name: "Mizu",
      email: "mizu",
      password: "Password1!",
    });
    expect(result.success).toBe(false);
  });

  test("accepts uppercase email then normalize it", () => {
    const result = loginSchema.safeParse({
      name: "Mizu",
      email: "MIZU@EXAMPLE.COM",
      password: "Password1!",
    });
    expect(result.success).toBe(true);
  });
});
