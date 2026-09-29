import { Router } from "express";
import {
  registerUser,
  RegistrationError,
} from "../services/registration.service.js";
import {
  loginUser,
  LoginError,
} from "../services/login.service.js";
import {
  setSessionCookie,
  clearSessionCookie,
} from "../cookie.service.js";
import { requireAuth } from "../auth.middleware.js";
import { loginRateLimiter, registerRateLimiter } from "../auth.rate-limit.js";
import { readSessionToken } from "../cookie.reader.js";
import {
  revokeSession,
  revokeSessionById,
} from "../services/session.service.js";

const router = Router();

router.post("/register", registerRateLimiter, async (req, res, next) => {
  try {
    const result = await registerUser(req.body);

    setSessionCookie(res, result.token);

    return res.status(201).json({
      user: result.user,
      session: result.session,
    });
  } catch (error) {
    if (error instanceof RegistrationError) {
      if (error.code === "VALIDATION_ERROR") {
        return res.status(400).json({
          error: "Invalid registration data",
        });
      }

      if (error.code === "EMAIL_EXISTS") {
        return res.status(409).json({
          error: "An account with this email already exists",
        });
      }
    }

    return next(error);
  }
});

router.post("/login", loginRateLimiter, async (req, res, next) => {
  try {
    const result = await loginUser(req.body);

    setSessionCookie(res, result.token);

    return res.status(200).json({
      user: result.user,
      session: result.session,
    });
  } catch (error) {
    if (error instanceof LoginError) {
      if (error.code === "VALIDATION_ERROR") {
        return res.status(400).json({
          error: "Invalid login data",
        });
      }

      if (error.code === "INVALID_CREDENTIALS") {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }
    }

    return next(error);
  }
});

router.get("/me", requireAuth, (_req, res) => {
  const user = res.locals.user;

  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

router.post("/logout", async (req, res, next) => {
  try {
    const token = readSessionToken(req);

    if (token) {
      await revokeSession(token);
    }

    clearSessionCookie(res);

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.post("/revoke-session", requireAuth, async (_req, res, next) => {
  try {
    const session = res.locals.session;

    await revokeSessionById(session.id);
    clearSessionCookie(res);

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
