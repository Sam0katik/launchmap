# Local setup — running Claude Code on this repo

Written 2026-09-13, when work moved from the cloud session to Claude Code on
the operator's own machine (Windows). The cloud session could not reach
`api.supabase.com`, `api.vercel.com` or the Postgres port, so migrations, env
vars and payment tests all had to be done by hand. Locally none of that applies.

## One-time setup

1. **Node 20+** and **git**. On Windows, WSL (Ubuntu) is the smoother path;
   native Windows works too.
2. **Claude Code**: `npm install -g @anthropic-ai/claude-code`, then `claude`
   in the repo folder and sign in.
3. **Clone**: `git clone https://github.com/Sam0katik/launchmap.git` →
   `cd launchmap` → `npm install`.
4. **`.env.local`**: copy `.env.example` and fill it. Where each value lives:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `SUPABASE_SERVICE_ROLE_KEY` — Supabase → Project Settings → API.
   - `ANTHROPIC_API_KEY` — console.anthropic.com.
   - `APIFY_TOKEN` — Apify → Settings → Integrations.
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — from @BotFather / getUpdates.
   - `ADMIN_USER_IDS` — the operator's Supabase auth user id.
   - `PLATEGA_*` — only once the merchant account exists.
   - `NEXT_PUBLIC_SITE_URL=http://localhost:3000` for local runs.
   **`.env.local` is gitignored — never commit it, never paste keys in chat.**
5. `npm run dev` → http://localhost:3000.

⚠️ Local dev points at the **production** Supabase project. Anything you click
locally writes real rows. For risky work, create a second Supabase project, run
`supabase/migrations/*.sql` in order, and point `.env.local` at it.

## Tools worth installing for the payment phase

- **Vercel CLI** (`npm i -g vercel`, then `vercel link`): `vercel env add`,
  `vercel logs --follow` — the logs are what make webhook debugging possible.
- **psql** (or the Supabase SQL editor): run migrations without copy-paste.

## Working agreement (carried over from the cloud session)

- **Work directly on `main`; every commit ships** (operator's call, 2026-09-13 —
  no feature branches, no "shall I deploy?" question). `main` auto-deploys to
  production, so the safety net is the build, not a review step: `npm run build`
  (plus `npm run typecheck` on type changes) must pass **before** every push,
  money and auth paths included.
- `CLAUDE.md` rules still apply: verify with `npm run build` / `npm run
  typecheck` before claiming a change works; never invent community data; all
  `profiles`/`runs` money writes stay in service-role server routes.
- Update [[Journal]], [[Changelog]] and [[Open Questions & Next Steps]] at the
  end of each batch — that is what makes a fresh session pick up instantly.

## First prompt for the new session

> Read brain/README.md and follow its index, then tell me the current state and
> what's blocking. Don't change anything yet.

## Where the work stands

See [[Open Questions & Next Steps]]. Short version: migrations 0016-0019 are
applied; Platega is written but switched off; the Reddit ToS decision (A/B) is
the one real blocker before taking money.
