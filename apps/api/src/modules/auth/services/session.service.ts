import { prisma } from "../../../db/prisma.js";
import {
  generateSessionToken,
  hashSessionToken,
} from "../session.crypto.js";
import { AUTH_CONSTANTS } from "../auth.constants.js";

export async function createSession(userId: string) {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);

  const expiresAt = new Date(
    Date.now() +
      AUTH_CONSTANTS.sessionTtlDays * 24 * 60 * 60 * 1000,
  );

  const session = await prisma.session.create({
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

export async function findSessionByToken(token: string) {
  const tokenHash = hashSessionToken(token);

  const session = await prisma.session.findUnique({
    where: {
      tokenHash,
    },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({
      where: {
        id: session.id,
      },
    });

    return null;
  }

  return session;
}

export async function touchSession(sessionId: string): Promise<void> {
  await prisma.session.update({
    where: {
      id: sessionId,
    },
    data: {
      lastUsedAt: new Date(),
    },
  });
}

export async function revokeSession(token: string): Promise<void> {
  const tokenHash = hashSessionToken(token);

  await prisma.session.deleteMany({
    where: {
      tokenHash,
    },
  });
}
