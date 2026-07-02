import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // This repo holds two independent npm projects (contract tests at the root,
  // this Next.js app in /frontend), so there are two lockfiles. Pin the
  // workspace root to this directory so Turbopack stops guessing.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
