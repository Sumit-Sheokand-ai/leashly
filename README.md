# Leashly

**AI cost control and abuse prevention proxy.** Sits between your app and any LLM provider to enforce spend caps, rate limits, and prompt injection protection — with zero code changes to your existing SDK usage.

---

## What it does

- **Spend caps** — daily/weekly/monthly limits per key or user, block or alert when hit
- **Rate limiting** — per-minute/hour/day throttling with token bucket algorithm
- **Prompt injection shield** — blocks 50+ known jailbreak and extraction patterns
- **Cost attribution** — every token and dollar tracked by model, key, and user
- **Real-time alerts** — in-app notifications on threshold breaches
- **Full audit logs** — paginated request history with CSV export
- **Streaming support** — transparent SSE passthrough
- **AES-256 encryption** — real API keys encrypted at rest, never exposed

---

## Quick start (local)

```bash
git clone https://github.com/Sumit-Sheokand-ai/leashly.git
cd leashly
npm install
cp .env.example .env.local
# fill in .env.local (see below)
npx prisma migrate dev --name init
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment variables

```bash
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
ENCRYPTION_KEY="$(openssl rand -hex 16)"
```

For production, set `NEXTAUTH_URL` to your public domain.

---

## Usage

1. Register at `/register`
2. Go to **API Keys** → Add Key — paste your real OpenAI/Anthropic/Gemini key
3. Copy the generated `lsh_xxx` proxy key
4. Point your SDK at Leashly:

```js
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.LEASHLY_KEY,   // your lsh_xxx proxy key
  baseURL: 'https://api.leashly.dev/proxy',
});
```

```python
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["LEASHLY_KEY"],
    base_url="https://api.leashly.dev/proxy",
)
```

```bash
curl https://api.leashly.dev/proxy/chat/completions \
  -H "Authorization: Bearer $LEASHLY_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o", "messages": [{"role": "user", "content": "Hello!"}]}'
```

---

## Deploy

### Vercel (recommended)

```bash
npm i -g vercel
vercel --prod
```

Set these environment variables in the Vercel dashboard:

| Variable | Value |
|---|---|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-domain.com` |
| `ENCRYPTION_KEY` | `openssl rand -hex 16` |

> **Note:** Vercel's filesystem is ephemeral — use a persistent SQLite host (Railway, Render) or swap `DATABASE_URL` for a Postgres connection string with `@prisma/adapter-pg`.

### Docker

```bash
cp .env.example .env.production
# edit .env.production with real secrets
docker compose up -d
```

The SQLite database is persisted in a Docker volume (`leashly_data`). To back it up:

```bash
docker compose exec leashly cp /app/data/prod.db /app/data/prod.db.bak
```

### Railway / Render / Fly.io

Deploy as a standard Node.js app. Set the four environment variables and run:

```bash
npm run db:migrate   # runs prisma migrate deploy
npm start
```

---

## Tech stack

- **Next.js 14** (App Router, TypeScript)
- **Prisma v5** + SQLite
- **NextAuth.js v4** — JWT sessions, secure httpOnly cookies
- **Recharts** — dashboard analytics
- **Tailwind CSS v3** — dark theme design system

---

## Security

- Brute-force protection: 10 failed logins → 30-minute lockout
- Timing-safe password checks (no email enumeration)
- CSP, HSTS, X-Frame-Options, X-Content-Type-Options headers
- All API keys encrypted with AES-256-CBC before storage
- Auth middleware protects all dashboard and API routes

---

## Project structure

```
app/
  (auth)/          # login, register
  (dashboard)/     # dashboard, keys, rules, logs, alerts
  (marketing)/     # landing page
  api/
    proxy/[...path] # main proxy endpoint
    keys/           # key CRUD
    rules/          # rule CRUD
    logs/           # log queries
    alerts/         # alert CRUD
    stats/          # dashboard aggregations
    seed/           # demo data
lib/
  auth.ts           # NextAuth config
  encryption.ts     # AES-256 encrypt/decrypt, key generation
  rate-limit.ts     # token bucket + DB-backed hourly/daily checks
  injection-filter.ts # prompt injection detection
  cost.ts           # per-model cost calculation
prisma/
  schema.prisma     # User, ApiKey, Rule, RequestLog, Alert, Notification
```

---

## License

MIT
