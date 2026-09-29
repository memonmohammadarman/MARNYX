import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import app from "../dist/app.js";
import { prisma } from "../dist/db/prisma.js";
import {
  loginRateLimiter,
  registerRateLimiter,
} from "../dist/modules/auth/auth.rate-limit.js";


let server;
let baseUrl;

const testEmail = `auth-test-${Date.now()}@marnyx.local`;
const testPassword = "MARNYX-Automated-Test-123";
const testName = "Automated Test";

let sessionCookie;

function getCookie(response) {
  const setCookie = response.headers.get("set-cookie");

  assert.ok(setCookie, "Expected Set-Cookie header");

  return setCookie.split(";")[0];
}

async function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, options);
}

async function json(response) {
  return response.json();
}

before(async () => {
  server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();

  assert.ok(address && typeof address === "object");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await prisma.session.deleteMany({
    where: {
      user: {
        email: testEmail,
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      email: testEmail,
    },
  });

  await prisma.$disconnect();

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

test("GET /api/auth/me rejects unauthenticated requests", async () => {
  const response = await request("/api/auth/me");

  assert.equal(response.status, 401);

  const body = await json(response);

  assert.deepEqual(body, {
    error: "Authentication required",
  });
});

test("POST /api/auth/register creates a user and session", async () => {
  const response = await request("/api/auth/register", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      name: testName,
    }),
  });

  assert.equal(response.status, 201);

  const body = await json(response);

  assert.equal(body.user.email, testEmail);
  assert.equal(body.user.name, testName);
  assert.ok(body.user.id);
  assert.ok(body.session.id);

  sessionCookie = getCookie(response);

  assert.match(sessionCookie, /^marnyx_session=/);
});

test("POST /api/auth/register rejects duplicate email", async () => {
  const response = await request("/api/auth/register", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      name: testName,
    }),
  });

  assert.equal(response.status, 409);

  const body = await json(response);

  assert.deepEqual(body, {
    error: "An account with this email already exists",
  });
});

test("POST /api/auth/login rejects invalid credentials", async () => {
  const response = await request("/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: testEmail,
      password: "MARNYX-Wrong-Password-123",
    }),
  });

  assert.equal(response.status, 401);

  const body = await json(response);

  assert.deepEqual(body, {
    error: "Invalid email or password",
  });
});

test("POST /api/auth/login accepts valid credentials", async () => {
  const response = await request("/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });

  assert.equal(response.status, 200);

  const body = await json(response);

  assert.equal(body.user.email, testEmail);
  assert.equal(body.user.name, testName);
  assert.ok(body.session.id);

  sessionCookie = getCookie(response);

  assert.match(sessionCookie, /^marnyx_session=/);
});

test("GET /api/auth/me returns the authenticated user", async () => {
  const response = await request("/api/auth/me", {
    headers: {
      cookie: sessionCookie,
    },
  });

  assert.equal(response.status, 200);

  const body = await json(response);

  assert.equal(body.user.email, testEmail);
  assert.equal(body.user.name, testName);
  assert.ok(body.user.id);
});

test("POST /api/auth/revoke-session revokes the current session", async () => {
  const response = await request("/api/auth/revoke-session", {
    method: "POST",
    headers: {
      cookie: sessionCookie,
    },
  });

  assert.equal(response.status, 204);

  sessionCookie = getCookie(response);

  assert.equal(sessionCookie, "marnyx_session=");
});

test("revoked session can no longer access /me", async () => {
  const response = await request("/api/auth/me", {
    headers: {
      cookie: sessionCookie,
    },
  });

  assert.equal(response.status, 401);

  const body = await json(response);

  assert.deepEqual(body, {
    error: "Authentication required",
  });
});

test("POST /api/auth/logout works without a session", async () => {
  const response = await request("/api/auth/logout", {
    method: "POST",
  });

  assert.equal(response.status, 204);
});

async function resetLimiter(limiter) {
  await limiter.resetKey("127.0.0.1");
}

test("login rate limiter returns 429 after five failed attempts", async () => {
  await resetLimiter(loginRateLimiter);

  const successfulLogin = await request("/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });

  assert.equal(successfulLogin.status, 200);

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await request("/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: testEmail,
        password: "MARNYX-Wrong-Password-123",
      }),
    });

    assert.equal(response.status, 401);
  }

  const limitedResponse = await request("/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: testEmail,
      password: "MARNYX-Wrong-Password-123",
    }),
  });

  assert.equal(limitedResponse.status, 429);
  assert.ok(limitedResponse.headers.get("ratelimit"));
  assert.ok(limitedResponse.headers.get("retry-after"));

  const body = await json(limitedResponse);

  assert.deepEqual(body, {
    error: "Too many authentication attempts, please try again later",
  });
});

