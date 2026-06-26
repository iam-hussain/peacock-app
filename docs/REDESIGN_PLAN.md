# Peacock App — Redesign & Optimization Plan

> A phased roadmap covering (1) backend performance, (2) the add-entry experience,
> and (3) visual / page redesign. Each phase is independently shippable.
> File references point at the current code so changes are concrete.

---

## TL;DR — the central problem

The data model is sound: **`Transaction` is the source of truth**, and `Passbook` /
`Summary` are derived. The *derivation strategy*, however, is **replay-and-recompute-everything**:

- Every transaction rescans all active member passbooks to rebuild the club passbook.
- Every loan transaction re-fetches all loan history since club start.
- The loan table recomputes every member's interest on every page view.
- Every write wipes the **entire** cache (`paths: ["*"]`).
- Admin recalculate replays all transactions and recomputes interest once per month (12×).

The redesign keeps the model and replaces the strategy with **incremental updates +
derive-on-read with proper caching**. Everything else (UX, visuals) builds on top.

---

## Phase 0 — Guardrails (before touching anything)

Goal: make the refactor safe and measurable.

- [ ] **Snapshot current outputs.** Run `npm run recalculate` on a copy of prod data and
      save the resulting passbook/summary values as a fixture. Every later change must
      reproduce these numbers exactly (financial correctness is non-negotiable).
- [ ] **Add characterization tests** (vitest is already set up) around the calculators:
      - `src/lib/calculators/club-aggregates.ts`
      - `src/lib/calculators/loan-calculator.ts`
      - `src/lib/calculators/expected-interest.ts`
      - `src/logic/transaction-handler.ts`
      Feed known transaction sets, assert known balances. These become the safety net.
- [ ] **Add lightweight timing logs** (or a `console.time`) around the per-transaction
      handler and the loan endpoint so we can prove the speedup.

---

## Phase 1 — Backend performance (the heavy-DB-insert pain)

### 1.1 Incremental club aggregates *(highest impact)*
**Now:** `transactionEntryHandler` → `recomputeClubDashboardAggregates()` reads **all** active
member passbooks and rewrites the club passbook on **every** transaction
(`src/logic/transaction-handler.ts:225`, `src/lib/calculators/club-aggregates.ts:45`).

**Change:** apply a **delta**. A `PERIODIC_DEPOSIT` changes exactly one member's
contribution → add the delta to the club passbook's running totals instead of rescanning.
- Keep a full recompute available, but only trigger it on **structural** events
  (member activate/deactivate, status change), not on ordinary transactions.
- Store `aggregatesComputedAt` on the club passbook; expose admin "force recompute".

**Expected:** per-transaction cost drops from O(members) to O(1).

### 1.2 Materialize loan history
**Now:** `getAllMembersLoanHistory()` fetches all `LOAN_TAKEN`/`LOAN_REPAY` since club start and
recomputes interest for every member **on every loan-table view** (`src/lib/calculators/loan-calculator.ts:196`).
The `passbook.loanHistory` JSON field exists for exactly this but is left `[]`.

**Change:** compute loan history **on loan-transaction write** and persist it into
`passbook.loanHistory`. The loan endpoint reads the materialized value.
- Interest that accrues with time (not just on writes) → recompute on read **only** for
  active loans, or refresh via a single daily job (see 1.5), not every 15s.

### 1.3 Incremental expected loan interest
**Now:** recomputed from scratch after every loan transaction and 12× during recalculate
(`src/lib/calculators/expected-interest.ts:171`, `src/logic/reset-handler.ts:186`).

**Change:** store `expectedTotalLoanInterest` on the club passbook; adjust by the
new/edited transaction's delta. Full recompute only on admin recalculate.

### 1.4 Targeted cache invalidation
**Now:** every transaction calls `invalidateAllCaches({ paths: ["*"], tags: ["api","transaction","dashboard"], clearNodeCache: true })`
plus broad sessionStorage clears (`src/lib/core/cache-invalidation.ts:49`, `src/lib/core/fetcher.ts:145`).

**Change:** invalidate **by transaction type**. A deposit busts member + club + dashboard,
never vendor/loan caches. Map `TransactionType → affected cache tags` in one place.

### 1.5 Cache dashboard reads + replace any polling with on-demand revalidation
**Now:** `computeLiveDashboard()` hits Prisma (`findFirst` + `findMany`) on **every**
dashboard/club-passbook request (`src/lib/calculators/dashboard-live.ts:23`).

**Change:** wrap in `unstable_cache()` with a tag; revalidate that tag from the
invalidation map in 1.4. The only `setInterval` in the codebase is the in-memory
rate-limiter cleanup (`src/lib/core/rate-limit.ts:14`) — that's harmless, leave it.

### 1.6 Checkpoint-based recalculate
**Now:** `processTransactionsForPassbooks()` replays **all** transactions and recomputes
monthly snapshots, recomputing interest per month (`src/logic/reset-handler.ts:100`).

**Change:** persist month-end checkpoints; on recalculate, **replay from the earliest
dirty month** — not merely "since the last checkpoint" — and rewrite every month from
there forward. Keep the full rebuild as an explicit "hard reset" option.

