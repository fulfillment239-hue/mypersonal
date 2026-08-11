/** Seed data must satisfy the same schema the R2 repository validates at runtime. */
import { describe, expect, it } from "vitest";
import { CategorySchema, ProjectSchema, SiteContentSchema } from "@462019/contracts";
import { seededCategories, seededProjects, seededSite } from "./index";

describe("seed content", () => {
  it("contains valid bilingual site content", () => expect(SiteContentSchema.parse(seededSite).brand).toBe("462019"));
  it("uses immutable IDs in each project", () => expect(seededProjects.every((project) => ProjectSchema.safeParse(project).success)).toBe(true));
  it("keeps active categories valid", () => expect(seededCategories.every((category) => CategorySchema.safeParse(category).success)).toBe(true));
});

