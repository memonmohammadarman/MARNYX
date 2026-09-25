# MARNYX Security Notes

## Dependency audit

Date: 2026-09-26

MARNYX uses Prisma 7.10.0 with PostgreSQL.

The current npm audit reports high-severity findings through Prisma's
configuration/CLI dependency chain, including:

- deepmerge-ts 7.1.5
- mysql2 3.15.3

MARNYX application database access uses PostgreSQL through:

- @prisma/client
- @prisma/adapter-pg
- pg

MARNYX does not use MySQL for application database access.

## Remediation decision

The npm-proposed `npm audit fix --force` action would introduce a
major Prisma downgrade, so it is not being used.

No incompatible dependency overrides are being used.

Prisma 7.10.0 remains pinned for this development milestone.

The audit result must be reviewed again before production deployment
and whenever Prisma is upgraded.

## Security requirements

- Passwords must never be stored in plaintext.
- Passwords will be hashed with Argon2id.
- Raw session tokens will not be stored in PostgreSQL.
- Browser authentication will use HttpOnly cookies.
- Authentication tokens will not be stored in localStorage.
- Production authentication cookies must use Secure.
- Authentication endpoints will receive rate limiting before production.
- Authentication input will be validated with Zod.
- Security-sensitive errors must avoid unnecessary information leakage.
