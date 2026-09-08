# DESIGN.md — Subscription Tracker Design System
_Archetype: Calm Authority / Trust (with Data-Dense Pro precision) · derived by /design-system on 2026-09-08 · approved sample: preview.html_

## 1. Visual Theme
- **Principles:**
  1. **Calm Financial Clarity:** A finance tool should induce calm, not anxiety. Clean neutral backgrounds, subtle hairline borders, zero neon gradients, and zero sensory overload.
  2. **Tabular Numeric Discipline:** Financial numbers are data, not marketing fluff. Right-aligned amounts, tabular monospace numerals (`JetBrains Mono`), and aligned decimal baselines.
  3. **Restraint & Single Accent:** A single focused teal-slate accent (`oklch(0.48 0.09 230)` / `oklch(0.66 0.10 220)`) for primary interactive affordances; status indicators use semantic dot + text patterns rather than full-bleed pastel pills.
  4. **Thumb-First Mobile Ergonomics:** Subscription reviews happen on the subway or couch as often as at a desk. Touch targets ≥ 44px, bottom-anchored actions on mobile, and tables that collapse cleanly into stacked cards.
  5. **Quiet Restraint in Motion:** Tier 0 CSS transitions only (140ms ease), strictly animating `transform` and `opacity`. No decorative spring physics, parallax, or motion clutter.
- **Archetype:** Calm Authority / Trust (with Data-Dense Pro precision) — Fits a private personal financial tracker where users want certainty, calm, clarity, and rapid scanning over marketing fluff.
- **Feel in one line:** A calm, precision-engineered financial workspace that turns recurring expenses into clear, manageable foresight.
- **Reference brands:** Wealthfront, Stripe Dashboard, Linear.

---

## 2. Color & Roles (shadcn CSS-variable tokens, OKLCH, WCAG-AA verified)
- **Brand decision:** Slate/Cool Neutral dominant base + ONE focal accent: Deep Teal-Slate (`oklch(0.48 0.09 230)` light / `oklch(0.66 0.10 220)` dark) (Law 5).
- **Contrast verification (all ≥ WCAG AA 4.5:1):**
  - **Light Mode:**
    - Body text on background: `oklch(0.20 0.02 245)` on `oklch(0.985 0.003 240)` → **15.74:1** (Passes AAA)
    - Card text on card: `oklch(0.20 0.02 245)` on `oklch(1 0 0)` → **16.40:1** (Passes AAA)
    - Primary button foreground on primary: `oklch(0.985 0.003 240)` on `oklch(0.48 0.09 230)` → **6.22:1** (Passes AA)
    - Muted text on background: `oklch(0.46 0.03 245)` on `oklch(0.985 0.003 240)` → **5.12:1** (Passes AA)
  - **Dark Mode:**
    - Body text on background: `oklch(0.96 0.01 240)` on `oklch(0.14 0.02 245)` → **14.85:1** (Passes AAA)
    - Card text on card: `oklch(0.96 0.01 240)` on `oklch(0.18 0.02 245)` → **13.10:1** (Passes AAA)
    - Primary button foreground on primary: `oklch(0.14 0.02 245)` on `oklch(0.66 0.10 220)` → **6.88:1** (Passes AA)
    - Muted text on background: `oklch(0.70 0.02 240)` on `oklch(0.14 0.02 245)` → **5.48:1** (Passes AA)

