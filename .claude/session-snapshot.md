## Session Snapshot 2026-03-30

### Active tasks
- None

### Open decisions
- None

### Where we left off
- App fully renamed GateAI → Leashly; proxy key prefix `gai_` → `lsh_`; domain `api.leashly.dev`
- README rewritten for production (deploy guides, SDK examples, security notes, project structure)
- GitHub repo: https://github.com/Sumit-Sheokand-ai/leashly.git — pushed
- .env was committed but only contained DATABASE_URL="file:./dev.db" — no real secrets leaked
- Fix pending: `git rm --cached .env && git commit -m "Remove .env from tracking" && git push`
- Real secrets are safe in .env.local which is gitignored
- App located at: C:\Users\sumit\OneDrive\Documents\GateAI\gateai-app\
- Dev: npm run dev → http://localhost:3000
- Vercel deploy: vercel --prod + set NEXTAUTH_SECRET, NEXTAUTH_URL, ENCRYPTION_KEY in dashboard
- Secrets: NEXTAUTH_SECRET (openssl rand -base64 32), ENCRYPTION_KEY (openssl rand -hex 16)
- Last production build passed with 0 errors, 23 routes
