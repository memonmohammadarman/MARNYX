import type { CookieOptions, Response } from "express";
import { AUTH_CONSTANTS } from "./auth.constants.js";
import { ENV } from "../../config/env.js";

const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: ENV.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: AUTH_CONSTANTS.sessionTtlDays * 24 * 60 * 60 * 1000,
};

export function setSessionCookie(
  response: Response,
  token: string,
): void {
  response.cookie(
    AUTH_CONSTANTS.sessionCookieName,
    token,
    sessionCookieOptions,
  );
}

export function clearSessionCookie(response: Response): void {
  response.clearCookie(
    AUTH_CONSTANTS.sessionCookieName,
    {
      httpOnly: true,
      secure: ENV.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  );
}
