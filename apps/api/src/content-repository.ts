/** R2-backed JSON repository with local seeds for first-run development. */
import { CategorySchema, ProjectSchema, SiteContentSchema, type Category, type Project, type SiteContent } from "@462019/contracts";
import { seededCategories, seededProjects, seededSite } from "@462019/content";
import type { Bindings } from "./bindings";

export class ContentRepository {
  constructor(private readonly bucket: R2Bucket) {}

  async getSite(): Promise<SiteContent> {
    return this.read("content/site.json", SiteContentSchema, seededSite);
  }

  async getCategories(): Promise<Category[]> {
    return this.read("content/categories.json", CategorySchema.array(), seededCategories);
  }

  async getProjects(): Promise<Project[]> {
    return this.read("content/projects.json", ProjectSchema.array(), seededProjects);
  }

  async getAdminContent(kind: ContentKind): Promise<unknown> {
    if (kind === "site") return this.getSite();
    if (kind === "categories") return this.getCategories();
    if (kind === "projects") return this.getProjects();
    return this.read("content/media.json", { parse: (value: unknown) => value }, []);
  }

  async replaceAdminContent(kind: ContentKind, value: unknown): Promise<void> {
    const schema = schemas[kind];
    const parsed = schema.parse(value);
    const key = `content/${kind}.json`;
    const previous = await this.bucket.get(key);
    if (previous) await this.bucket.put(`revisions/${stamp()}/${kind}.json`, await previous.arrayBuffer());
    await this.bucket.put(key, JSON.stringify(parsed, null, 2), { httpMetadata: { contentType: "application/json; charset=utf-8" } });
  }

  private async read<T>(key: string, schema: { parse: (value: unknown) => T }, fallback: T): Promise<T> {
    const object = await this.bucket.get(key);
    if (!object) return fallback;
    return schema.parse(await object.json());
  }
}

export function contentRepository(env: Bindings): ContentRepository {
  return new ContentRepository(env.CONTENT);
}

export type ContentKind = "site" | "categories" | "projects" | "media";

const schemas: Record<ContentKind, { parse: (value: unknown) => unknown }> = {
  site: SiteContentSchema,
  categories: CategorySchema.array(),
  projects: ProjectSchema.array(),
  media: { parse: (value: unknown) => value }
};

function stamp(): string {
  return new Date().toISOString().replaceAll(/[:.]/g, "-");
}
