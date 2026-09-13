import { z } from "zod";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const globalForEnv = globalThis as unknown as { __DEV_SESSION_SECRET: string };
const DEV_RANDOM_SECRET = globalForEnv.__DEV_SESSION_SECRET ?? Math.random().toString(36).substring(2) + Date.now().toString(36);
if (process.env.NODE_ENV !== "production") {
  globalForEnv.__DEV_SESSION_SECRET = DEV_RANDOM_SECRET;
}

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "file:./dev.db",
  sessionSecret: process.env.SESSION_SECRET ?? DEV_RANDOM_SECRET,
  encryptionKey: process.env.ENCRYPTION_KEY ?? "",
  demoOtp: process.env.DEMO_OTP ?? "000000",
  demoRoleSwitch: (process.env.DEMO_ROLE_SWITCH ?? "true") === "true",
  llmMode: (process.env.LLM_MODE ?? "mock") as "mock" | "live",
  rateLimitRpm: Number(process.env.RATE_LIMIT_RPM ?? "120"),
  storageAdapter: process.env.STORAGE_ADAPTER ?? "filesystem",
  storageRoot: process.env.STORAGE_ROOT ?? "./storage/objects",
  searchAdapter: process.env.SEARCH_ADAPTER ?? "sqlite_fts",
  ledgerAdapter: process.env.LEDGER_ADAPTER ?? "hash_chain",
};

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  otp: z.string().optional(),
});

export { requireEnv };
