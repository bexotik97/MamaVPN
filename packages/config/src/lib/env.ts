import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().default(3000),
  BOT_PORT: z.coerce.number().default(3100),
  MINIAPP_URL: z.string().default("http://localhost:3001"),
  API_BASE_URL: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  TELEGRAM_BOT_TOKEN: z.string(),
  TELEGRAM_BOT_USERNAME: z.string(),
  TELEGRAM_SUPPORT_URL: z.string(),
  TELEGRAM_CHANNEL_URL: z.string(),
  TELEGRAM_WEBAPP_URL: z.string(),
  TELEGRAM_WEBAPP_SECRET: z.string(),
  NEXT_PUBLIC_API_BASE_URL: z.string().default("http://localhost:3000"),
  MARZBAN_BASE_URL: z.string(),
  MARZBAN_USERNAME: z.string(),
  MARZBAN_PASSWORD: z.string(),
  MARZBAN_SUBSCRIPTION_URL_PREFIX: z.string(),
  MARZBAN_DEFAULT_INBOUND_TAG: z.string().default("main"),
  MARZBAN_DEFAULT_EXPIRE_DAYS: z.coerce.number().default(3),
  MARZBAN_DEFAULT_DATA_LIMIT_BYTES: z.coerce.number().default(536870912),
  BILLING_PROVIDER: z.string().default("mock"),
  BILLING_CALLBACK_SECRET: z.string(),
  ADMIN_API_KEY: z.string()
});

export type AppEnv = z.infer<typeof envSchema>;

export const parseEnv = (input: Record<string, string | undefined>): AppEnv =>
  envSchema.parse(input);
