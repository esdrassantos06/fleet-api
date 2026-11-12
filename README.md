# fleet-api

A NestJS and TypeORM backend for a fleet management app. Right now it handles accounts: sign-up, login with email and password, and routes that only answer to a valid JWT.

> [!NOTE]
> This is an early-stage personal project. Authentication and users work; the fleet side of the API doesn't exist yet.

## What's in it

- **Sign-up** validates the body with class-validator (at least 8 characters with a lowercase letter, an uppercase letter, a number and a symbol, max 128) and rejects a duplicate email with `409 Conflict`.
- **Passwords** are hashed with Argon2id and never leave the database: the `passwordHash` column is excluded from queries by default.
- **Login** goes through a Passport local strategy and returns a signed JWT. Protected routes use a Passport JWT strategy behind a `JwtGuard`.
- **Errors** go through two global filters, one for HTTP exceptions and one that turns a PostgreSQL unique violation (`23505`) into a `409` instead of a `500`.
- **Config** comes from environment variables through `@nestjs/config`, and the app refuses to start without `JWT_SECRET` and `JWT_EXPIRES_IN`.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | NestJS 11, TypeScript |
| Database | PostgreSQL 18 through TypeORM |
| Auth | Passport (local and JWT strategies), `@nestjs/jwt`, Argon2 |
| Validation | class-validator, global `ValidationPipe` with whitelisting |
| Testing | Vitest with SWC (for Nest's decorator metadata), Supertest |
| Local infra | Docker Compose for PostgreSQL |

## Getting started

You'll need Node.js 22 or newer and Docker.

```bash
git clone https://github.com/esdrassantos06/fleet-api.git
cd fleet-api
npm install
cp .env.example .env   # then set DB_PASSWORD and JWT_SECRET
docker compose up -d   # starts PostgreSQL on port 5432
npm run start:dev
```

The API listens on `http://localhost:3000` (or `PORT` if you set it). Outside production, TypeORM creates the `users` table on startup through `synchronize`; in production it's turned off.

## Endpoints

| Method | Path | Auth | What it does |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | none | Creates a user from `name`, `email` and `password` and returns it without the hash |
| `POST` | `/auth/login` | email and password | Returns `{ "access_token": "..." }` |
| `GET` | `/auth/profile` | Bearer token | Returns the user id and email from the token |
| `GET` | `/users` | Bearer token | Lists users |

A quick round trip:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana","email":"ana@example.com","password":"Secret123!"}'

curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","password":"Secret123!"}'

curl http://localhost:3000/auth/profile -H "Authorization: Bearer <access_token>"
```

## Environment variables

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `DB_HOST` | no | `localhost` | |
| `DB_PORT` | no | `5432` | |
| `DB_USER` | yes | | Also used by Docker Compose |
| `DB_PASSWORD` | yes | | Also used by Docker Compose |
| `DB_NAME` | yes | | Also used by Docker Compose |
| `JWT_SECRET` | yes | | Use a long random string |
| `JWT_EXPIRES_IN` | yes | | For example `1h` or `15m` |
| `NODE_ENV` | no | | Set to `production` to turn off `synchronize` |
| `PORT` | no | `3000` | |

## Scripts

```bash
npm run start:dev   # watch mode
npm run build       # compile to dist/
npm run start:prod  # run the compiled build
npm run lint        # ESLint with --fix
npm run test        # unit tests
npm run test:watch  # unit tests in watch mode
npm run test:e2e    # end-to-end tests, needs PostgreSQL running
```

## Tests

Unit tests run with Vitest and mock the TypeORM repository and `JwtService`, so they don't need a database. They cover sign-up (duplicate email, Argon2 hashing, no hash in the response), login, the users service, the controllers and the password rules.

The end-to-end test boots the whole app against PostgreSQL and walks through register, login and `/auth/profile`, plus the `409` and `401` cases:

```bash
docker compose up -d
npm run test:e2e
```

CI runs lint, the unit tests and the build on every pull request, and the end-to-end test against a PostgreSQL service container.
