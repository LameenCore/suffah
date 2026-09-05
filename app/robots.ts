import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Auth-gated app surfaces — nothing to index, and they carry data about minors.
      disallow: ["/admin", "/parent", "/student", "/api", "/print"],
    },
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
