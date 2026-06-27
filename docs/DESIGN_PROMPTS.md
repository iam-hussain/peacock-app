# Peacock App — Per-Page Design Prompts

> Copy-paste prompts for AI design tools (v0, Lovable, Figma AI, Midjourney, etc.).
> **Always prepend the "Global Style System" block to each page prompt** so every
> screen shares one identity. Each page prompt then describes purpose, layout,
> components, states, and responsive behavior.
>
> App = **Peacock**, a financial club / chit-fund manager: members pay monthly
> deposits, the club gives loans and earns interest, vendors invest for returns.
> Audience: a club admin (power user, does daily data entry) + members (read-mostly).

---

## 0. GLOBAL STYLE SYSTEM (prepend to every prompt)

```
STYLE SYSTEM — "Peacock", a premium fintech club manager.
- Mood: calm, premium, trustworthy, "private banking" feel — not playful, not corporate-bland.
- Theme: dark-mode-first with a clean light mode. Deep blue-graphite backgrounds
  (#0B1118 / #0E141C), elevated card surfaces slightly lighter (#121A24), hairline borders.
- Accent: a peacock-inspired gradient — teal→sapphire→emerald (#1FB6A6 → #2D6CDF → #1FA971),
  used sparingly for primary actions, active states, focus rings, and key data highlights.
- A subtle gold hairline divider (thin gradient line) separates major sections.
- Surfaces: soft glassmorphism (backdrop blur + 1px translucent border), gentle shadows,
  optional faint noise grain at ~2.5% opacity. Rounded corners (radius 12–16px).
- Typography: a distinctive display font for headlines/big numbers (geometric, slightly
  condensed) + a clean sans (Inter/Roboto) for body. Tabular figures for all money.
- Money: ₹ INR, Indian grouping (₹1,25,000), tabular numerals, color-neutral by default;
  green for positive/credit, red for negative/debit, muted gray for zero/pending.
- Motion: restrained — fade+slide-up on load (cubic-bezier(0.16,1,0.3,1)), staggered list
  items, micro-interaction on input focus (accent ring glow), number count-up on stat cards.
- Components: shadcn/ui + Radix style — buttons, cards, dialogs, drawers, tabs, badges,
  tooltips, data tables. Iconography: Lucide, thin stroke.
- Accessibility: WCAG AA contrast, visible focus, 44px min touch targets, real empty states.
- Responsive: mobile-first. Tables become stacked cards under md; bottom tab bar on mobile,
  left sidebar on desktop.
```

---

## 1. Landing / Marketing page  (`/`)

```
Design a marketing landing page for "Peacock", a premium financial-club manager.
Sections, top to bottom:
1. Sticky glass top bar: peacock logo + wordmark, theme toggle, "Sign in" button (accent).
2. Hero: a confident headline ("Run your money circle like a private bank"), one-line
   subhead, primary CTA "Sign in" + secondary "See how it works". To the side/behind,
   an elegant abstract peacock-feather motif or a floating glass dashboard preview card
   showing a portfolio number counting up. Subtle parallax / breathing animation.
3. Trust strip: 3–4 inline stats (e.g. "₹X tracked", "transparent", "real-time").
4. Feature grid: 3×2 glass cards — Member deposits, Loans & interest, Vendor investments,
   Transparent passbook, Analytics, Role-based access. Each: thin Lucide icon, title, 1 line.
5. "How it works": 3 numbered steps with connecting gold hairline.
6. Footer: minimal, links + small print.
Animations: hero fade+scale on load, feature cards fade-in on scroll (whileInView), staggered.
Fully responsive; on mobile the hero stacks and the preview card sits below the CTA.
```

---

## 2. Login  (`/login`)

```
Design a centered login screen for "Peacock".
- Full-bleed dark background with a faint peacock-feather/aurora gradient glow behind a
  single elevated glass card (max-width ~400px).
- Card: logo at top, "Welcome back" heading, username field, password field (with show/hide
  toggle), "Sign in" primary button (accent gradient, full width), inline error state, and a
  subtle loading state on the button.
- Micro-interaction: accent focus ring glow on field focus.
- Theme toggle in a corner. Light-mode variant: soft off-white card on light gradient.
- Mobile: card fills width with comfortable padding; respects safe areas.
```

---

## 3. Dashboard (main overview)  (`/dashboard`)

