import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: false,
  },
  images:{
    remotePatterns:[
      {
        protocol:"https",
        hostname:"randomuser.me"
      }
    ]
  }
};

export default nextConfig;
