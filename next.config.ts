import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["puppeteer-core", "puppeteer", "@sparticuz/chromium"],
};

export default nextConfig;