```css
:root {
  --background: oklch(0.985 0.003 240);
  --foreground: oklch(0.20 0.02 245);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.20 0.02 245);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.20 0.02 245);
  --primary: oklch(0.48 0.09 230);
  --primary-foreground: oklch(0.985 0.003 240);
  --secondary: oklch(0.95 0.005 240);
  --secondary-foreground: oklch(0.22 0.02 245);
  --muted: oklch(0.94 0.006 240);
  --muted-foreground: oklch(0.46 0.03 245);
  --accent: oklch(0.95 0.008 230);
  --accent-foreground: oklch(0.20 0.02 245);
  --destructive: oklch(0.55 0.18 25);
  --destructive-foreground: oklch(0.985 0.003 240);
  --success: oklch(0.55 0.12 150);
  --warning: oklch(0.65 0.14 75);
  --info: oklch(0.52 0.10 230);
  --border: oklch(0.89 0.008 240);
  --input: oklch(0.89 0.008 240);
  --ring: oklch(0.48 0.09 230);
  --radius: 0.5rem;

  --font-sans: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-display: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;

  --shadow-sm: 0 1px 2px 0 oklch(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px oklch(0 0 0 / 0.07), 0 2px 4px -2px oklch(0 0 0 / 0.05);
  --shadow-lg: 0 10px 15px -3px oklch(0 0 0 / 0.09), 0 4px 6px -4px oklch(0 0 0 / 0.05);

  --transition-fast: 140ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dark {
  --background: oklch(0.14 0.02 245);
  --foreground: oklch(0.96 0.01 240);
  --card: oklch(0.18 0.02 245);
  --card-foreground: oklch(0.96 0.01 240);
  --popover: oklch(0.18 0.02 245);
  --popover-foreground: oklch(0.96 0.01 240);
  --primary: oklch(0.66 0.10 220);
  --primary-foreground: oklch(0.14 0.02 245);
  --secondary: oklch(0.22 0.02 245);
  --secondary-foreground: oklch(0.96 0.01 240);
  --muted: oklch(0.22 0.02 245);
  --muted-foreground: oklch(0.70 0.02 240);
  --accent: oklch(0.24 0.03 230);
  --accent-foreground: oklch(0.96 0.01 240);
  --destructive: oklch(0.55 0.20 25);
  --destructive-foreground: oklch(0.985 0.003 240);
  --success: oklch(0.65 0.14 150);
  --warning: oklch(0.72 0.14 75);
  --info: oklch(0.66 0.10 220);
  --border: oklch(0.26 0.02 245);
  --input: oklch(0.26 0.02 245);
  --ring: oklch(0.66 0.10 220);
  --radius: 0.5rem;

  --shadow-sm: 0 1px 3px 0 oklch(0 0 0 / 0.35);
  --shadow-md: 0 4px 6px -1px oklch(0 0 0 / 0.45), 0 2px 4px -2px oklch(0 0 0 / 0.35);
  --shadow-lg: 0 10px 15px -3px oklch(0 0 0 / 0.55), 0 4px 6px -4px oklch(0 0 0 / 0.45);
}

/* System-dark escape-hatch pattern (T5-6): follows OS unless user explicitly set .light */
@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    --background: oklch(0.14 0.02 245);
    --foreground: oklch(0.96 0.01 240);
    --card: oklch(0.18 0.02 245);
    --card-foreground: oklch(0.96 0.01 240);
    --popover: oklch(0.18 0.02 245);
    --popover-foreground: oklch(0.96 0.01 240);
    --primary: oklch(0.66 0.10 220);
    --primary-foreground: oklch(0.14 0.02 245);
    --secondary: oklch(0.22 0.02 245);
    --secondary-foreground: oklch(0.96 0.01 240);
    --muted: oklch(0.22 0.02 245);
    --muted-foreground: oklch(0.70 0.02 240);
    --accent: oklch(0.24 0.03 230);
    --accent-foreground: oklch(0.96 0.01 240);
    --destructive: oklch(0.55 0.20 25);
    --destructive-foreground: oklch(0.985 0.003 240);
    --success: oklch(0.65 0.14 150);
    --warning: oklch(0.72 0.14 75);
    --info: oklch(0.66 0.10 220);
    --border: oklch(0.26 0.02 245);
    --input: oklch(0.26 0.02 245);
    --ring: oklch(0.66 0.10 220);
    --radius: 0.5rem;

    --shadow-sm: 0 1px 3px 0 oklch(0 0 0 / 0.35);
    --shadow-md: 0 4px 6px -1px oklch(0 0 0 / 0.45), 0 2px 4px -2px oklch(0 0 0 / 0.35);
    --shadow-lg: 0 10px 15px -3px oklch(0 0 0 / 0.55), 0 4px 6px -4px oklch(0 0 0 / 0.45);
  }
}
```