```
Design the main dashboard for a financial club admin. GOAL: replace a wall of 19 equal
stat cards with clear hierarchy.
Layout:
1. Page header: greeting + club name, date, and a primary "＋ Add entry" button (accent),
   plus an "Export" (image/PDF) action.
2. HERO ROW — 4 large headline metric cards in one row (stack 2x2 on mobile):
   • Total Portfolio Value  • Available Cash  • Outstanding Loans  • Pending Deposits.
   Each: big tabular number with count-up, label, tiny trend chip (▲/▼ vs last month),
   and a small sparkline. Accent-gradient left edge or glow on the most important one.
3. SECONDARY METRICS — grouped into labeled, collapsible sections separated by gold hairline:
   "Member Funds", "Loans & Interest", "Vendors", "Cash Flow". Each section = a tidy grid of
   smaller stat cards (icon, label, value, info tooltip). Sections are visually distinct, not
   one endless scroll.
4. Two-column lower area (stacks on mobile):
   • Left: portfolio value line chart (range toggle 1M/3M/6M/1Y/All).
   • Right: live Activity Feed (recent transactions as rows with type icon, member avatar,
     amount, time-ago). Includes a graceful empty state.
5. "Members snapshot" strip: horizontally scrollable mini member cards (avatar, name,
   contribution progress ring), with "View all".
Provide loading (skeleton) and empty states. Restrained count-up + staggered card entrance.
```

---

## 4. Add / Edit Entry — the transaction flow  (drawer)  ★ key redesign

```
Design an "Add entry" flow for recording a club financial transaction. Replace a raw
enum dropdown with an INTENT-FIRST flow inside a right-side drawer/sheet (not a separate page).

STEP 1 — Choose intent (grid of large tappable cards, each: icon + plain-language label +
one-line hint). Cards:
  • "Member paid deposit"   • "Give a loan"   • "Record loan repayment"
  • "Collect loan interest" • "Member withdrawal" • "Vendor investment"
  • "Vendor return"         • "Funds transfer"
(These map internally to transaction types; user never sees enum names.)

STEP 2 — Details form, tailored to the chosen intent:
  • From / To shown as clear, pre-resolved role labels (e.g. "Ravi (Member) → Club") with
    searchable member/vendor pickers showing avatars; only the relevant picker is editable.
  • Amount field: large, with ₹ prefix and live formatted preview (₹1,25,000).
  • Date picker (defaults to today).
  • Optional: note (textarea), reference id (cheque/UPI ref) — collapsed under "Add details".
STEP 3 — Inline confirmation summary card ("✓ ₹5,000 deposit · Ravi → Club · 27 Jun") with
  "Save another" and an Undo affordance after save (toast + inline).

Also design TWO power modes accessible from the drawer header:
  A) "Batch monthly deposits": a checklist of all active members with the standard deposit
     amount pre-filled per row; tick who paid, edit amounts inline, running total at bottom,
     single "Record N deposits" button.
  B) "Quick add" command bar: a single text input ("deposit 5000 from Ravi") with a parsed
     preview chip before confirming.

The SAME drawer component is used for both add and edit (edit pre-fills + shows history).
Show validation, loading, and error states. Mobile: drawer becomes a full-height bottom sheet.
```

---

## 5. Members list  (`/dashboard/member`)

```
Design a members list page for the club admin.
- Header: title + count, search box, filter chips (status: active/inactive; balance: pending/clear),
  "＋ Add member", export, and a sticky-header toggle.
- DESKTOP: data table with columns — Member (avatar + name + username), Managed-by, Total
  Deposits, Adjustments, Balance, Profit, Current Value, Joined, ⋯ actions. Frozen first
  column; sortable headers; zebra-free clean rows; row hover reveals quick actions.
- MOBILE (under md): each member is a card — avatar + name on top, a 2-col mini grid of
  key figures (Deposits, Balance, Value), a thin contribution-progress bar, and a ⋯ menu.
- Per row: small contribution sparkline or progress ring.
- Real empty state (illustration + "Add your first member" CTA) and a "no results for filter"
  state distinct from empty data. Skeleton loading rows.
- Money colored by sign; status shown as a subtle badge dot.
```

---

## 6. Member detail — "Statement" view  (`/dashboard/member/[slug]`)

```
Design a single member's detail page as a polished financial STATEMENT.
- Header card: large avatar, name, username, status badge, join date, and a contribution
  progress ring (paid vs expected). Primary actions: "Add entry for this member", "Export PDF".
- Three highlight metric cards: Deposit Balance, Loan Taken, Interest Due (color by sign).
- Tabs: Overview | Transactions | Loans.
  • Overview: key-value summary blocks (deposits, adjustments, profit share, current value)
    + a small contribution-over-time chart + any alerts (e.g. "₹X deposit pending").
  • Transactions: a vertical timeline of this member's activity (type icon, amount, date,
    note) grouped by month, with running balance.
  • Loans: loan history cards — each loan: amount, start/end, status (active/closed), interest
    paid vs pending, a small progress bar.
- Empty/loading states for each tab. Mobile: header stacks, tabs become a scrollable bar.
```

---

## 7. Loans list  (`/dashboard/loan`)

```
Design a loans overview page.
- Header: title + count, filter chips (status: active / closed / overdue), search by member,
  "＋ Give loan", export.
- Top summary band: 3 small stat cards — Total Outstanding, Interest Collected (lifetime),
  Interest Pending.
- DESKTOP table columns: Member (avatar+name), Loan Start, Amount Taken, Interest Paid,
  Interest Pending, Status (colored dot + label: active/closed/overdue), ⋯ actions.
- MOBILE: loan cards — member header, amount big, an interest paid/pending split bar, status
  badge, ⋯ menu.
- Visual status system: blue = active, green = closed/settled, red/amber = overdue.
- Empty state ("No active loans") + filtered-no-results state. Skeletons while loading.
```

