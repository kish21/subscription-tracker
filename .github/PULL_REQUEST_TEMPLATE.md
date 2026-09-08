## 🎯 Pull Request Overview

### Related Issue(s):
- Closes #[Issue Number]

### 📝 Summary of Changes:
- 

### 📁 Modified Modules & Files:
<!-- Should match the ticket's Target Files. Anything outside that list is either creep or a ticket that needs widening — say which. -->
- `src/...`
- `tests/...`

### 🔒 Verification & Definition of Done:
<!-- Run the project's own gate — the `check` target in the Makefile / package scripts (see STRUCTURE.md) — and paste the command you ran. -->
- [ ] Tests pass — command: `pnpm test`
- [ ] Build / type-check passes — command: `pnpm build && pnpm typecheck`
- [ ] Lint / format passes — command: `pnpm lint`
- [ ] Secret-scan clean (pre-commit hook from `/foundation`)
- [ ] No hardcoded values — new endpoints, keys, thresholds live in config / `.env`
- [ ] Feature doc `docs/features/<feature>.md` matches the code
- [ ] UI changes verified against `DESIGN.md` (`/frontend-audit` 0 errors) — or N/A
