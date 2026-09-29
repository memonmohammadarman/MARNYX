import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envCandidates = [
  path.resolve(__dirname, "../../../../.env"),
  path.resolve(process.cwd(), ".env"),
];

const envPath = envCandidates.find((candidate) => fs.existsSync(candidate));

if (!envPath) {
  throw new Error("MARNYX root .env file could not be found.");
}

loadEnv({ path: envPath });

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid environment configuration: ${details}`);
}

export const ENV = parsed.data;
