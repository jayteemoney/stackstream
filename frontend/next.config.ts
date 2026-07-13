import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // This repo holds two independent npm projects (contract tests at the root,
  // this Next.js app in /frontend), so there are two lockfiles. Pin the
  // workspace root to this directory so Turbopack stops guessing.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // @stacks/connect is imported statically (so the wallet path ships in the
  // initial client bundle and can't lose a lazy chunk across deploys), but
  // Turbopack's server bundle can't wire its module graph during prerender
  // ("module factory is not available"). Keep it external on the server —
  // Node resolves it natively there.
  serverExternalPackages: ["@stacks/connect"],
};

export default nextConfig;
