## Session Snapshot 2026-03-30

### Active tasks
- None

### Open decisions
- None

### Where we left off
- App renamed from GateAI → Leashly across all source files
- Proxy key prefix changed: `gai_` → `lsh_` (lib/encryption.ts)
- Domain updated: `api.gateai.dev` → `api.leashly.dev` everywhere
- Env vars updated: `GATEAI_KEY` → `LEASHLY_KEY`, `GATEAI_BASE_URL` → `LEASHLY_BASE_URL`
- Docker service/volume renamed: `gateai`/`gateai_data` → `leashly`/`leashly_data`
- package.json name updated to `leashly-app`
- App located at: C:\Users\sumit\OneDrive\Documents\GateAI\gateai-app\
- Dev: npm run dev → http://localhost:3000
- Docker deploy: cp .env.example .env.production && docker compose up -d
- Vercel deploy: vercel --prod + set 3 env vars in dashboard
- Secrets needed: NEXTAUTH_SECRET (openssl rand -base64 32), ENCRYPTION_KEY (openssl rand -hex 16), NEXTAUTH_URL
- Last production build passed with 0 errors, 23 routes
- Proxy endpoint: POST /api/proxy/[...path] — OpenAI SDK compatible, streaming, cost calc, rule engine
- Demo data: POST /api/seed seeds 100 logs + 3 rules + 1 key
