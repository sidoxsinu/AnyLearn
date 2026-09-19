import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Required so that Zustand doesn't SSR-error on localStorage access
  // (all store usage is behind 'use client')
};

export default nextConfig;
