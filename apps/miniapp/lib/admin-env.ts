/**
 * Next server actions / RSC often don't see repo-root .env.
 * Load it explicitly from likely cwd layouts (monorepo dev, Vercel root apps/miniapp).
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";

let loaded = false;

export function ensureAdminEnv(): void {
  if (loaded) return;
  const cwd = process.cwd();
  const candidates = [
    resolve(cwd, ".env.local"),
    resolve(cwd, ".env"),
    resolve(cwd, "../../.env"), // apps/miniapp -> repo root
    resolve(cwd, "../.env"),
    resolve(cwd, "../../../.env")
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      loadEnv({ path: p, override: false });
    }
  }
  loaded = true;
}

export function getAdminApiKey(): string | undefined {
  ensureAdminEnv();
  // Bracket access so bundler is less likely to strip at build time when unset
  return process.env["ADMIN_API_KEY"];
}
