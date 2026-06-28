# Peacock v2 — Greenfield Architecture Plan

> A clean-slate design for a new repository. Goal: a **simple, lightweight, correct**
> financial-club manager with one source of truth, exact money, no recompute loops, and
> minimal infrastructure. This document records the decisions, the domain model, the
> schema, the app structure, the data lifecycle, a migration path, and a phased build plan —
> with rationale and the trade-offs we accepted.

---

## 1. Decisions (locked)

| Area | Choice | Why |
|------|--------|-----|
| Database | **PostgreSQL** (Neon free tier) + Prisma | Relational + ACID; perfect for a ledger; free hosting like Atlas |
| Money model | **Double-entry ledger + incremental balances** | Correct, auditable, O(1) per write; industry standard |
| Amounts | **Integer minor units (paise)** | Exact, fast, DB-agnostic; format to ₹ only at display |
| Stack | **Next.js (App Router) + Server Components + Server Actions** | One codebase, minimal client JS, no hand-written REST layer |
| Time-based interest | **Derive-on-read** | No background jobs/loops; always accurate |
| Auth | **Better Auth** | Modern, lightweight, far less custom security code |
| Caching | **Next.js cache + tag revalidation** | One predictable layer; drop NodeCache/ETag/sessionStorage |
| Scope | **Single club, extensible** | Simplest now; clean seam to add `clubId` later |

---

## 2. Why the old design was wrong (so we don't repeat it)

1. **`Float` money** → rounding drift. v2: integer paise.
2. **MongoDB for relational/transactional data** → JSON blobs + manual integrity. v2: Postgres.
3. **Derived passbooks stored *and* fully recomputed per write** → the perf pain. v2: ledger is
   the only truth; balances updated incrementally; everything time-based derived on read.
4. **Two sources of truth** (legacy passbook JSON vs transactions). v2: one ledger, full stop.
5. **Four caching layers + "invalidate everything"**. v2: one tag-based layer.
6. **Background recompute on serverless**. v2: no scheduled jobs at all.
7. **Heavy REST + transformers + handlers**. v2: server actions call typed services directly.

---

## 3. The domain as double-entry bookkeeping

Every financial event is **one balanced transaction**: a set of signed line entries whose
amounts **sum to zero**. Each line hits a **ledger account**; each ledger account keeps a
cached running **balance** updated in the *same* DB transaction as the write.

### Ledger account kinds (the "chart of accounts")
- `CLUB_CASH` — the club's money on hand (one account).
- `MEMBER_EQUITY` — one per member; their stake/contributions in the club.
- `LOAN_RECEIVABLE` — one per member; principal the member currently owes.
- `VENDOR_RECEIVABLE` — one per vendor; principal placed with the vendor.
- `INTEREST_INCOME` — club income from loan interest (one account).
- `VENDOR_PROFIT` — club income from vendor returns (one account).

### How each real-world action posts (sums to 0)

| Action | Lines (signed paise) |
|--------|----------------------|
| Member pays deposit ₹5,000 | `CLUB_CASH +500000`, `MEMBER_EQUITY(member) +500000` … wait — must net 0 → `CLUB_CASH +500000`, `MEMBER_EQUITY -500000` (equity is a credit/liability of the club to the member) |
| Member withdrawal ₹3,000 | `CLUB_CASH -300000`, `MEMBER_EQUITY +300000` |
| Loan given ₹10,000 | `CLUB_CASH -1000000`, `LOAN_RECEIVABLE(member) +1000000` |
| Loan repayment ₹2,000 | `CLUB_CASH +200000`, `LOAN_RECEIVABLE -200000` |
| Loan interest paid ₹500 | `CLUB_CASH +50000`, `INTEREST_INCOME -50000` |
| Vendor investment ₹20,000 | `CLUB_CASH -2000000`, `VENDOR_RECEIVABLE +2000000` |
| Vendor return ₹22,000 (₹2,000 profit) | `CLUB_CASH +2200000`, `VENDOR_RECEIVABLE -2000000`, `VENDOR_PROFIT -200000` |

> Sign convention: store each line as a signed integer; **the invariant is `sum(lines)=0`**,
> enforced before commit. Asset accounts (cash, receivables) and liability/income accounts
> carry opposite signs so the books always balance. (Exact sign rules finalized in code with
> tests; the table above shows the shape.)

### Why this is the whole game
- **Total portfolio, available cash, outstanding loans, member balances, vendor ROI** are all
  just reads of account balances or simple sums — no bespoke "passbook" computation.