test("register rate limiter returns 429 after five invalid attempts", async () => {
  await resetLimiter(registerRateLimiter);

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await request("/api/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "not-an-email",
        password: "short",
      }),
    });

    assert.equal(response.status, 400);
  }

  const limitedResponse = await request("/api/auth/register", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: "not-an-email",
      password: "short",
    }),
  });

  assert.equal(limitedResponse.status, 429);
  assert.ok(limitedResponse.headers.get("ratelimit"));
  assert.ok(limitedResponse.headers.get("retry-after"));

  const body = await json(limitedResponse);

  assert.deepEqual(body, {
    error: "Too many authentication attempts, please try again later",
  });
});

test("API responses include security headers", async () => {
  const response = await request("/");

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(
    response.headers.get("cross-origin-opener-policy"),
    "same-origin",
  );
  assert.equal(
    response.headers.get("cross-origin-resource-policy"),
    "same-origin",
  );
});

test("malformed JSON receives a centralized 400 error", async () => {
  const response = await request("/api/auth/register", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: '{"email":"broken",',
  });

  assert.equal(response.status, 400);

  const body = await json(response);

  assert.deepEqual(body, {
    error: "Invalid JSON payload",
  });
});

test("unknown routes return JSON instead of the default HTML error page", async () => {
  const response = await request("/api/this-route-does-not-exist");

  assert.equal(response.status, 404);

  const contentType = response.headers.get("content-type") ?? "";
  assert.match(contentType, /^application\/json/);
});

test("oversized JSON payloads are rejected", async () => {
  const response = await request("/api/auth/register", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: "large-payload@marnyx.local",
      password: "MARNYX-Large-Payload-123",
      name: "x".repeat(120 * 1024),
    }),
  });

  assert.equal(response.status, 413);

  const body = await json(response);

  assert.deepEqual(body, {
    error: "Request failed",
  });
});

test("environment configuration is validated and available", async () => {
  const { ENV } = await import("../dist/config/env.js");

  assert.equal(typeof ENV.DATABASE_URL, "string");
  assert.ok(ENV.DATABASE_URL.length > 0);

  assert.equal(Number.isInteger(ENV.PORT), true);
  assert.ok(ENV.PORT >= 1);
  assert.ok(ENV.PORT <= 65535);

  assert.ok(
    ["development", "test", "production"].includes(ENV.NODE_ENV),
  );
});

test("API responses include a unique request ID", async () => {
  const firstResponse = await request("/");
  const secondResponse = await request("/");

  const firstRequestId = firstResponse.headers.get("x-request-id");
  const secondRequestId = secondResponse.headers.get("x-request-id");

  assert.equal(firstResponse.status, 200);
  assert.equal(secondResponse.status, 200);

  assert.ok(firstRequestId);
  assert.ok(secondRequestId);
  assert.notEqual(firstRequestId, secondRequestId);

  assert.match(
    firstRequestId,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );

  assert.match(
    secondRequestId,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
});

test("error responses also include a request ID", async () => {
  const response = await request("/api/this-route-does-not-exist");

  assert.equal(response.status, 404);

  const requestIdHeader = response.headers.get("x-request-id");

  assert.ok(requestIdHeader);
  assert.match(
    requestIdHeader,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );

  const body = await json(response);

  assert.deepEqual(body, {
    error: "Route not found",
  });
});
