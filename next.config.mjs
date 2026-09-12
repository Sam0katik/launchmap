/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // No next/image in the app — switch the image optimizer off entirely so its
  // /_next/image endpoint (a recurring source of Next.js advisories) is inert.
  images: { unoptimized: true },
  // Dynamic pages (map, profile) must never be served from the client router
  // cache: a stale RSC payload showed "Find live threads · free" on a map that
  // had already used its free search (and the profile showed an old balance).
  experimental: { staleTimes: { dynamic: 0 } },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
