import { MetadataRoute } from "next";

const BASE_URL = "https://www.leashly.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // Homepage — highest priority, crawled most often
    {
      url: BASE_URL,
      lastModified: new Date("2025-04-01"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    // Docs — high priority, frequently updated
    {
      url: `${BASE_URL}/docs`,
      lastModified: new Date("2025-04-01"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    // Register — conversion page
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // Login
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    // Legal
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    // Dashboard pages — excluded (auth required, no SEO value)
  ];
}
