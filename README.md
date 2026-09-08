# Subscription Tracker

See every subscription you pay for, what it costs per month and per year, and what
renews next — from any browser.

No bank login. No server to run. No app store. You type in your subscriptions, and
the dashboard answers the one question that matters: **what am I actually paying for,
and what is about to charge me?**

> **Status: in development (Milestone 1).** The walking skeleton (M0) and authentication
> lifecycle (M1-SLICE-01) are complete and running end-to-end with Postgres. Active work
> is on subscription persistence and domain logic (M1-SLICE-02). See `PRODUCT.md` for
> exact progress against exit criteria.

## Why this exists

Subscription trackers today make you pick one of two bad options: hand a third party
your bank credentials so it can detect charges automatically, or run your own server.
The private, manual trackers that avoid both are iPhone-only.

This is the missing fourth option — manual and private, in a browser, with an ordinary
login.

## What it does

- Add a subscription in under a minute: name, price, billing cycle, category, next
  renewal date
- Total monthly and yearly spend, normalised across billing cycles
- What renews in the next 30 days, soonest first
- Filter by category, and see spend broken down by category
- One account, one currency, your data only

What it deliberately does **not** do: connect to your bank, share accounts with anyone,
negotiate bills, or use AI. Those are recorded non-goals in `PRODUCT.md`, not oversights.

## Running it locally

**You need:** Node 22+, pnpm, Docker (for Postgres), and Python with `pre-commit`
installed if you want the git hooks.

```bash
git clone https://github.com/kish21/subscription-tracker.git
cd subscription-tracker

make setup     # install dependencies, create .env, install git hooks
```

Then open `.env` and replace `BETTER_AUTH_SECRET` with your own value:

```bash
openssl rand -base64 32
```

```bash
make db-up     # start Postgres in Docker
make migrate   # create the database schema
make dev       # http://localhost:3000
```

`make help` lists every task. `make check` runs what a commit needs to pass.

## Configuration

Nothing is hardcoded. Values live in three layers, each overriding the one before:

| Layer | File | What belongs there |
|---|---|---|
| Engine defaults | `src/config/platform.yaml` | Timeouts, pool size, log level, rate limits |
| Product defaults | `src/config/product.yaml` | Categories, currencies, the 30-day window, input limits |
| Environment | `.env` (gitignored) | Secrets, and any per-environment override |

`src/config/loader.ts` reads all three, validates them, and **refuses to start** if
anything required is missing or malformed — a loud failure at boot beats a quiet wrong
value in production. `.env.example` documents every variable; only it is committed.

## Tech

One Next.js app (App Router, React, TypeScript, Tailwind + shadcn/ui) over PostgreSQL,
with Drizzle for typed queries and checked-in SQL migrations, and Better Auth for
email-and-password login with server-side cookie sessions. Everything is open source and
self-hostable; nothing is tied to a particular host.

The reasoning behind each of those choices — and the alternatives rejected — is written
up as seven ADRs in `PRODUCT.md` → Architecture.

## Documentation

| File | What it holds |
|---|---|
| `PRODUCT.md` | The spine: vision, scope, plan, architecture, and build progress |
| `STRUCTURE.md` | What every folder is for, and why |
| `CONTRIBUTING.md` | How to set up, where code goes, how to get a change merged |
| `SECURITY.md` | How to report a vulnerability |
| `docs/features/` | One document per built feature |

## Security

Your subscription data sits behind a password and belongs to your account alone. Every
database call is required to name the owning user, so "forgot the permission check" is
a compile error rather than something a reviewer has to spot. Sessions are httpOnly
cookies, revocable server-side — not tokens sitting in browser storage.

Found a problem? `SECURITY.md` explains how to report it privately.

## License

MIT
