import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/echoes-of-heroes",
  assetPrefix: "/echoes-of-heroes/",
  devIndicators: false,
  images: {
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
