import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.clerk.accounts.dev"
      },
      {
        protocol: "https",
        hostname: "*img.clerk.com"
      }
    ]
  },
  domains: ["img.clerk.com"],
}

export default nextConfig
