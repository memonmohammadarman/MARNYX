# MARNYX Authentication Architecture

## Authentication model

MARNYX uses server-side sessions for browser authentication.

## Passwords

Passwords are never stored directly.

Passwords are hashed using Argon2id.

## Sessions

The browser receives an opaque cryptographically random session token
through an HttpOnly cookie.

Only a cryptographic hash of the session token is stored in PostgreSQL.

## Cookie

Cookie name:

marnyx_session

### Development

- HttpOnly
- SameSite=Lax
- Secure=false

### Production

- HttpOnly
- SameSite=Lax
- Secure=true

## Request flow

Browser
  ↓
Session cookie
  ↓
Authentication middleware
  ↓
Session lookup
  ↓
User lookup
  ↓
Protected route

## Responsibilities

### Auth service

- registration
- login
- logout

### Session service

- create session
- validate session
- revoke session
- expire session

### Auth middleware

- identify the current user
- reject unauthenticated requests

### Validation

Authentication requests are validated with Zod.

## Security principles

- Never store plaintext passwords.
- Never store raw session tokens in PostgreSQL.
- Never put authentication tokens in localStorage.
- Never expose password hashes in API responses.
- Avoid unnecessary account-enumeration information in authentication errors.
- Authentication endpoints will receive rate limiting before production.
- Production authentication cookies must use Secure.