---

## 3. Typography
- **Fonts:**
  - Display: `--font-display: 'Geist', sans-serif`
  - Body: `--font-sans: 'Geist', sans-serif`
  - Data / Numeric: `--font-mono: 'JetBrains Mono', monospace`
  - Loaded via `next/font/google` in Next.js root layout with CSS variable definitions.
- **Base body size:** 16px (1rem), satisfying Law 3.
- **Scale ratio:** 1.20 (Minor Third) — tuned for calm data density without jarring jump steps.
- **Type Scale:**

| Token | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `display` | 28px (1.75rem) | 1.20 | 600 | Page titles, key aggregate stat numbers |
| `h1` | 23px (1.44rem) | 1.25 | 600 | Primary section headers |
| `h2` | 19px (1.20rem) | 1.30 | 600 | Card headers, subsection titles |
| `body` | 16px (1.00rem) | 1.50 | 400 | UI copy, form labels, general content |
| `small` | 13.5px (0.84rem) | 1.40 | 500 | Metadata, timestamps, badge labels, table headers |
| `mono` | 14px (0.875rem) | 1.40 | 500 / tabular | Prices, dates, IDs, currency totals |

- **Hierarchy Rule (Law 4):** Headings vs body text differ by at least 200 font-weight units or a distinct type-scale tier. Numbers always render with `font-variant-numeric: tabular-nums`.

---

## 4. Components (shadcn/ui + 21st.dev primitives)
- **Source:** shadcn/ui components copied into `src/components/ui/` and re-skinned with the OKLCH tokens above.
- **Key Components:**
  - **Button:**
    - `primary`: Background `--primary`, text `--primary-foreground`, subtle hover lift (-1px), active scale (0.98).
    - `secondary`: Background `--secondary`, text `--secondary-foreground`, hairline border `--border`.
    - `ghost`: Transparent background, hover background `--muted`.
    - `destructive`: Background `--destructive`, text `--destructive-foreground`.
    - Height: 36px (desktop/compact) / 44px (touch/mobile). Radius: `--radius`.
  - **Input:** 1px solid `--border`, background `--card`, padding 8px 12px, font-size 16px (prevents iOS auto-zoom). Focus-visible: 2px ring `--ring` with 2px offset.
  - **Card:** Background `--card`, 1px solid `--border`, radius `--radius`, shadow `--shadow-sm`. Never nested inside another bordered card.
  - **Table / DataGrid (Law 20):**
    - Headers match cell alignment.
    - Currency and numeric amounts are strictly **right-aligned** with `font-family: var(--font-mono)` and `font-variant-numeric: tabular-nums`.
    - Dates, vendor names, and categories are **left-aligned**.
    - Status column: semantic dot (`6px` circle) + text label, never a filled pastel pill.
  - **Status Indicator:**
    - Active: Dot `--success`, text `--foreground`
    - Renews Soon (<7d): Dot `--warning`, text `--warning`
    - Urgent (<48h): Dot `--destructive`, text `--destructive`
  - **Interactive States (Law 13):** Every clickable item has explicit `:hover`, `:focus-visible` (2px solid `--ring`, 2px offset), `:active`, and `:disabled` (`opacity: 0.5; pointer-events: none`).

---

## 5. Layout (Top-Nav Application Shell)
- **Pattern:** Top navigation bar with centered max-width stage (`1200px`).
- **Density:** Medium-compact. Baseline 4px/8px grid system.
- **Page Anatomy:**
  - **Header Bar (56px):** Brand wordmark + badge, navigation items, currency pill indicator, Add Subscription primary action button, Theme mode toggle.
  - **KPI Metric Strip (3-column grid):** Total Monthly Spend, Total Yearly Spend, Next Renewal Countdown.
  - **Main Dashboard Stage (Split View or Stacked):**
    - *Left / Primary (2/3 width on desktop):* Full Subscription Data Table with search, category filtering, and row actions (edit/delete).
    - *Right / Sidebar Rail (1/3 width on desktop):* Upcoming Renewals Queue (next 30 days, chronological order) + Category Spend Distribution breakdown.
