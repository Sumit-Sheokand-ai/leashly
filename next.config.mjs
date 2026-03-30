/** @type {import('next').NextConfig} */
const SUPABASE_URL = "https://jjguuxekekxvfyjckgjf.supabase.co";
const SUPABASE_WSS = "wss://jjguuxekekxvfyjckgjf.supabase.co";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' blob: data: https:",
      // Allow Supabase API + realtime, Google OAuth, and localhost dev
      `connect-src 'self' ${SUPABASE_URL} ${SUPABASE_WSS} https://accounts.google.com https://oauth2.googleapis.com https://*.googleapis.com`,
      "frame-src https://accounts.google.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
    optimizePackageImports: ["next/font/google"],
  },
};

export default nextConfig;
