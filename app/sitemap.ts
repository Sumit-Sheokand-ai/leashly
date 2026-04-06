import { MetadataRoute } from "next";

const BASE_URL = "https://leashly.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE_URL,                              lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE_URL}/docs`,                    lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE_URL}/login`,                   lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/register`,                lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/dashboard`,               lastModified: now, changeFrequency: "weekly",  priority: 0.5 },
    { url: `${BASE_URL}/dashboard/routing`,       lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/dashboard/cache`,         lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/dashboard/benchmark`,     lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/dashboard/analytics`,     lastModified: now, changeFrequency: "weekly",  priority: 0.4 },
    { url: `${BASE_URL}/dashboard/billing`,       lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/dashboard/workspace`,     lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];
}
