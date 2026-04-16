import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  transpilePackages: ["leaflet"],
  // Mongoose uses Node.js APIs not available in the Edge runtime
  serverExternalPackages: ["mongoose"],
};

export default nextConfig;