---

## 8. Transactions list  (`/dashboard/transaction`)

```
Design a transactions ledger page.
- Header: title, "＋ Add entry" (opens the entry drawer), export.
- Powerful filter bar (URL-synced): member picker, transaction-type multi-select (shown as
  friendly labels with type icons), date-range picker, quick presets (This month / Last month).
  Show active filters as removable chips with a "Clear all".
- DESKTOP table: Type (icon + friendly label + colored direction arrow ↑debit/↓credit),
  Member/Counterparty (avatars from→to), Date, Amount (colored by direction), Method badge,
  ⋯ (edit/delete). Pagination footer (25/page) with page-size control.
- MOBILE: transaction rows as compact cards — type icon + label, from→to avatars, amount on
  the right, date below; tap opens detail/edit drawer.
- Edit/delete use the same entry drawer (#4). Delete = confirm dialog with summary.
- Empty + filtered-no-results states; skeleton rows. Sticky filter bar on scroll.
```

---

## 9. Vendors list  (`/dashboard/vendor`)

```
Design a vendors / investments page.
- Header: title + count, filters (status, cycle), "＋ Add vendor", export.
- Top band: stat cards — Total Invested, Total Returns, Net Profit, Avg ROI %.
- DESKTOP table: Vendor (avatar/logo + name), Status, Cycle, Invested, Returns, Profit,
  ROI % (with a tiny up/down trend), ⋯ actions.
- MOBILE: vendor cards — name + status, invested vs returns split bar, ROI % badge (green/red),
  ⋯ menu.
- ROI visualized (small gauge or trend chip). Empty + no-results states; skeletons.
```

---

## 10. Analytics  (`/dashboard/analytics`)

```
Design an analytics page for club finances.
- Header: title + a time-range segmented control (1M / 3M / 6M / 1Y / All).
- Metric selector: toggle chips to choose which series to plot (Portfolio Value, Deposits,
  Loans Outstanding, Interest, Cash). Selected chips use the accent gradient.
- Primary: a large, smooth multi-series line/area chart (Chart.js style) with hover tooltip,
  legend, and gridlines tuned for dark mode.
- Below: a few comparison cards (e.g. member vs club-average contribution) and a small data
  table of the plotted values by period, with export.
- Graceful "No data for this range" empty state. Mobile: chart full-width, controls wrap,
  table scrolls horizontally.
```

---

## 11. Profile  (`/dashboard/profile`)

```
Design a user profile / account settings page.
- Header: avatar (with upload/change), name, role badge (Super Admin / Admin / Member).
- Profile form card: first name, last name, email, username (with validation hints), Save.
- Security card: "Change password" opening a dialog (current, new, confirm; strength meter).
- Preferences card: theme (light/dark/system), maybe currency/locale display.
- Inline success/error toasts; disabled/loading states on save. Clean, single-column,
  centered max-width layout; sections separated by gold hairline. Mobile-friendly.
```

---

## 12. Settings  (`/dashboard/settings`)  (admin)

```
Design an admin settings page.
- Sectioned layout (left vertical nav or stacked cards): 
  • Club settings (name, start date, standard monthly deposit, interest rate).
  • Members & access (link to manage members, roles, permissions).
  • Data & maintenance: "Recalculate" action (with a clear warning + last-run timestamp),
    "Backup / export data", "Clear cache" — each as a labeled card with a confirm dialog.
  • Danger zone (reset) visually separated in red-tinted card.
- Every destructive action: confirm dialog summarizing impact. Show progress/last-run states.
- Clean, scannable, lots of whitespace. Mobile: sections stack, nav becomes a top scroll bar.
```

---

## 13. Shared components to design once (reused everywhere)

```
Design a small component library matching the style system:
- Stat card (3 sizes: hero / standard / mini) with: label, big tabular value, optional trend
  chip, optional sparkline, optional info tooltip, accent-glow variant.
- Data table (sortable header, frozen first column, sticky header, row hover actions, pagination)
  AND its mobile "card row" equivalent.
- Filter bar with removable chips + "clear all".
- Entry drawer / bottom sheet shell (header, body, footer actions).
- Empty state (illustration slot + title + subtitle + CTA) and skeleton loaders.
- Member/vendor avatar+name cell, status badge dots, money cell (colored, tabular),
  contribution progress ring/bar.
- Top bar (glass), desktop sidebar (collapsible), mobile bottom tab nav.
Deliver light + dark variants for each.
```

---

## How to use these

1. Pick a page, paste **Section 0 (Global Style System) + that page's prompt** into your tool.
2. Generate, iterate on the visual until you're happy.
3. Send me the resulting design (screens / Figma / code) per page.
4. We then refine design + wire it to the (incrementally-optimized) backend together,
   following `REDESIGN_PLAN.md` — backend perf and UI land in step.
```
</content>
