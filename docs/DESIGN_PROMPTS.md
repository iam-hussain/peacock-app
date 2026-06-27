# Peacock App — Per-Page Design Briefs

> Feature-first briefs for the designer. Each page lists **what it's for, what it must
> contain, what the user can do, and the states it needs** — plus a few light visual
> *suggestions*. These are not rules: the designer chooses the colors, layout language,
> typography, and overall look. If a suggestion doesn't serve the feature, ignore it.
>
> **App = "Peacock"**, a financial club / chit-fund manager. Members pay monthly deposits,
> the club gives loans and earns interest, vendors invest for returns. Two audiences:
> a club **admin** (power user, lots of daily data entry) and **members** (mostly viewing).

---

## How to read each brief

- **Purpose** — why the page exists.
- **Must include** — the content/elements that have to be there.
- **Actions** — what the user can do.
- **States** — empty, loading, error, no-results, etc.
- **Feel (suggestion only)** — a hint at mood; the designer decides the execution.

A few things that matter app-wide (suggestions, not mandates):
- It handles money, so figures should read clearly and feel trustworthy.
- The admin does repetitive entry daily — favor speed and low friction for them.
- It should work well on phones (the admin often enters data on mobile).
- Light and dark both supported; designer picks the palette and identity.

---

## 1. Landing / Marketing  (`/`)

- **Purpose:** explain what Peacock is and get the user to sign in.
- **Must include:** brand/logo, a clear value statement, a sign-in entry point, a short
  overview of the core capabilities (member deposits, loans & interest, vendor investments,
  transparent records, analytics, role-based access), and a brief "how it works".
- **Actions:** sign in; toggle theme.
- **States:** —
- **Feel (suggestion):** confident and premium; a memorable hero moment is welcome.

## 2. Login  (`/login`)

- **Purpose:** authenticate a user.
- **Must include:** username, password (with show/hide), sign-in action, error messaging.
- **Actions:** sign in; theme toggle.
- **States:** idle, loading, invalid-credentials error.
- **Feel (suggestion):** simple, focused, reassuring.

## 3. Dashboard (overview)  (`/dashboard`)

- **Purpose:** one-glance health of the club's finances.
- **Must include:**
  - The few headline numbers that matter most (e.g. total portfolio value, available cash,
    outstanding loans, pending deposits) given clear prominence.
  - The remaining financial metrics, organized into sensible groups (member funds, loans &
    interest, vendors, cash flow) rather than one flat wall of equal tiles.
  - A trend view of portfolio value over time.
  - A recent-activity feed (latest transactions).
  - A quick snapshot of members.
  - A primary "add entry" action and an export option.
- **Actions:** add an entry; change chart time range; export; jump to any section.
- **States:** loading skeletons; empty (new club, no data yet).
- **Feel (suggestion):** clear hierarchy — the eye should land on the big numbers first.
  *Current pain to fix: ~19 equal-weight cards in one scroll, no hierarchy.*

## 4. Add / Edit Entry — the transaction flow  ★ key redesign

- **Purpose:** let the admin record a financial transaction quickly and without confusion.
- **Must include:**
  - An **intent-first** start: the user picks what they're doing in plain language
    ("member paid deposit", "give a loan", "record repayment", "collect interest",
    "withdrawal", "vendor investment", "vendor return", "funds transfer") — not raw type codes.
  - A details step adapted to that intent: who it's from/to (with searchable people pickers
    showing who they are), amount, date, and optional note / reference.
  - A clear confirmation of what was recorded, with an easy way to undo or add another.
  - **Batch mode** for monthly deposits: a checklist of members with the usual amount
    pre-filled, tick who paid, submit all at once.
  - **Quick-add**: a single-line shortcut for power users to enter a transaction fast.
  - The same flow handles editing an existing entry.
- **Actions:** choose intent; fill & save; save-another; batch record; quick add; edit; undo.
- **States:** validation errors, loading/saving, success, edit-prefill.
- **Feel (suggestion):** fast and guided; never make the user think in database terms.
  *Current pain to fix: raw enum dropdown, confusing from/to swapping, one-at-a-time entry,
  inconsistent (add is a page, edit is a modal).*

## 5. Members list  (`/dashboard/member`)

- **Purpose:** see and manage all members.
- **Must include:** each member with identity (name/avatar) and their key figures (deposits,
  balance, profit, current value, joined); search; filters (e.g. status, pending balance);
  per-member actions; add-member; export.