- **Corrections never delete history**: a wrong entry is fixed with a **reversing transaction**,
  keeping the ledger append-only and auditable.

### Interest = derived on read (no jobs)
A `Loan` row stores `principalOutstanding` (kept current via repayment postings), `rate`,
`startDate`, `status`. **Interest-to-date** = `outstanding × rate × elapsedPeriods`, computed
when displayed. Nothing is written until interest is actually *paid* (which posts to
`INTEREST_INCOME`). No cron, no loops, always accurate to the second.

---

## 4. Data model (Prisma sketch, Postgres)

```prisma
// Money is BigInt paise everywhere. Never Float.

model Member {
  id        String   @id @default(cuid())
  firstName String
  lastName  String?
  phone     String?
  avatarUrl String?
  status    MemberStatus @default(ACTIVE)
  joinedAt  DateTime @default(now())
  // auth handled by Better Auth (User/Session tables); link via userId
  userId    String?  @unique

  equityAccount   Account? @relation("MemberEquity")
  loanAccount     Account? @relation("MemberLoan")
  loans           Loan[]
  createdAt DateTime @default(now())
  archivedAt DateTime?      // soft archive, never hard-delete
}

model Vendor {
  id        String   @id @default(cuid())
  name      String
  status    VendorStatus @default(ACTIVE)
  receivableAccount Account? @relation("VendorReceivable")
  createdAt DateTime @default(now())
  archivedAt DateTime?
}

model Account {            // ledger account = a balance bucket
  id        String   @id @default(cuid())
  kind      AccountKind
  balance   BigInt   @default(0)   // cached running balance in paise (incremental)
  memberId  String?  // for MEMBER_EQUITY / LOAN_RECEIVABLE
  vendorId  String?  // for VENDOR_RECEIVABLE
  entries   Entry[]
  @@index([kind])
}

model Transaction {        // journal entry (header)
  id          String   @id @default(cuid())
  type        TxnType                // semantic label (DEPOSIT, LOAN_TAKEN, ...)
  occurredAt  DateTime
  description String?
  reference   String?                // cheque/UPI ref
  reversesId  String?  @unique       // if this reverses another txn
  entries     Entry[]
  createdById String?
  createdAt   DateTime @default(now())
  @@index([occurredAt])
  @@index([type, occurredAt])
}

model Entry {              // journal line; SUM(amount) per transaction = 0
  id            String  @id @default(cuid())
  transactionId String
  accountId     String
  amount        BigInt                 // signed paise
  transaction   Transaction @relation(fields: [transactionId], references: [id], onDelete: Restrict)
  account       Account     @relation(fields: [accountId], references: [id])
  @@index([accountId])
  @@index([transactionId])
}

model Loan {
  id                  String @id @default(cuid())
  memberId            String
  principal           BigInt              // original, paise
  principalOutstanding BigInt             // kept current via repayments
  ratePerPeriod       Int                 // e.g. basis points / period
  startedAt           DateTime
  closedAt            DateTime?
  status              LoanStatus @default(ACTIVE)
  // interest accrued/pending = derived on read, NOT stored
}

enum AccountKind { CLUB_CASH MEMBER_EQUITY LOAN_RECEIVABLE VENDOR_RECEIVABLE INTEREST_INCOME VENDOR_PROFIT }
enum TxnType { DEPOSIT WITHDRAW LOAN_TAKEN LOAN_REPAY LOAN_INTEREST VENDOR_INVEST VENDOR_RETURN ADJUSTMENT REVERSAL }
enum MemberStatus { ACTIVE INACTIVE LEFT }
enum VendorStatus { ACTIVE INACTIVE }
enum LoanStatus { ACTIVE CLOSED }
```

### The one critical write path (a service, called by server actions)
```
postTransaction(input):
  in a single prisma.$transaction:
    1. validate: sum(lines) === 0, accounts exist, amounts > 0 where required
    2. create Transaction + its Entries
    3. for each line: Account.balance += line.amount     // incremental, O(lines)
    4. if loan-related: update Loan.principalOutstanding / status
  revalidateTag(...) for the few affected views
```
No replay, no rescans, no recompute of "everything". This single, tested function is the
heart of the system.

---

## 5. Application architecture

