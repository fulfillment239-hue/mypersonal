/** Presentation helpers keep locale and route mapping consistent across Astro pages. */
import type { Category, Locale, LocalizedText, Project, SiteContent } from "@462019/contracts";

export function copy(locale: Locale, text: LocalizedText): string {
  return text[locale];
}

export function localePath(locale: Locale, path = ""): string {
  const clean = path.replace(/^\//, "");
  return locale === "zh-CN" ? `/zh-cn/${clean}`.replace(/\/$/, "/") : `/${clean}`.replace(/\/$/, "/");
}

export function projectPath(locale: Locale, project: Project): string {
  return localePath(locale, `work/${project.slug}`);
}

export function categoryFor(categories: Category[], project: Project): Category | undefined {
  return categories.find((category) => category.id === project.categoryId);
}

export type PageData = { locale: Locale; site: SiteContent; categories: Category[]; projects: Project[] };
