import { PrismaPg } from "@prisma/adapter-pg";
import { ENV } from "../config/env.js";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = ENV.DATABASE_URL;

const adapter = new PrismaPg({
  connectionString,
});

export const prisma = new PrismaClient({
  adapter,
});
