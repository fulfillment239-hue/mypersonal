/** Versioned JSON seeds used locally and uploaded to R2 by deployment tooling. */
import type { Category, Project, SiteContent } from "@462019/contracts";
import categoriesSource from "../categories.json";
import projectsSource from "../projects.json";
import siteSource from "../site.json";

export const seededSite = siteSource as SiteContent;
export const seededCategories = categoriesSource as Category[];
export const seededProjects = projectsSource as Project[];
