<!--
PRODUCT.md — the living spine of this product.

This single file is the shared memory of the product-playbook skills. Each skill
READS the sections it depends on and APPENDS/UPDATES its own. Read it top-to-bottom
to understand the whole product: what it is, why, what's built, and what's next.

Rules:
- A section that is empty/missing = that phase's exit criteria are not yet met.
- Keep entries short and honest. Record HOW something was verified, not just "done".
- Anything explicitly OUT OF SCOPE stays out until the recorded trigger fires.
- Every skill, when it writes back, UPDATES the header line below — bump `Stage:` to its phase
  and set `Last updated:` to today.
-->

# PRODUCT — Subscription Tracker

_Last updated: 2026-09-07 · Stage: Plan · AI product? no_

## Vision            <!-- /vision -->
- **Vision sentence:** Anyone can see every subscription they pay for, what it costs per month and year, and what renews next, from any browser, without handing a bank login to a third party or running a server.
- **Who it's for:** An individual with many recurring subscriptions (streaming, software, cloud, gym, news) who loses track of total spend and is surprised by renewals. Uses a laptop as much as a phone.
- **Problem (why now):** Subscription counts per person keep rising and renewals are silent by design. The 2026 tools split into two camps: bank-linked auto-detectors (Rocket Money) that require sharing financial credentials and are US-centric, and private manual trackers (Bobby, Subby) that are iOS-only with no web version. The open-source web option (Wallos) requires self-hosting. There is no private, manual tracker that works in any browser with a normal login.
- **Value proposition:** A private, manual subscription tracker that runs in any browser with a normal account login. No bank linking, no self-hosting, no app store. Adding a subscription takes under a minute; the dashboard answers "what do I pay per month and per year, and what renews next" at a glance.
- **2026 market / competitor read (verified 2026-09-07 via web search, not from memory):**
  - Rocket Money: bank-linked auto-detection, cancellation and bill negotiation; paid; requires financial account access. (rocketmoney.com, cnbc.com/select/best-subscription-trackers)
  - Bobby: manual, privacy-first, iOS-only, no web. (subtracker.io/best/best-subscription-tracker-apps)
  - Subby: manual, iOS-only, iCloud sync, widgets, no data collection. (getfinny.app/blog/best-subscription-tracker-apps-2026)
  - Wallos: open-source self-hosted PHP + SQLite web app; multi-currency, notifications, household sharing; needs your own server or Docker host. (github.com/ellite/Wallos, subvault.io/blog/open-source-subscription-tracker)
  - Sharpening insight: the manual/private camp is phone-only and the web camp is self-host-only. The gap is "manual + private + browser + hosted login".
