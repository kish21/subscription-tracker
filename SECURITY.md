# Security Policy

## Reporting a vulnerability

**Please do not open a public issue for a security problem.**

Report it privately through GitHub's
[Report a vulnerability](https://github.com/kish21/subscription-tracker/security/advisories/new)
form, which creates a private advisory only the maintainer can see.

What helps: what you did, what happened, what you expected, and — if you have one — a
minimal reproduction. You do not need a proof-of-concept exploit to file a report.

**Response expectations.** This is a small project maintained by one person. Expect an
acknowledgement within 7 days and an assessment within 14. If a fix is warranted, you
will be told when it ships, and credited in the release notes unless you ask not to be.

## Scope

This project stores personal spending data behind a password. The areas where a bug
matters most:

- **Cross-account data access** — any path where one account can read, edit or delete
  another account's subscriptions. Every data-layer call requires an owning user id
  (ADR-005 in `PRODUCT.md`); a way around that is the highest-severity bug here.
- **Authentication and sessions** — session fixation or forgery, cookie handling,
  password storage, account-deletion completeness.
- **Injection** — SQL injection, or anything crossing a boundary without validation.
- **Secret exposure** — a credential reachable from client-side code, a log line, or
  an error response.

Out of scope: findings that require an already-compromised machine or browser;
volumetric denial of service; missing hardening headers with no demonstrated impact;
reports produced solely by an automated scanner with no verified exploit path.

## What this project does not do

By design, and permanently (see `PRODUCT.md` → Scope → Non-goals):

- It never asks for or stores bank credentials, and does not connect to financial
  accounts.
- It has no shared or multi-user accounts — your data is yours alone.
- It sends no user behaviour to third-party analytics services.

## Supported versions

The `main` branch is the only supported version. Fixes land there.
