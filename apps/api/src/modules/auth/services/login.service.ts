import { prisma } from "../../../db/prisma.js";
import { loginSchema } from "../schemas/auth.schemas.js";
import { verifyPassword } from "../password.crypto.js";
import { createSession } from "./session.service.js";

export class LoginError extends Error {
  constructor(
    message: string,
    public readonly code: "VALIDATION_ERROR" | "INVALID_CREDENTIALS",
  ) {
    super(message);
    this.name = "LoginError";
  }
}

export async function loginUser(input: unknown) {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    throw new LoginError(
      "Invalid login data",
      "VALIDATION_ERROR",
    );
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new LoginError(
      "Invalid email or password",
      "INVALID_CREDENTIALS",
    );
  }

  const passwordValid = await verifyPassword(
    user.passwordHash,
    password,
  );

  if (!passwordValid) {
    throw new LoginError(
      "Invalid email or password",
      "INVALID_CREDENTIALS",
    );
  }

  const { session, token } = await createSession(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    session,
    token,
  };
}
