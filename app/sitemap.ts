import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

// Only the public, indexable pages. The dashboards (/admin, /parent, /student)
// are auth-gated and deliberately excluded.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ["/", "/login", "/signup", "/terms", "/privacy", "/acceptable-use"].map(
    (path) => ({
      url: `${env.siteUrl}${path}`,
      lastModified: now,
      changeFrequency: path === "/" ? "monthly" : "yearly",
      priority: path === "/" ? 1 : 0.5,
    }),
  );
}
