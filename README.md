# Leashly

AI cost control and abuse prevention proxy. Sits between your app and any LLM provider to enforce rate limits, spend caps, and prompt injection protection.

## Setup

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

Open http://localhost:3000

## Environment Variables (.env.local)

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-32-char-random-secret"
NEXTAUTH_URL="http://localhost:3000"
ENCRYPTION_KEY="your-32-char-encryption-key"
```

## Usage

1. Register at /register
2. Add your real API key under API Keys — get a lsh_xxx proxy key back
3. Use the proxy key in your app:

```js
const client = new OpenAI({
  apiKey: "lsh_xxxxxxxxxxxx",
  baseURL: "http://localhost:3000/api/proxy",
});
```

## Features

- Spend caps (daily/weekly/monthly, block or alert)
- Rate limiting (req/min, req/hour, req/day — per account/key/IP)
- Prompt injection filter (20+ patterns, 3 sensitivity levels)
- Full request logs with cost attribution
- Streaming (SSE) support
- AES-256 key encryption at rest
