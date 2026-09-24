import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // This repo holds two independent npm projects (contract tests at the root,
  // this Next.js app in /frontend), so there are two lockfiles. Pin the
  // workspace root to this directory so Turbopack stops guessing.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // The /api routes are a public, read-only view of on-chain data, so any
  // site may read them from the browser (integration Level 3 in
  // docs/INTEGRATION_GUIDE.md). They take no cookies or credentials and
  // expose only GET, so a wildcard origin grants nothing the chain doesn't.
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
