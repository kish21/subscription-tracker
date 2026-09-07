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

_Last updated: 2026-09-07 · Stage: Vision · AI product? no_

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

## Scope             <!-- /scope -->
- **THE core feature (the one thing):**
- **In scope (now):**
- **Deferred (out for now + the trigger that would bring it in):**
- **Non-goals (deliberately never building):**

## Plan              <!-- /plan -->
- **Phases / milestones (core first):**
- **Timeline:**
- **Exit criteria per milestone:**
- **Concern-area coverage (security · ai · observability · DX · testing · infra · docs · product → now/next/later/N-A + trigger):**

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
