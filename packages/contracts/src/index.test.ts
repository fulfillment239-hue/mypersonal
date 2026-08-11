/** Contract tests prevent one-language records from accidentally reaching a published build. */
import { describe, expect, it } from "vitest";
import { LocalizedTextSchema, RegistrationSchema } from "./index";

describe("shared contracts", () => {
  it("requires both public locales", () => {
    expect(() => LocalizedTextSchema.parse({ en: "Hello" })).toThrow();
  });

  it("rejects role injection during registration", () => {
    expect(RegistrationSchema.safeParse({ username: "visitor", password: "a-safe-password", turnstileToken: "token", role: "admin" }).success).toBe(true);
    expect(RegistrationSchema.parse({ username: "visitor", password: "a-safe-password", turnstileToken: "token" })).not.toHaveProperty("role");
  });
});

