import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import app from "../dist/app.js";
import { prisma } from "../dist/db/prisma.js";

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
