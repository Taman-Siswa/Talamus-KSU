import type { NextConfig } from "next";

// `npm run build:firebase` sets KSU_EXPORT to build a static site (out/) for Firebase Hosting.
// Everything KSU does runs in the browser, so no server is needed. Normal dev and build are unchanged.
const nextConfig: NextConfig = {
  output: process.env.KSU_EXPORT ? "export" : undefined,
};

export default nextConfig;