- **North-star success metric (how we'll know it works):** Weekly active users who log in and view the upcoming-renewals section. Instrumented as a server-side event when the renewals view is rendered for an authenticated user.
- **Job-to-be-done:** When a renewal hits my card unexpectedly, I want to see everything I pay for in one place with amounts and dates, so I can decide what to cancel before the next charge.
- **Riskiest assumption this depends on:** People will keep entering and updating subscriptions manually. Bank-linked apps exist because manual entry lapses. This holds only if adding a subscription is fast (under a minute) and the renewals view is useful enough to return to weekly.
- **Business model (free / paid / internal):** Free. No paid tier planned; no AI/LLM features.

## Validation        <!-- /validate --> (test the riskiest assumption BEFORE code; append a dated entry per run)
- **Assumption under test (falsifiable: <user> will <behaviour> because <reason>):**
- **Experiment (type · who it reaches · time box · due date):**
- **Pass/fail threshold (written BEFORE the result):**
- **Measured result (number / quoted evidence · date · raw notes in docs/validation/):**
- **Verdict (proceed / pivot / kill) + one-line reason:**
- **Override (only if skipped: date · reason · "assumption untested"):**

## Scope             <!-- /scope -->
- **THE core feature (the one thing):** The subscriptions dashboard: one screen listing every subscription with cost and next renewal date, showing total monthly and yearly spend and what renews in the next 30 days. Everything else feeds this screen.
- **In scope (now):**
  - Account creation and login (email + password) → my data is private and mine. Prerequisite for the north-star "logged-in weekly user".
  - Add / edit / delete a subscription with name, price, billing cycle, category, next renewal date → I can record a subscription in under a minute. Feeds the dashboard.
  - Total monthly and yearly spend, normalised across billing cycles → I know what all this costs me. The reason to look.
  - Upcoming renewals (next 30 days, soonest first) → I see what is about to charge me. Rendering this for a logged-in user IS the north-star event.
  - Filter subscriptions by category, and spend broken down by category → I can find the fat to cut. Drives the cancel decision in the job-to-be-done.
  - One currency per account, chosen at signup → totals are simple and correct.
- **Deferred (out for now + the trigger that would bring it in):**
  - Renewal reminders by email/push — trigger: weekly active users flatten or drop because people forget to open the app.
  - Multi-currency with exchange rates — trigger: a real user needs subscriptions in two currencies on one account.
  - Native iOS/Android app — trigger: responsive web measurably fails on phones (bounce or complaints), after the web app has weekly active users.
  - Mark-as-cancelled with savings total — trigger: users ask "how much have I saved", or the north star needs a second metric.
  - Price history per subscription — trigger: users report editing prices often and losing the old value.
  - CSV export / import — trigger: a user asks to migrate from Wallos, Bobby, a spreadsheet, or leave.
  - Dark mode — trigger: first user request; cheap once the design tokens exist.
  - Admin panel / usage analytics dashboard — trigger: more than one operator, or the north star cannot be read from logs.
  - Paid tier — trigger: hosting cost exceeds what the owner will absorb, or users ask to pay.
- **Non-goals (deliberately never building):**
  - Bank linking / automatic charge detection — contradicts the vision's "no bank login to a third party" promise.
  - Household / shared / multi-user accounts — single-user product; sharing is a different product.
  - AI / LLM features — no AI product; keeps the security surface small.
  - Bill negotiation or cancelling on the user's behalf — Rocket Money's territory, not a private tracker's.

## Plan              <!-- /plan -->
- **Phases / milestones (core first):**
  - **M0 — Walking skeleton.** Repo structure, config from `.env`, structured logging, DB with migrations, one health endpoint, one placeholder page, CI running lint + secret-scan + tests, pre-commit. Produced by /structure, /design-system, /foundation, /contracts.
  - **M1 — Core slice: "I can see what I pay."** Sign up, log in, add a subscription (name, price, cycle, category, renewal date, account currency set at signup), and the dashboard shows it with total monthly and yearly spend and the next-30-days renewals list. Thin end-to-end vertical, not layers. Includes the north-star event.
  - **M2 — Manage and cut: full CRUD + categories.** Edit and delete a subscription, filter the list by category, spend broken down by category. Completes every in-scope item.
  - **M3 — Real users can use it.** Deployed on a public HTTPS URL with the production bootstrap (migrations run, secrets from the host's env, error reporter live), README for users and developers, account deletion so a user can leave, and the north-star metric readable from logs.
- **Timeline (relative; one subtask per session):**
  - M0: ~3 sessions (structure+design · foundation · contracts).
  - M1: ~4 sessions (auth · subscription create · dashboard totals + renewals · north-star event + E2E).
  - M2: ~3 sessions (edit/delete · category filter · category breakdown).
  - M3: ~2 sessions (deploy + account deletion · docs + release).
  - Paid infra: none planned. Hosting uses a free tier; trigger to pay = free tier limits hit by real usage, recorded in Scope#Deferred (paid tier).
- **Exit criteria per milestone (observable, testable):**
  - **M0 done when:** `make ci` (or the equivalent) passes locally and in GitHub Actions on a clean clone; the app starts from `.env.example` values and `GET /health` returns 200 with the DB migrated; a secret-scan and dependency-vuln scan run in CI; a commit with a fake secret is rejected by pre-commit.
  - **M1 done when:** an automated end-to-end test signs up user A, logs in, adds one monthly and one yearly subscription, and the dashboard shows the correct monthly total, yearly total and both renewals in date order; the same test signs up user B and proves B sees none of A's rows and gets 404/403 on A's subscription id; the renewals view emits one structured north-star event per render with the user id and no subscription content; a subscription can be added in under 60 seconds by hand.
  - **M2 done when:** the E2E test edits a price and the totals change accordingly; deletes a subscription and it vanishes from list, totals and renewals; filters by one category and only that category's rows appear; the category breakdown sums equal the monthly total; every write path checks ownership and the authz test proves user B cannot edit or delete A's row.
  - **M3 done when:** a fresh browser on the public URL can sign up, add a subscription, log out, log back in and still see it; HTTPS only, secure httpOnly session cookie, rate-limited signup/login verified by a scripted burst; account deletion removes the user and all their rows (verified by a DB query); README lets a new developer run it locally in under 15 minutes; the north-star count for the last 7 days can be read from logs with one documented command.
- **Concern-area coverage (security · ai · observability · DX · testing · infra · docs · product → now/next/later/N-A + trigger):**
  - **security — NOW (M1):** per-user ownership check on every data path; cookie-based session auth (httpOnly, secure, SameSite), never localStorage tokens; password hashing with a current KDF; input validation at the API boundary; secret-scan + dependency-vuln scan in CI (M0); rate limit on signup/login (M3); CORS locked to the app origin. Data deletion / leave-able account: **NEXT (M3)**, trigger: before the public URL is shared with anyone.
  - **ai-specific — N/A.** No LLM in the product (Vision). Trigger to revisit: an AI feature is reopened via the Non-goal reversal protocol.
  - **observability — NOW (M0/M1):** structured JSON logging with request id; north-star event emitted server-side (M1); error reporter stub in M0, real one at M3. Dashboards/alerting: **LATER**, trigger: first 10 weekly active users or first production incident. Cost-per-run: N/A, no metered externals.
  - **developer-experience — NOW (M0):** README, task runner (Makefile), `.env.example`, pre-commit. OpenAPI docs: NOW if the backend framework gives them for free, else NEXT. CHANGELOG + CONTRIBUTING: **NEXT (M3)**, trigger: first release tag.
  - **testing — NOW (M1):** unit for cycle-normalisation and totals maths; integration for auth + CRUD against a real DB; E2E for the M1/M2 criteria; adversarial authz cases (user B vs A). Golden dataset: a fixed seed of subscriptions with known totals, checked in. Deterministic, run in CI, red blocks merge.
  - **infra — NOW (M0):** CI mirroring the prod bootstrap; schema only via migrations; containerised app; branch protection on `main` once CI exists. Backup/restore: **LATER**, trigger: first real user other than the owner.
  - **documentation — NOW (M0) and per feature:** PRODUCT.md, STRUCTURE.md, DESIGN.md, ADRs from /architect, one doc per feature in docs/features/. Ops runbook: **NEXT (M3)**, trigger: first deploy.
  - **product — NOW:** vision, scope, north star, riskiest assumption, business model all recorded above. Roadmap = this section. Riskiest-assumption check is scheduled at /learn after M3: are people re-entering data weekly?

## Architecture      <!-- /architect -->
- **Stack + tools (and why, 2026 OSS-first):**
- **Key decisions / ADRs (patterns applied · anti-patterns avoided):**
- **Externals behind provider/adapter interfaces (+ resilience strategy each):**
- **Resilience · perf/cost budget · migrations approach:**
- **(AI) prompt-versioning · eval harness · tracing:**

## Structure         <!-- /structure --> (see STRUCTURE.md for the full folder map)
- **Folder → purpose map (summary):**
- **Prompts location (AI):** `app/prompts/` (backend sub-package; YAML, never inline)

## Design             <!-- /design-system --> (UI products only; see DESIGN.md for the full system)
- **Has user-facing UI?** <yes/no — if no, this phase is skipped intentionally>
- **Design principles (4–6, derived from vision):**
- **Archetype (aesthetic family + why it fits):**
- **Foundations summary (font pairing · base body size + type scale · one accent + palette · density · depth · motion):**
- **Tokens:** shadcn/ui-compatible CSS variables (OKLCH), WCAG-AA verified — see `DESIGN.md`
- **Approved sample page (path):** · **DESIGN.md (path):**

## Foundation        <!-- /foundation -->
- **Runs end-to-end (walking skeleton):**
- **Config flows verified (no dead config):**
- **Fail-loud/fail-closed guards · secret-scan + dependency-vuln scan · CI mirrors prod:**
- **pre-commit + CI auto-run (lint/format/secret-scan/tests) · runs in its container · async-safe:**
- **Observability wired (tracing / error-reporter, even a stub):**

## Contracts         <!-- /contracts -->
- **Typed models / schemas / migrations:**
- **Boundary units/scale agreed:**
- **Contract versioning / back-compat approach:**
- **PII/sensitive fields classified · tenant-owner key · idempotency/natural key:**

## Build log         <!-- /build --> (one entry per feature; see docs/features/*)
| Feature | DoD (incl. security) met? | How verified | Doc |
|---|---|---|---|

## Dev-complete      <!-- /dev-check -->
- [ ] Every core-scope feature built & runs
- [ ] Exit criteria + security DoD verified (with evidence)
- [ ] No hardcoding · prompts externalized · contracts typed · builds green
- [ ] Scope re-check — nothing crept in

## Tests             <!-- /test -->
- **Unit / integration / regression coverage (critical path accounted for):**
- **Adversarial/security (prompt-injection, authz) cases:**
- **Live-path verified (not just isolated units):**
- **Golden/eval dataset location · tests deterministic · run in CI (red blocks merge):**

## Evaluation        <!-- /eval -->
- **Is it good? (measured vs a recorded baseline; regression fails):**
- **Metrics + confidence score:**
- **Cost-per-run · (AI) scoring-bias:**
- **Operational failures (separated from quality):**

## Ship log          <!-- /ship -->
| Date | What shipped | Review + /security-review | Docs reconciled | CHANGELOG | Rollback / flag | PR |
|---|---|---|---|---|---|---|

## Learnings         <!-- /learn -->
- **Success metric + result (instrumented, not guessed):**
- **User/usage signal incorporated:**
- **Retro (what worked / what to change):**
- **Decided next — build / iterate / KILL (from evidence):**
- **Observability + cost watch in place:**

## Drift log         <!-- /drift-check (run anytime) -->
| Date | Drift found (scope/vision/plan/docs) | Recommendation (cut / re-scope+trigger / fix) |
|---|---|---|
