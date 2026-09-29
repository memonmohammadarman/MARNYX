import { rateLimit } from "express-rate-limit";

const authRateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8" as const,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: "Too many authentication attempts, please try again later",
  },
};

export const loginRateLimiter = rateLimit({
  ...authRateLimitOptions,
});

export const registerRateLimiter = rateLimit({
  ...authRateLimitOptions,
});
