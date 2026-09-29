import type { Request } from "express";
import { findSessionByToken } from "./services/session.service.js";
import { readSessionToken } from "./cookie.reader.js";

export async function findSessionFromRequest(request: Request) {
  const token = readSessionToken(request);

  if (!token) {
    return null;
  }

  return findSessionByToken(token);
}
