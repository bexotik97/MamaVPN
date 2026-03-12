import type { NextConfig } from "next";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), "../../.env") });
loadEnv();

const nextConfig: NextConfig = {
  reactStrictMode: true
};

export default nextConfig;
