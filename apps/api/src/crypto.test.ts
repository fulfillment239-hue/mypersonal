/** Password test checks a real versioned hash without exposing credentials. */
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./crypto";

describe("password crypto", () => {
  it("verifies the correct password and rejects another one", async () => {
    const stored = await hashPassword("a password that is long enough", "test-pepper");
    await expect(verifyPassword("a password that is long enough", "test-pepper", stored)).resolves.toBe(true);
    await expect(verifyPassword("different password", "test-pepper", stored)).resolves.toBe(false);
  }, 20_000);
});

