import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://leashly.dev";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/docs", "/login", "/register"],
        disallow: ["/dashboard", "/api"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
