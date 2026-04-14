import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@google/generative-ai"],
  serverExternalPackages: ["@google/generative-ai"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
      { protocol: "https", hostname: "maps.googleapis.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "postimg.cc" },
    ],
  },
  experimental: {
    turbo: {
      resolveAlias: {
        "@google/generative-ai": "./node_modules/@google/generative-ai/dist/index.mjs",
      },
    },
  },
};

export default nextConfig;
