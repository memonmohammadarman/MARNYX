import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envCandidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(__dirname, "../../../.env"),
  path.resolve(__dirname, "../../../../.env"),
];

const envPath = envCandidates.find((candidate) => fs.existsSync(candidate));

if (!envPath) {
  throw new Error("MARNYX root .env file could not be found.");
}

loadEnv({ path: envPath });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(`DATABASE_URL is not configured. Loaded env from: ${envPath}`);
}

const adapter = new PrismaPg({
  connectionString,
});

export const prisma = new PrismaClient({
  adapter,
});
