# JARVIS.md — Adaptive Brain
> Owner: Sumit Sheokand
> Initialized: 2026-04-06
> Last updated: 2026-04-06
> Version: 1
> Total adaptations: 6

---

## 🧠 User Profile
- **Name**: Sumit
- **Communication style**: Direct, Hinglish, gets frustrated fast when things repeat
- **Expertise areas**: Next.js, TypeScript, Supabase, Stripe, full-stack SaaS — don't over-explain basics
- **Preferences**:
  - Short direct answers — no fluff
  - When something is already set/done, trust him on it
  - Read GitHub backup before touching any file
  - Surgical edits — change only what was asked
- **Anti-patterns** (things they dislike):
  - Repeating the same mistake multiple times
  - Over-explaining things he already knows
  - Rewriting whole files when one line change was needed
  - Asking him to do things manually that should be automated

---

## ⚡ Active Rules

### Format & Tone
| ID | Rule | Scope | Added |
|----|------|-------|-------|
| F1 | Hinglish is fine — match his casual tone | wide | 2026-04-06 |
| F2 | Never repeat a mistake twice in the same session | wide | 2026-04-06 |

### Coding
| ID | Rule | Scope | Added |
|----|------|-------|-------|
| C1 | Surgical edits only — never refactor or rewrite beyond exact ask | wide | 2026-04-06 |
| C2 | Before touching any file, verify current content first (read or GitHub clone) | wide | 2026-04-06 |
| C3 | If file might be large/important, clone from GitHub first before editing | wide | 2026-04-06 |
| C4 | Never use Filesystem:write_file on a large existing file without reading it fully first — truncation risk | wide | 2026-04-06 |

### Task Handling
| ID | Rule | Scope | Added |
|----|------|-------|-------|
| T1 | If user says "X is already set/done", trust it — don't re-verify or re-explain | wide | 2026-04-06 |
| T2 | User says something is on Vercel/GitHub/set up = it is. Move on | wide | 2026-04-06 |

---

## 📈 Win Patterns
| ID | Pattern | Domain | Works when | Confirmed |
|----|---------|--------|------------|-----------|
| W1 | Clone GitHub repo before any file fix — saves truncated file disasters | coding | File needs small targeted change | 1x |
| W2 | Read file head first to verify content before full write | coding | Unsure if file is correct | 1x |

---

## 📉 Failure Log
| Date | Situation | Root cause | Rule added |
|------|-----------|------------|------------|
| 2026-04-06 | Changed "noreply" to "no-reply" — took 6+ attempts | Wrote full file without reading first, caused truncation, then repeated same mistake | C1, C2, C3, C4 |
| 2026-04-06 | Told user to manually change things already set on Vercel | Didn't trust user's statement | T1, T2 |
| 2026-04-06 | Added unrequested replyTo field to resend.ts | Went beyond the ask | C1 |

---

## 📝 Session Changelog
| Date | Rules added | Superseded | Notes |
|------|-------------|------------|-------|
| 2026-04-06 | F1,F2,C1,C2,C3,C4,T1,T2 | — | First session — Leashly SaaS dev, mail config fixes |

---
*JARVIS v2 | Auto-updated by Claude | Do not manually edit rule IDs*
