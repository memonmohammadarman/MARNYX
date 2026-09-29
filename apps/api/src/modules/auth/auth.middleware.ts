import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../db/prisma.js";
import { findSessionFromRequest } from "./session.lookup.js";

export async function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const session = await findSessionFromRequest(request);

    if (!session) {
      response.status(401).json({
        error: "Authentication required",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      response.status(401).json({
        error: "Authentication required",
      });
      return;
    }

    response.locals.session = session;
    response.locals.user = user;

    next();
  } catch (error) {
    next(error);
  }
}