- **Actions:** search/filter; open a member; add/edit member; per-row actions; export.
- **States:** loading; empty (no members); no-results-for-filter (distinct from empty).
- **Feel (suggestion):** scannable; should remain usable on a phone (a dense table is hard
  there — consider a per-member card form factor on small screens).

## 6. Member detail — statement  (`/dashboard/member/[slug]`)

- **Purpose:** a full picture of one member, like a personal statement.
- **Must include:** member header (identity, status, joined, contribution progress); their
  key balances (deposit balance, loan taken, interest due); their transaction history; their
  loan history with status and interest paid/pending.
- **Actions:** add an entry for this member; export a statement; navigate their history.
- **States:** loading; empty per section (no transactions / no loans); relevant alerts
  (e.g. a pending deposit).
- **Feel (suggestion):** organized and personal; history is easier to read as a timeline.

## 7. Loans list  (`/dashboard/loan`)

- **Purpose:** track all loans and interest.
- **Must include:** each loan with member, start, amount, interest paid, interest pending,
  and a clear status (active / closed / overdue); summary totals (outstanding, interest
  collected, interest pending); filters; per-row actions; add-loan.
- **Actions:** filter by status/member; open/act on a loan; add a loan; export.
- **States:** loading; empty (no loans); no-results.
- **Feel (suggestion):** status should be instantly legible at a glance.

## 8. Transactions ledger  (`/dashboard/transaction`)

- **Purpose:** the full, filterable record of every transaction.
- **Must include:** each transaction with its type (in plain language), the parties
  (from → to), date, amount with clear credit/debit direction, and method; strong filtering
  (by member, type, date range, quick presets) with visible active filters; pagination;
  add/edit/delete.
- **Actions:** filter; paginate; add (opens the entry flow); edit; delete (with confirm); export.
- **States:** loading; empty; no-results-for-filter.
- **Feel (suggestion):** direction and amount of money should be unmistakable; remain
  usable on mobile (consider a card form factor for rows on small screens).

## 9. Vendors list  (`/dashboard/vendor`)

- **Purpose:** track vendor investments and returns.
- **Must include:** each vendor with identity, status, cycle, invested, returns, profit, and
  ROI; summary totals; filters; per-row actions; add-vendor.
- **Actions:** filter; open/act on a vendor; add a vendor; export.
- **States:** loading; empty; no-results.
- **Feel (suggestion):** profit/ROI is the headline per vendor.

## 10. Analytics  (`/dashboard/analytics`)

- **Purpose:** trends and comparisons over time.
- **Must include:** a time-range selector; the ability to choose which metrics to plot
  (portfolio value, deposits, loans, interest, cash); a clear chart; and supporting
  comparisons or a data table for the plotted values; export.
- **Actions:** change range; toggle metrics; export.
- **States:** loading; no-data-for-range.
- **Feel (suggestion):** the chart is the centerpiece; keep controls out of its way.

## 11. Profile  (`/dashboard/profile`)

- **Purpose:** manage one's own account.
- **Must include:** identity (avatar, name, role), editable profile fields (name, email,
  username with validation), change-password, and basic preferences (e.g. theme).
- **Actions:** edit & save; change avatar; change password; set preferences.
- **States:** loading; save success/error; validation errors.
- **Feel (suggestion):** calm and simple.

## 12. Settings  (admin)  (`/dashboard/settings`)

- **Purpose:** club-level configuration and maintenance.
- **Must include:** club settings (name, start date, standard deposit, interest rate);
  access/member management entry points; maintenance actions (recalculate with last-run info,
  backup/export, clear cache); a clearly separated danger zone (reset).
- **Actions:** edit club settings; run maintenance actions (each with confirmation); reset.
- **States:** loading; action-in-progress; last-run/result feedback; confirm dialogs for
  anything destructive.
- **Feel (suggestion):** scannable and safe; destructive actions clearly set apart.

## 13. Shared building blocks (design once, reuse)

- Stat/metric display (with optional trend and a small inline chart).
- A list/table pattern **and** its small-screen card equivalent.
- Filtering with visible, removable active filters.
- The entry flow container (used for add and edit).
- Empty states, loading placeholders, and error states.
- Identity cell (avatar + name), status indicators, money display, progress indicator.
- App navigation (desktop and mobile).

---

## How to use these

1. Take a page brief and design it your way — colors, layout, type, and identity are yours.
2. Cover the **Must include**, **Actions**, and **States** for that page.
3. Share the result per page; we then refine it and wire it to the backend together,
   alongside the performance work in `REDESIGN_PLAN.md`.
</content>
