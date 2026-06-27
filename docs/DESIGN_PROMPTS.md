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

## 6. Member detail page  (`/dashboard/member/[slug]`)

**Purpose:** one member's complete financial picture — a personal statement of everything
they've put in, taken out, owe, and are owed.

**Creative latitude:** be ambitious here. This is the page to make memorable and genuinely
useful, not a generic profile. Designer chooses the whole presentation — how information is
grouped, what's emphasized, how it flows, what's a chart vs a number vs a timeline. Do not
follow a prescribed layout; invent the best way to tell this member's money story. The only
hard requirement is that the right information is present and the loan logic below is honored.

### Items that must be available (designer decides how/where)
- **Identity & standing:** name, photo, status (active / inactive / left), date joined, how
  long they've been in the club.
- **Contribution health:** how much they've deposited vs how much was expected of them by now
  (the gap = pending/ahead), plus any adjustments applied to them.
- **Money in:** periodic deposits total, adjustments, and (if any) withdrawals — and within
  withdrawals, how much was their own principal vs profit taken.
- **Their stake / balance:** current member balance and their share of club profit (expected
  return).
- **Activity history:** a browsable record of this member's own transactions over time
  (deposits, withdrawals, loan events, etc.).
- **Alerts worth surfacing:** e.g. a deposit is pending, interest is overdue/accruing — only
  show an alert when it's actually true.
- **Actions:** record a new entry for this member, and export their statement.

### How loans should appear — conditional on the member's actual data
The loan section is **data-driven**: its presence, prominence, and content all depend on what
the member actually has. A member may have **multiple concurrent loans**, only old closed
ones, or none at all. Handle all three:

- **Member has one or more ACTIVE loans →** loans are a **prominent** part of the page. For
  **each active loan** show: principal taken, date taken, **outstanding principal**, interest
  **accrued to date** (this keeps growing with time — compute live), interest **already paid**,
  interest **still pending**, and a sense of repayment progress (paid vs remaining). If there
  are several active loans, each is shown distinctly and a combined total (total outstanding,
  total interest pending) is available.
- **Member has only CLOSED/past loans (none active) →** don't give loans headline space.
  Present them as **history** — a settled record (amount, period it ran, total interest paid,
  closed date) that can be reviewed but doesn't dominate. Make it clear these are paid off.
- **Member has NEVER taken a loan →** the loan section should **not occupy meaningful space**.
  Either omit it entirely or reduce it to a quiet, neutral note (e.g. "No loans"). No empty
  cards, no misleading zeros that look like a loan exists. Absence of loans should read as a
  clean, healthy state — not a gap.

So: **active loans = featured and live; closed loans = quiet history; no loans = effectively
absent.** The page composition itself should shift based on which of these is true.

### States
Loading; per-section empty states (no transactions, no loans — see logic above); accurate
alerts only when their condition holds.

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

## 12b. Shareable summary image (capture / share)  ★

**Purpose:** generate a single, clean **image** the admin can download and share (e.g. in a
WhatsApp/Telegram group) that captures the club's current status at a glance — **a club
summary plus every member's key numbers** — so members stay informed without logging in.

**Where it lives:** a "Capture / Share image" action on the **dashboard** (primary). It may
also be offered per-member on the member detail page (a single-member share card). Designer
decides exactly where the trigger sits.

**Creative latitude:** full freedom on how the image looks — this is a chance for something
share-worthy and on-brand, not a raw screenshot. The designer owns the entire visual
treatment, composition, and how dense vs spacious it is. The only requirements are the
content below and that it reads cleanly as a downloaded/forwarded image on a phone.

### What the generated image must contain
- **Club summary header:** club name/identity, an "as of" date/time, and the headline club
  figures — at least club/portfolio value and total members, plus the key ones (available
  cash, total deposits, outstanding loans, interest pending — designer/PM picks the set).
- **Per-member rows/cards:** for **every** (active) member — name (and avatar if it renders
  well), **pending balance**, **total deposit**, **current loan (outstanding)**, and
  **interest balance/pending**. Money formatted as ₹.
- A small footer/branding mark so the image is recognizable when forwarded.

### Behavior & functionality
- Trigger → the app composes the image from live data → shows a **preview** → user can
  **download** (PNG) and/or **share** (native share sheet on mobile where available).
- **Scales with member count:** must look good for both a handful and many members — the
  designer decides how (compact rows, multiple columns, or splitting into multiple images/
  pages when the list is long). Don't let it become an unreadable wall.
- **Crisp output:** high enough resolution to stay sharp when viewed/zoomed on a phone.
- Optional toggles the designer may offer: choose which figures to include, include/exclude
  inactive members, light/dark version of the image.

### States
- **Generating** (composing the image), **preview ready** (with download/share),
  **empty** (no members yet), **error** (generation failed, retry).

### Notes for build (not design)
- This exposes member financials, so the capture action is **admin-only** (per the
  permissions matrix in `PEACOCK_V2_MASTER.md §9`).
- All figures come straight from the ledger reads in `V2_CALCULATIONS.md` / `PEACOCK_V2_MASTER.md §6`
  (pending, total deposit, loan outstanding, interest pending, club value, member count) —
  no new calculations needed.

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
