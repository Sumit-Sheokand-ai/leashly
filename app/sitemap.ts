import { MetadataRoute } from "next";

const BASE_URL = "https://www.leashly.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // These are the ONLY pages Google should index
    {
      url: BASE_URL,
      lastModified: new Date("2026-04-21"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/docs`,
      lastModified: new Date("2026-04-21"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    // Login/register excluded — they have noindex so should NOT be in sitemap
    // Privacy/terms excluded — very low value, causes crawl budget waste
    // Dashboard excluded — auth required
  ];
}
