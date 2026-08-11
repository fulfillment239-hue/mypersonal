/** Shared API contracts for the web Worker and the content API Worker. */
import { z } from "zod";

export const LocaleSchema = z.enum(["en", "zh-CN"]);
export type Locale = z.infer<typeof LocaleSchema>;

export const LocalizedTextSchema = z.object({
  en: z.string().min(1),
  "zh-CN": z.string().min(1)
});
export type LocalizedText = z.infer<typeof LocalizedTextSchema>;

export const ProjectStatusSchema = z.enum(["draft", "published"]);
export const RoleSchema = z.enum(["member", "admin"]);

export const CategorySchema = z.object({
  id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  label: LocalizedTextSchema,
  description: LocalizedTextSchema,
  order: z.number().int().nonnegative(),
  active: z.boolean()
});
export type Category = z.infer<typeof CategorySchema>;

export const ProjectSchema = z.object({
  projectId: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  categoryId: z.string().uuid(),
  status: ProjectStatusSchema,
  isDemo: z.boolean(),
  featured: z.boolean(),
  order: z.number().int().nonnegative(),
  year: z.string().regex(/^\d{4}$/),
  title: LocalizedTextSchema,
  summary: LocalizedTextSchema,
  bodyMarkdown: LocalizedTextSchema,
  roles: z.array(z.string().min(1)).max(12),
  technologies: z.array(z.string().min(1)).max(16),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  links: z.array(z.object({ label: LocalizedTextSchema, href: z.string().url() })).max(4)
});
export type Project = z.infer<typeof ProjectSchema>;

export const SiteContentSchema = z.object({
  brand: z.string().min(1),
  heroTitle: LocalizedTextSchema,
  heroKicker: LocalizedTextSchema,
  heroDescription: LocalizedTextSchema,
  aboutTitle: LocalizedTextSchema,
  aboutBody: LocalizedTextSchema,
  contactTitle: LocalizedTextSchema,
  contactBody: LocalizedTextSchema,
  contactEmail: z.string().email().optional(),
  socialLinks: z.array(z.object({ label: z.string(), href: z.string().url() })).max(8)
});
export type SiteContent = z.infer<typeof SiteContentSchema>;

export const RegistrationSchema = z.object({
  username: z.string().regex(/^[a-z0-9_]{3,32}$/),
  password: z.string().min(12).max(128),
  email: z.string().email().max(254).optional(),
  turnstileToken: z.string().min(1)
});

export const LoginSchema = z.object({
  username: z.string().regex(/^[a-z0-9_]{3,32}$/),
  password: z.string().min(1).max(128),
  turnstileToken: z.string().optional()
});

export function textFor(locale: Locale, value: LocalizedText): string {
  return value[locale];
}

