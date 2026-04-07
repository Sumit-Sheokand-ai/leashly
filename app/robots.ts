import { MetadataRoute } from "next";

const BASE_URL = "https://www.leashly.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/docs", "/login", "/register", "/privacy", "/terms", "/llms.txt"],
        disallow: ["/dashboard/", "/api/", "/invite"],
      },
      // Allow AI crawlers to read llms.txt and public pages
      {
        userAgent: ["GPTBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "anthropic-ai"],
        allow: ["/", "/docs", "/llms.txt", "/register"],
        disallow: ["/dashboard/", "/api/"],
      },
      // Block scraper bots
      {
        userAgent: ["CCBot", "omgili", "omgilibot", "Diffbot"],
        disallow: ["/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
