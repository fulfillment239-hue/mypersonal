/** Route helpers are tested independently from Astro so language links remain stable. */
import { describe, expect, it } from "vitest";
import { localePath } from "./lib";

describe("locale paths", () => {
  it("uses English at the root and Chinese under zh-cn", () => {
    expect(localePath("en", "works")).toBe("/works");
    expect(localePath("zh-CN", "works")).toBe("/zh-cn/works");
  });
});