```
src/
  app/                      # Next.js App Router (RSC by default)
    (auth)/login
    dashboard/              # overview
    members/  members/[id]
    loans/
    transactions/
    vendors/
    analytics/
    settings/
    profile/
  server/
    actions/                # 'use server' entry points (thin)
    services/               # business logic: postTransaction, loans, members, vendors
    ledger/                 # the double-entry engine + invariants
    queries/                # read models (balances, dashboards, statements)
    auth/                   # Better Auth config + guards
  lib/                      # money (paise<->₹), dates, formatting, validation (zod)
  components/               # UI (kept simple; atoms/molecules/organisms optional)
  db/                       # prisma client
prisma/
  schema.prisma
  seed.ts
```

Principles:
- **Server Components fetch directly** from `server/queries/*` (typed, no HTTP round-trip).
- **Mutations go through `server/actions/*`** → call `server/services/*` → `ledger` engine.
- **No REST API layer** unless/until an external client needs it (then add a thin one).
- **Zod schemas** are the single validation source, shared by actions and forms.
- **Money helpers** are the only place ₹↔paise conversion lives.

### Caching
- Reads cached by Next.js; each query tagged (`balances`, `members`, `loans`, `transactions`).
- After a mutation, `revalidateTag()` only the tags it touched. That's the entire strategy —
  no NodeCache, no ETags, no sessionStorage.

### Auth & roles
- **Better Auth** owns users/sessions (username + password). A `Member.userId` links identity.
- Three roles: `ADMIN` (full write), `MEMBER` (read own + club), optional `SUPER_ADMIN`.
- A single `requireRole()` guard wraps protected actions/pages.

---

## 6. Managing unwanted data (data lifecycle)

- **Append-only ledger**: transactions/entries are never hard-deleted; mistakes use a
  `REVERSAL` transaction (`reversesId`). Full audit trail, no bloat from "edit = delete+create".
- **Soft archive** for members/vendors (`archivedAt`) instead of deletion; archived parties
  drop out of active views but keep history.
- **No materialized blobs** to rot — balances are tiny integers updated in place; everything
  else is derived. There is simply no "passbook payload" to grow stale.
- **Period close (optional later)**: lock a month so its entries are immutable; reporting reads
  locked periods cheaply.
- **Backups/export**: a simple admin "export all" (CSV/JSON) — no custom backup machinery.

---

## 7. Migration from v1 (one-time)

1. Stand up Neon Postgres + run v2 schema.
2. Write a one-shot importer: read v1 Mongo `Transaction`s, map each to a v2 balanced
   `Transaction` + `Entry` set (paise), create members/vendors/accounts/loans.
3. Run **both** systems' numbers against each other: v2 derived totals must equal v1's
   reported totals (this is the correctness gate — reuse the fixtures idea from
   `REDESIGN_PLAN.md`).
4. Cut over once they match; keep v1 read-only as reference for a while.

---

## 8. Phased build plan (new repo)

- **P0 — Foundation:** repo, Next.js, Prisma+Neon, Better Auth, money helpers, CI, the
  `ledger` engine + `postTransaction` with **exhaustive unit tests** (invariants, every TxnType).
- **P1 — Core data + entry:** members, vendors, loans CRUD; the intent-first entry flow
  (from the design briefs) wired to `postTransaction`; transactions ledger view.
- **P2 — Reads & dashboards:** balance queries, dashboard, member statement, loans view,
  vendor view (all derived; interest on read).
- **P3 — Analytics & polish:** trends, exports, empty/loading states, mobile card views.
- **P4 — Migration:** importer + reconciliation against v1; cutover.

Each phase ships independently; correctness (balanced books, matching totals) gates every step.

---

## 9. Trade-offs we accepted (be honest)

- **Double-entry has a learning curve.** Mitigated by isolating it in one engine + tests; the
  payoff is correctness and trivial reporting.
- **Derive-on-read interest** means read queries do a little math. Negligible at this scale and
  removes all background-job complexity.
- **Single-club now** means a future multi-club move needs a `clubId` migration — but we keep
  the seam clean so it's contained, not a rewrite.
- **Postgres** needs a one-time data migration from Mongo. Worth it; done once.

---

## 10. What you get vs v1

- One source of truth, exact money, **O(1) writes**, **no background loops**, **one cache
  layer**, far less code, an auditable ledger, and reporting that's mostly `SELECT`s.
- The UX redesign (`DESIGN_PROMPTS.md`) drops straight onto this backend, since the entry flow
  and all views map cleanly to `postTransaction` + balance reads.
```
</content>
