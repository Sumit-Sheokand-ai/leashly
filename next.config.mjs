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
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' blob: data: https:",
      `connect-src 'self' ${SUPABASE_URL} ${SUPABASE_WSS} https://accounts.google.com https://oauth2.googleapis.com https://*.googleapis.com https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://*.clarity.ms`,
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
      // non-www → www (301 permanent — Google follows this for canonical)
      {
        source: "/:path*",
        has: [{ type: "host", value: "leashly.dev" }],
        destination: "https://www.leashly.dev/:path*",
        permanent: true,
      },
      // proxy backward compat
      { source: "/api/proxy/chat/completions", destination: "/api/proxy/v1/chat/completions", permanent: false },
      { source: "/api/proxy/completions",      destination: "/api/proxy/v1/completions",      permanent: false },
    ];
  },

  async headers() {
    return [
      // Security headers on all pages except static files
      {
        source: "/((?!sitemap.xml|robots.txt|manifest.json|manifest.webmanifest|favicon|logo|og-image|bb149e).*)",
        headers: securityHeaders,
      },
      // CORS for proxy
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
