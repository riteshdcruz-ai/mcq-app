import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow LAN access from any device on the local network
  allowedDevOrigins: ["192.168.1.4", "192.168.1.*", "192.168.*.*", "10.*.*.*", "172.16.*.*", "172.*.*.*", "*.lhr.life"],
  // Allow large book file uploads (up to 50MB)
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
