import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/docs", "/login", "/register"],
        disallow: ["/dashboard/", "/api/"],
      },
    ],
    sitemap: "https://leashly.dev/sitemap.xml",
  };
}
