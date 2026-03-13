import type { NextConfig } from "next";
import { existsSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

// Monorepo: optional root .env at build/dev time. Must not throw on Vercel (no file / read-only).
try {
  const rootEnv = resolve(process.cwd(), "../../.env");
  if (existsSync(rootEnv)) {
    loadEnv({ path: rootEnv });
  }
  loadEnv();
} catch {
  // Platform env (Vercel dashboard) is enough
}

const nextConfig: NextConfig = {
  reactStrictMode: true
};

export default nextConfig;
