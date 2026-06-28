# Peacock v2 — Open Decisions & Build-Readiness Checklist

> What still needs to be decided or written before v2 can be built end-to-end.
> Companion to `ARCHITECTURE_V2.md`, `V2_CALCULATIONS.md`, and `DESIGN_PROMPTS.md`.
> Each item is tagged: **[P0]** blocks first code, **[P1]** needed before that feature,
> **[P2]** can be deferred. A recommendation is given for every item.

---

## A. Are the existing docs enough?

**Mostly — they cover the hard parts (architecture, exact calculations, UX features), ~70–80%.**
To *complete* the project we still need the decisions in §B and the extra docs in §C. Nothing
below changes the chosen direction; it fills in detail the current docs intentionally left open.

---

## B. Decisions still to be made

### Domain / financial rules
1. **[P0] Double-entry sign convention.** Final debit/credit signs per account kind, locked with
   unit tests (flagged in `ARCHITECTURE_V2.md §9`). *Rec: assets +, equity/income −; prove with
   v1 fixtures.*
2. **[P0] Full transaction-type list.** v1 has `REJOIN` and `FUNDS_TRANSFER` too. Keep `REJOIN`
   (member returns after leaving)? Is `FUNDS_TRANSFER` member↔member, or club-internal only?
   *Rec: keep `REJOIN`; treat `FUNDS_TRANSFER` as club-internal (net-zero on club), as v1 does.*
3. **[P1] Loan rules.** One active loan per member or many? Partial repayments allowed (yes in v1)?
   Overdue definition? Min/max amount? Interest simple (v1) or compounding? *Rec: many loans,
   partial repay, simple interest, "overdue" = active beyond N months — confirm N.*
4. **[P1] Interest rate & rounding.** Confirm the monthly rate (v1 `ONE_MONTH_RATE`) and rounding
   granularity in paise (round interest to whole rupee like v1, or to paise?). *Rec: keep v1's
   monthly rate; round interest to whole rupee for parity, store as paise.*
5. **[P1] Legacy offsets mapping.** v1 has `joiningOffset` and `delayOffset` per member. Map both
   to `ADJUSTMENT` postings on `MEMBER_EQUITY`? *Rec: yes — one adjustment entry each at migration.*
6. **[P2] Period close / locking.** Allow locking a month so its entries become immutable?
   *Rec: design the seam now, implement later.*

### Identity, access, lifecycle
7. **[P0] Who can log in.** All members get accounts, or admin-only + selected members? Do vendors
   log in? *Rec: admin(s) + members who opt in; vendors do not log in.*
8. **[P0] Roles & permission matrix.** Exact capabilities for SUPER_ADMIN / ADMIN / MEMBER
   (see §C-3). *Rec: member = read own + club summary; admin = full write; super-admin = manage admins.*
9. **[P1] Member ↔ User linking.** A `Member` may exist with no login (`userId` null). Confirm.
   *Rec: yes, identity and auth are separate; link optionally.*
10. **[P1] Edit/delete policy.** Who can reverse/edit a posted transaction, and is there a time
    window? *Rec: admin only; allowed unless the month is locked; always via reversal (audited).*

### Platform / infra
11. **[P0] Avatar / file storage.** v1 uses a custom upload + `sharp`. Where do images live in v2?
    *Rec: Vercel Blob (simplest on Vercel) or Cloudinary free tier; not the DB.*
12. **[P0] Config storage.** Club start date, stage-based deposit amounts, interest rate: env,
    a `ClubConfig` table, or a settings file? *Rec: a single-row `ClubConfig` table editable in
    Settings, seeded from current values — removes hardcoding.*
13. **[P1] Timezone.** v1 pins IST via `date-fns-tz`. Confirm club timezone for month boundaries.
    *Rec: keep IST (Asia/Kolkata).*
14. **[P1] Monthly rollup cache.** Build graphs live from the ledger first; add the optional
    rollup only if needed (`V2_CALCULATIONS.md §7`). *Rec: live first, measure, add later.*
15. **[P2] Backup/export format.** CSV, JSON, or both for the admin export. *Rec: both; ledger +
    members/vendors.*

### Product scope (nice-to-haves to confirm in or out)
16. **[P2] Notifications/reminders** (e.g. pending deposit nudges). *Rec: out of v1-parity scope.*
17. **[P2] PWA / offline entry** (admin enters on phone, maybe offline). *Rec: defer; revisit.*
18. **[P2] Real-time/optimistic UI** on entry. *Rec: optimistic update on the entry drawer only.*
19. **[P2] Analytics metric set.** Confirm exact series + comparisons to plot. *Rec: portfolio
    value, cash, outstanding loans, deposits/month, interest/month; member-vs-average.*

---

## C. Docs still to add (to be fully build-ready)

1. **[P0] Final schema / data dictionary.** Promote `ARCHITECTURE_V2.md`'s sketch to the real
   `schema.prisma` with every field, enum, index, and constraint — once §B-1/2/7/8/12 are decided.
2. **[P0] Migration mapping (v1 → v2).** Field-by-field: each v1 `Transaction` → balanced v2
   postings; `joiningOffset`/`delayOffset` → adjustments; `loanHistory` → `Loan` rows; member/
   vendor/club passbooks → accounts. Plus the reconciliation gate (v2 totals == v1 totals).
3. **[P0] Permissions matrix.** A role × action grid driving `requireRole()` guards.
4. **[P1] Server-action / service contract.** The list of mutations (`postTransaction`,
   `reverseTransaction`, member/vendor/loan CRUD, config update) and read queries (balances,
   dashboard, statements, graphs) with their inputs/outputs (Zod schemas).
5. **[P1] Test & fixtures plan.** Extract real v1 outputs as golden fixtures; unit tests for the
   ledger engine and every business rule in `V2_CALCULATIONS.md §5`.
6. **[P2] Runbook.** Env vars, Neon setup, seed, deploy, and the one-time migration procedure.

---

## D. What's NOT a blocker (already settled)

- Stack, DB, money model, money representation, interest-on-read, auth library, caching, scope
  (see `ARCHITECTURE_V2.md §1`).
- All display formulas and the mutation/graph behavior (`V2_CALCULATIONS.md`).
- Page-level features and entry-flow UX (`DESIGN_PROMPTS.md`).

---

## E. Suggested order to resolve

1. Knock out the **[P0]** decisions in §B (domain rules, login/roles, file + config storage).
2. Write the **[P0]** docs in §C (final schema, migration mapping, permissions).
3. Then `ARCHITECTURE_V2.md`'s phase plan (P0 foundation + tested ledger engine) can start with
   zero ambiguity.

> Recommendation: resolve the eight **[P0]** items as one focused decision round, then I can
> finalize the schema + migration-mapping docs and we're ready to scaffold.
</content>