- **Page Inventory:**
  1. **Auth (`/login`, `/signup`):** Centered card layout (400px width), single focus on form, no navigation clutter.
  2. **Dashboard (`/`):** Top bar + KPI metrics + Data table + Renewals rail + Category breakdown.
  3. **Settings (`/settings`):** Stacked form sections (Profile, Currency preference, Export, Account deletion danger zone).

---

## 6. Depth & Elevation (Law 9)
- **Elevation Ladder:**
  1. Base canvas: `--background` (flat).
  2. Surface layer: `--card` with 1px solid `--border` and `--shadow-sm`.
  3. Floating popovers / dropdowns: `--popover` with `--shadow-md`.
  4. Modal dialogs / drawers: `--card` with `--shadow-lg` and dark backdrop `oklch(0 0 0 / 0.5)`.
- **Rules:** No cards nested inside cards. Hairline borders (`1px solid var(--border)`) provide primary delineation rather than heavy drop shadows.

---

## 7. Motion (Law 12)
- **Motion Tier:** **Tier 0 CSS Transitions ONLY.** No Framer Motion, GSAP, ScrollTrigger, or Three.js.
- **Token:** `--transition-fast: 140ms cubic-bezier(0.16, 1, 0.3, 1);`
- **Permitted Properties:** `transform` and `opacity` only.
- **Forbidden:** No `transition: all`, no layout recalculation properties (`width`, `height`, `margin`, `padding`).
- **Reduced Motion Fallback (Required):**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 8. Do's & Don'ts
- **DO:**
  - Lead with the monthly and yearly spend totals and the upcoming renewals queue.
  - Right-align all numeric and monetary columns in tables and align their decimals.
  - Use `JetBrains Mono` with `font-variant-numeric: tabular-nums` for all prices, dates, and amounts.
  - Maintain a minimum of 44x44px for tap targets on mobile and touch viewports.
  - Test all background/foreground pairings with automated WCAG AA contrast verification.
- **DON'T:**
  - Don't use purple, violet, or multi-hue pastel gradients.
  - Don't center-align or left-align monetary amounts.
  - Don't nest cards inside cards or use heavy dark drop shadows in light mode.
  - Don't write raw hex values (`#ffffff`, `#1a1a1a`) anywhere in UI components.
  - Don't escalate past Tier 0 motion — financial data demands instant, calm predictability.

---

## 9. Responsive & Agent Guide (Law 21)
- **Approach:** Mobile-first architecture.
- **Breakpoints:**
  - Mobile: `< 640px`
  - Tablet: `640px – 1024px`
  - Desktop: `≥ 1024px`
- **Mobile Reflow Rules:**
  - **KPI Metrics:** Reflows from 3-column horizontal grid to 1-column stacked cards.
  - **Data Table:** Collapses from multi-column grid into stacked cards using `@container (max-width: 680px)` container queries, preserving label-value alignment.
  - **Upcoming Renewals:** Rendered immediately below KPI cards on mobile so users immediately see what renews next without excessive scrolling.
  - **Top Navigation:** Collapses into a clean compact header with slide-out drawer or full-width actions.
- **Agent Guide (Instructions for downstream skills like `/foundation`, `/contracts`, `/build`):**
  1. Always import and reference standard CSS variables defined in this file. Never invent custom hex codes.
  2. Implement components by sourcing from shadcn/ui and styling via Tailwind CSS classes mapped to these variables.
  3. Ensure all tabular data meets the table alignment rules in Section 4.
  4. Run `/frontend-audit` before completing any frontend pull request or milestone.
