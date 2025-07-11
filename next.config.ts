import { sk } from "date-fns/locale";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
  images: {
    domains: ['teknikkomputer.polsri.ac.id'],
  }
};

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,   
  skipWaiting: true, 
})

export default withPWA(nextConfig);
