import { MetadataRoute } from "next";

const BASE_URL = "https://www.leashly.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/docs"],
        // Explicitly block everything that should not be indexed
        disallow: [
          "/dashboard/",
          "/api/",
          "/login",
          "/register",
          "/invite",
          "/privacy",
          "/terms",
        ],
      },
      // Allow AI crawlers on public content only
      {
        userAgent: ["GPTBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "anthropic-ai"],
        allow: ["/", "/docs", "/llms.txt"],
        disallow: ["/dashboard/", "/api/", "/login", "/register"],
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