> ⚠️ **Historical mutations must invalidate checkpoints.** The edit flow creates a
> replacement transaction and then deletes the original
> (`src/components/organisms/forms/transaction-form.tsx`,
> `src/app/api/transaction/[id]/route.ts`), so an *old* transaction's month can change at
> any time. Naively replaying only the tail would silently preserve stale pre-checkpoint
> balances. Rule: when a transaction at month `M` is created/edited/deleted, invalidate
> all checkpoints `>= M` and replay from the start of `M`. Track the earliest dirty month
> per recalculate batch and start there.

### 1.7 (Optional) Normalize the passbook payload
The free-form `payload` JSON is rewritten wholesale on every update and has no schema.
Promote the hot numeric fields to typed Prisma columns and validate the rest with Zod.
*Lower priority — do after 1.1–1.5 prove out.*

**Phase 1 acceptance:** fixture numbers from Phase 0 reproduce exactly; per-transaction DB
writes drop to ~1–3 targeted updates; loan table served from materialized data.

---

## Phase 2 — The add-entry experience

**Now:** full-page form at `/dashboard/transaction/add`; user picks a raw enum
(`LOAN_REPAY`, `FUNDS_TRANSFER`); from/to labels silently swap; 6 stacked fields
(`src/components/organisms/forms/transaction-form.tsx`). Add is a page; edit is a modal — inconsistent.

### 2.1 Intent-first selector
Replace the enum dropdown with tappable intent cards that map to types internally:
- "Member paid deposit" → `PERIODIC_DEPOSIT`
- "Give a loan" → `LOAN_TAKEN`   • "Record repayment" → `LOAN_REPAY`
- "Loan interest" → `LOAN_INTEREST`   • "Withdrawal" → `WITHDRAW`
- "Vendor invest / return" → `VENDOR_INVEST` / `VENDOR_RETURNS`
The user never sees schema vocabulary; from/to are derived from intent.

### 2.2 Batch monthly deposits *(biggest daily time-saver)*
A checklist of all active members with the standard deposit pre-filled → tick who paid →
submit all at once. One screen replaces N separate entries. Backend: a single batch
endpoint that creates many transactions and applies incremental aggregates once.

### 2.3 Quick-add command bar
⌘K-style input: "deposit 5000 from Ravi" → parsed → inline confirm. Power-user speed.

### 2.4 Consistent drawer + confirmation
- Move add into a drawer/sheet (`vaul` is already a dependency) so context is never lost;
  use the same component for add **and** edit.
- Replace the bare toast with an inline summary ("✓ ₹5,000 deposit · Ravi → Club") + **Undo**.

### 2.5 Friendly labels everywhere
Map enums → human text in one shared dictionary, reused by forms, tables, and activity feed.

---

## Phase 3 — Visual / page redesign

You already have a strong, underused design system: `BlackEcho` brand font, glass surfaces,
shimmer, gold dividers, framer-motion (`tailwind.config.ts`, `src/styles/globals.css`).

### 3.1 Dashboard hierarchy
**Now:** 19 equal-weight stat cards in a 2-col scroll (`src/app/dashboard/page.tsx`).
**Change:** 3–4 hero metrics (Total Portfolio, Available Cash, Outstanding Loans, Pending
Deposits) up top; remaining cards in **collapsible labeled groups** (the groups already
exist in markup — just give them visual distinction).

### 3.2 Mobile card views for tables
**Now:** 8–9 columns horizontally scrolling on mobile (`src/components/atoms/data-table.tsx`).
**Change:** responsive card layout below `md`; keep the table on desktop. Add per-row
sparklines for contribution/loan trends.

### 3.3 Empty & loading states
Add contextual empty states (illustration + CTA) to every list page; vary skeletons so
loading reads as intentional, not broken.

### 3.4 Member detail as a "statement"
Activity timeline, contribution-progress ring, loan status at a glance; real **PDF export**
(not only the html2canvas screenshot).

### 3.5 Identity polish
A signature peacock accent gradient, standardized data-viz palette (replace ad-hoc hex on
stat cards), staggered list animations, micro-interactions on form focus.

---

## Suggested sequence

1. **Phase 0** (tests + fixtures) — 1 small PR, unblocks everything safely.
2. **Phase 1.1 + 1.4 + 1.5** — the biggest perf win, low UI risk.
3. **Phase 1.2 + 1.3 + 1.6** — finish the incremental model.
4. **Phase 2.1 + 2.4 + 2.5** — entry redesign on the new fast backend.
5. **Phase 2.2 + 2.3** — batch + quick-add.
6. **Phase 3** — visual layer last, on a stable foundation.

Each numbered item = one focused PR with the Phase-0 fixtures as the regression gate.

---

## Risks & notes

- **Correctness first.** Financial totals must match the Phase-0 snapshot at every step.
  Incremental math is where bugs hide — the characterization tests are mandatory.
- **Keep the full recompute** as an admin escape hatch even after going incremental.
- **Migration:** materializing `loanHistory` (1.2) needs a one-time backfill (extend
  `prisma/recalculate.ts`).
- Phases are ordered so backend stabilizes before UX/visual work depends on it.
</content>
</invoke>
