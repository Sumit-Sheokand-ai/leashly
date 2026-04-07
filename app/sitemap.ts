import { MetadataRoute } from "next";

const BASE_URL = "https://leashly.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    // Public marketing pages — high priority
    { url: BASE_URL,                lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE_URL}/docs`,      lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE_URL}/register`,  lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/login`,     lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/privacy`,   lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/terms`,     lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    // Dashboard pages excluded — auth required, no SEO value
  ];
}
