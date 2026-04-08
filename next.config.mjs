/** @type {import('next').NextConfig} */
const SUPABASE_URL = "https://jjguuxekekxvfyjckgjf.supabase.co";
const SUPABASE_WSS = "wss://jjguuxekekxvfyjckgjf.supabase.co";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Clarity loads scripts from scripts.clarity.ms AND www.clarity.ms
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms https://scripts.clarity.ms",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' blob: data: https:",
      // Clarity also pings .clarity.ms for analytics data
      `connect-src 'self' ${SUPABASE_URL} ${SUPABASE_WSS} https://accounts.google.com https://oauth2.googleapis.com https://*.googleapis.com https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://*.clarity.ms https://scripts.clarity.ms`,
      "frame-src https://accounts.google.com https://www.googletagmanager.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig = {
  poweredByHeader: false,
  compress: true,

  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "leashly.dev" }],
        destination: "https://www.leashly.dev/:path*",
        permanent: true,
      },
      { source: "/api/proxy/chat/completions", destination: "/api/proxy/v1/chat/completions", permanent: false },
      { source: "/api/proxy/completions",      destination: "/api/proxy/v1/completions",      permanent: false },
    ];
  },

  async headers() {
    return [
      {
        source: "/((?!sitemap.xml|robots.txt|manifest.json|manifest.webmanifest|favicon|logo|og-image|bb149e).*)",
        headers: securityHeaders,
      },
      {
        source: "/api/proxy/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin",  value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },

  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
    optimizePackageImports: ["next/font/google"],
  },
};

export default nextConfig;
