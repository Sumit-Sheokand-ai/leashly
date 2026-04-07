import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Leashly",
    short_name: "Leashly",
    description: "AI cost control and optimization proxy",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#00ff88",
    icons: [
      { src: "/favicon-16.png",    sizes: "16x16",   type: "image/png" },
      { src: "/favicon-32.png",    sizes: "32x32",   type: "image/png" },
      { src: "/logo-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/logo-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
