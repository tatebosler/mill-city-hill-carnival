import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const assetPrefix = basePath || "";

const nextConfig: NextConfig = {
  basePath: basePath || undefined,
  assetPrefix: assetPrefix || undefined,
};

export default nextConfig;
