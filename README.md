# URL Shortener API

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=flat&logo=swagger&logoColor=black)
![Jest](https://img.shields.io/badge/Jest-C21325?style=flat&logo=jest&logoColor=white)

> Shorten URLs, track analytics, cache with Redis. Built with NestJS.

🚀 **Live:** https://url-shortener-api-production-cae4.up.railway.app
📖 **API Docs:** https://url-shortener-api-production-cae4.up.railway.app/api/docs

---

## Features

- Shorten any URL with an auto-generated or custom code
- Redis caching for sub-millisecond redirects
- JWT authentication (access + refresh tokens)
- Click analytics with per-day breakdown and top user agents
- Rate limiting with `@nestjs/throttler`
- Automatic expiry + nightly cleanup cron job
- Full Swagger docs at `/api/docs`

## Tech Stack

| Layer     | Technology           |
|-----------|----------------------|
| Framework | NestJS               |
| Database  | PostgreSQL (TypeORM) |
| Cache     | Redis (ioredis)      |
| Auth      | JWT (passport-jwt)   |
| Docs      | Swagger / OpenAPI    |
| Tests     | Jest                 |

## Architecture

```
Client
  │
  ├─ POST /urls          → UrlsService.shorten()  → Postgres
  │
  ├─ GET /:code          → Redis cache hit?
  │       ├─ HIT  → 301 redirect
  │       └─ MISS → Postgres → cache → 301 redirect
  │                        └──> AnalyticsService.recordClick() (fire-and-forget)
  │
  ├─ POST /auth/*        → AuthService → JWT tokens
  │
  └─ GET /analytics/:code → ClickEvent aggregation from Postgres
```

## Quick Start

1. **Clone and install**
   ```bash
   git clone https://github.com/GITHUB_USERNAME/url-shortener.git
   cd url-shortener
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Start infrastructure**
   ```bash
   docker compose up -d
   ```

4. **Run the server**
   ```bash
   npm run start:dev
   ```

5. **Open API docs**
   Visit [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

## API Endpoints

| Method | Path                | Auth     | Description                    |
|--------|---------------------|----------|--------------------------------|
| POST   | /auth/register      | None     | Register a new user            |
| POST   | /auth/login         | None     | Login, receive JWT tokens      |
| POST   | /auth/refresh       | None     | Refresh access token           |
| POST   | /urls               | Optional | Shorten a URL                  |
| GET    | /urls/my            | Required | List my shortened URLs         |
| DELETE | /urls/:code         | Required | Delete a shortened URL         |
| GET    | /:code              | None     | Redirect to original URL       |
| GET    | /analytics/:code    | Required | Click analytics for a URL      |

## Environment Variables

| Variable                  | Description                    | Default               |
|---------------------------|--------------------------------|-----------------------|
| `PORT`                    | Server port                    | `3000`                |
| `APP_URL`                 | Base URL for short links       | `http://localhost:3000` |
| `DB_HOST`                 | Postgres host                  | `localhost`           |
| `DB_PORT`                 | Postgres port                  | `5432`                |
| `DB_USERNAME`             | Postgres user                  | `postgres`            |
| `DB_PASSWORD`             | Postgres password              | `postgres`            |
| `DB_DATABASE`             | Postgres database name         | `url_shortener`       |
| `REDIS_HOST`              | Redis host                     | `localhost`           |
| `REDIS_PORT`              | Redis port                     | `6379`                |
| `JWT_SECRET`              | JWT signing secret             | —                     |
| `JWT_EXPIRES_IN`          | Access token TTL               | `15m`                 |
| `JWT_REFRESH_SECRET`      | Refresh token secret           | —                     |
| `JWT_REFRESH_EXPIRES_IN`  | Refresh token TTL              | `7d`                  |
| `THROTTLE_TTL`            | Rate limit window (seconds)    | `60`                  |
| `THROTTLE_LIMIT`          | Max requests per window        | `100`                 |

## Running Tests

```bash
npm run test        # unit tests
npm run test:cov    # with coverage
```

## License

MIT
