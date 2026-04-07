import { MetadataRoute } from "next";

const BASE_URL = "https://leashly.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/docs", "/login", "/register", "/privacy", "/terms"],
        disallow: ["/dashboard/", "/api/", "/invite"],
      },
      {
        // Block AI crawlers from scraping the app
        userAgent: ["GPTBot", "ChatGPT-User", "CCBot", "anthropic-ai", "Claude-Web"],
        disallow: ["/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
