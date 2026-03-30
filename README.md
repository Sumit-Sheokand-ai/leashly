# Leashly

Stop surprise AI bills. Leashly sits between your app and any LLM provider — enforcing spend caps, rate limits, and prompt injection protection with a single line of code.

---

## How it works

Change one environment variable. That's it.

```js
const client = new OpenAI({
  apiKey: process.env.LEASHLY_KEY,       // your lsh_xxx proxy key
  baseURL: 'https://api.leashly.dev/proxy',
});
```

Everything else — billing, rate limiting, injection blocking, logs — happens automatically.

---

## Features

- **Spend caps** — set daily/weekly/monthly limits, block or alert when hit
- **Rate limiting** — per-minute and per-hour throttling per key or IP
- **Prompt injection shield** — blocks jailbreaks and extraction attacks
- **Cost attribution** — every token tracked by model, user, and feature
- **Real-time alerts** — notifications when thresholds are breached
- **Full audit logs** — searchable request history with CSV export
- **Works with OpenAI, Anthropic, Gemini** — and any OpenAI-compatible API
- **Streaming support** — transparent SSE passthrough

---

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Sumit-Sheokand-ai/leashly)

Set these environment variables in your Vercel dashboard:

| Variable | How to generate |
|---|---|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your app URL, e.g. `https://leashly.vercel.app` |
| `ENCRYPTION_KEY` | `openssl rand -hex 16` |
| `DATABASE_URL` | `file:./data/prod.db` |

---

## Deploy with Docker

```bash
git clone https://github.com/Sumit-Sheokand-ai/leashly.git
cd leashly
cp .env.example .env.production
# fill in .env.production with your real secrets
docker compose up -d
```

---

## Supported providers

| Provider | SDK compatible |
|---|---|
| OpenAI | Yes |
| Anthropic | Yes |
| Google Gemini | Yes |
| Any OpenAI-compatible API | Yes |

---

## Security

- API keys encrypted at rest with AES-256-CBC
- Brute-force protection on login (10 attempts → 30-min lockout)
- Timing-safe auth (no email enumeration)
- Secure httpOnly session cookies
- CSP, HSTS, X-Frame-Options headers enforced

---

## License

MIT
