import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
  images: {
    domains: ['teknikkomputer.polsri.ac.id'],
  }
};

export default nextConfig;
