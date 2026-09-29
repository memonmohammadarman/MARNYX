import type { Request } from "express";
import { AUTH_CONSTANTS } from "./auth.constants.js";

export function readSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const separatorIndex = cookie.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const name = cookie.slice(0, separatorIndex).trim();

    if (name !== AUTH_CONSTANTS.sessionCookieName) {
      continue;
    }

    const value = cookie.slice(separatorIndex + 1).trim();

    return value.length > 0 ? value : null;
  }

  return null;
}
