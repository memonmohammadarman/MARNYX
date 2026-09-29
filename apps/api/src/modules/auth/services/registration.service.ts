import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../db/prisma.js";
import { registerSchema } from "../schemas/auth.schemas.js";
import { hashPassword } from "../password.crypto.js";
import {
  generateSessionToken,
  hashSessionToken,
} from "../session.crypto.js";
import { AUTH_CONSTANTS } from "../auth.constants.js";

export class RegistrationError extends Error {
  constructor(
    message: string,
    public readonly code: "VALIDATION_ERROR" | "EMAIL_EXISTS",
  ) {
    super(message);
    this.name = "RegistrationError";
  }
}

async function createSessionWithClient(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);

  const expiresAt = new Date(
    Date.now() +
      AUTH_CONSTANTS.sessionTtlDays * 24 * 60 * 60 * 1000,
  );

  const session = await tx.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });

  return {
    session,
    token,
  };
}

export async function registerUser(input: unknown) {
  const parsed = registerSchema.safeParse(input);

  if (!parsed.success) {
    throw new RegistrationError(
      "Invalid registration data",
      "VALIDATION_ERROR",
    );
  }

  const { email, password, name } = parsed.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new RegistrationError(
      "An account with this email already exists",
      "EMAIL_EXISTS",
    );
  }

  const passwordHash = await hashPassword(password);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name: name ?? null,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const { token, session } = await createSessionWithClient(tx, user.id);

    return {
      user,
      session,
      token,
    };
  });
}
