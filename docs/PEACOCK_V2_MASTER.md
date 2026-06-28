# Peacock v2 — Master Build Document

> **Single source of truth for building the new repository.** Merges architecture, the
> complete data model & schema, every calculation, migration mapping, permissions, and the
> build plan. Supersedes (consolidates) `ARCHITECTURE_V2.md`, `V2_CALCULATIONS.md`, and
> `V2_OPEN_DECISIONS.md` for build purposes; `DESIGN_PROMPTS.md` remains the UI brief.
>
> **Decisions marked `‹DECISION›`** were set to the recommended default because the
> interactive picker was unavailable. Override any of them in one message and I'll update.

---

## 1. What this app is

**Peacock** — a financial club / chit-fund manager. Members pay (stage-based) monthly
deposits; the club lends to members and earns interest; vendors invest club money for returns.
Audiences: an **admin** (daily data entry) and **members** (transparent read access).

Goals of v2: one source of truth, exact money, O(1) writes, **no background loops**, one cache
layer, far less code, an auditable ledger, and reporting that's mostly `SELECT`s.

---

## 2. Locked decisions

| Area | Choice |
|------|--------|
| Database | **PostgreSQL** (Neon free tier) + Prisma |
| Money model | **Double-entry ledger** + incremental cached balances |
| Amounts | **Integer minor units (paise)** — `BigInt` |
| Stack | **Next.js App Router + Server Components + Server Actions** (no REST layer) |
| Time-based interest | **Derive-on-read** — no jobs/cron |
| Auth | **Better Auth** |
| Caching | **Next.js cache + tag revalidation** only |
| Scope | **Single club**, extensible (clean `clubId` seam) |

### Decisions set to recommended defaults `‹DECISION›` (override freely)
1. **Transaction types:** keep **REJOIN** + **FUNDS_TRANSFER** (club-internal, net-zero). No member↔member transfers.
2. **Loans per member:** **multiple concurrent** loans allowed.
3. **Loan status:** **active / closed** only (no separate "overdue").
4. **Interest rounding:** round to **whole rupee** (parity with v1), stored as paise.
5. **Who can log in:** **admins + opt-in members**; vendors do **not** log in.
6. **Roles:** `SUPER_ADMIN`, `ADMIN`, `MEMBER`.
7. **Member visibility:** members get **full read transparency** (club summary + all members/
   loans/vendors/transactions), **no write**. (Matches the club's transparency value.)
8. **Edit/delete:** **admin only**, always via **reversal** (audited); allowed unless the
   month is locked. Period-locking seam built, **off by default**.
9. **File/avatar storage:** **Vercel Blob**.
10. **Config storage:** a single-row **`ClubConfig`** table, editable in Settings (no hardcoding).
11. **Timezone:** **Asia/Kolkata (IST)** for all month boundaries.
12. **Sign convention:** assets/receivables **positive**, equity & income **negative**.
13. **Legacy offsets:** `joiningOffset` + `delayOffset` → `ADJUSTMENT` postings at migration.
14. **Member ↔ User:** separate entities, **optional** link (`Member.userId` nullable).
15. **Graphs:** computed **live from the ledger**; optional rollup cache only if needed later.
16. **Analytics series:** portfolio value, available cash, outstanding loans, deposits/month,
    interest/month, member-vs-club-average.
17. **P2 extras:** optimistic UI on the entry drawer; **defer** notifications, PWA/offline.

---

## 3. Domain model — double-entry ledger

Every financial event is **one balanced transaction**: signed line entries that **sum to
zero**. Each line hits a **ledger account**; each ledger account keeps a cached running
**balance** updated in the *same* DB transaction as the write.

### Chart of accounts (`LedgerAccountKind`)
- `CLUB_CASH` — club money on hand (one).
- `MEMBER_EQUITY` — one per member; their stake in the club.
- `LOAN_RECEIVABLE` — one per member; principal currently owed.
- `VENDOR_RECEIVABLE` — one per vendor; principal placed with the vendor.
- `INTEREST_INCOME` — club income from loan interest (one).
- `VENDOR_PROFIT` — one per vendor; realized profit.

### Posting spec (replaces v1's `settings.ts` accumulator DSL)
`A` = amount, `P` = principal portion. Every row sums to 0. Signs follow decision 12.

| TxnType | Postings (signed paise) |
|---------|-------------------------|
| `PERIODIC_DEPOSIT` | `CLUB_CASH +A`, `MEMBER_EQUITY(m) −A` |
| `OFFSET_DEPOSIT` / `ADJUSTMENT` | `CLUB_CASH +A`, `MEMBER_EQUITY(m) −A` |
| `WITHDRAW` | `CLUB_CASH −A`, `MEMBER_EQUITY(m) +A` |
| `REJOIN` | reverses a prior withdraw: `CLUB_CASH +A`, `MEMBER_EQUITY(m) −A` |
| `FUNDS_TRANSFER` | club-internal; net-zero on club value (cash sub-bucket move) |
| `LOAN_TAKEN` | `CLUB_CASH −A`, `LOAN_RECEIVABLE(m) +A` |
| `LOAN_REPAY` | `CLUB_CASH +A`, `LOAN_RECEIVABLE(m) −A` |
| `LOAN_INTEREST` | `CLUB_CASH +A`, `INTEREST_INCOME −A` |
| `VENDOR_INVEST` | `CLUB_CASH −A`, `VENDOR_RECEIVABLE(v) +A` |
| `VENDOR_RETURN` | `CLUB_CASH +A`, `VENDOR_RECEIVABLE(v) −P`, `VENDOR_PROFIT(v) −(A−P)` |
| `REVERSAL` | negated copy of a target transaction's lines |

---

## 4. Final schema (`prisma/schema.prisma`)

> Note: ledger accounts are named **`LedgerAccount`** to avoid clashing with Better Auth's
> own `Account`/`Session`/`User`/`Verification` tables (Better Auth manages those).

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

// ---------- Identity ----------
model Member {
  id         String   @id @default(cuid())
  firstName  String
  lastName   String?
  phone      String?
  avatarUrl  String?
  status     MemberStatus @default(ACTIVE)
  joinedAt   DateTime @default(now())
  userId     String?  @unique          // optional Better Auth user link
  equity     LedgerAccount? @relation("MemberEquity")
  loanAcct   LedgerAccount? @relation("MemberLoan")
  loans      Loan[]
  archivedAt DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model Vendor {
  id          String   @id @default(cuid())
  name        String
  status      VendorStatus @default(ACTIVE)
  receivable  LedgerAccount? @relation("VendorReceivable")
  profitAcct  LedgerAccount? @relation("VendorProfit")
  startedAt   DateTime @default(now())
  closedAt    DateTime?
  archivedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ---------- Ledger ----------
model LedgerAccount {
  id        String   @id @default(cuid())
  kind      LedgerAccountKind
  balance   BigInt   @default(0)        // cached running balance (paise)
  memberId  String?  @unique
  vendorId  String?
  entries   Entry[]
  createdAt DateTime @default(now())
  @@index([kind])
  @@index([vendorId])
}

model Transaction {
  id          String   @id @default(cuid())
  type        TxnType
  occurredAt  DateTime                  // drives month bucketing
  description String?
  reference   String?
  reversesId  String?  @unique          // set when this reverses another txn
  loanId      String?                   // link for loan-related txns
  entries     Entry[]
  createdById String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([occurredAt])
  @@index([type, occurredAt])
  @@index([loanId])
}

model Entry {                            // journal line; SUM(amount) per txn = 0
  id            String  @id @default(cuid())
  transactionId String
  accountId     String
  amount        BigInt                   // signed paise
  transaction   Transaction   @relation(fields: [transactionId], references: [id], onDelete: Restrict)
  account       LedgerAccount @relation(fields: [accountId], references: [id])
  @@index([accountId])
  @@index([transactionId])
}

model Loan {
  id                   String   @id @default(cuid())
  memberId             String
  member               Member   @relation(fields: [memberId], references: [id])
  principal            BigInt
  principalOutstanding BigInt                 // kept current via repayments
  monthlyRateBps       Int                    // basis points/month (from ClubConfig default)
  startedAt            DateTime
  closedAt             DateTime?
  status               LoanStatus @default(ACTIVE)
  createdAt            DateTime @default(now())
  @@index([memberId])
  @@index([status])
}

// ---------- Config & audit ----------
model ClubConfig {
  id            String   @id @default("singleton")
  name          String
  startedAt     DateTime
  monthlyRateBps Int                          // default loan interest, basis points/month
  stages        Json                          // [{ amount, startDate, endDate? }] stage-based deposit
  timezone      String   @default("Asia/Kolkata")
  updatedAt     DateTime @updatedAt
}

model AuditLog {
  id         String   @id @default(cuid())
  actorId    String?
  action     String                          // e.g. "txn.create", "txn.reverse"
  entityType String
  entityId   String
  meta       Json?
  createdAt  DateTime @default(now())
  @@index([entityType, entityId])
}

// Optional, added only if graphs need it later (deterministically rebuilt from ledger):
// model MonthlyRollup { month DateTime @id; data Json; builtAt DateTime }

enum LedgerAccountKind { CLUB_CASH MEMBER_EQUITY LOAN_RECEIVABLE VENDOR_RECEIVABLE INTEREST_INCOME VENDOR_PROFIT }
enum TxnType { PERIODIC_DEPOSIT OFFSET_DEPOSIT ADJUSTMENT WITHDRAW REJOIN FUNDS_TRANSFER LOAN_TAKEN LOAN_REPAY LOAN_INTEREST VENDOR_INVEST VENDOR_RETURN REVERSAL }
enum MemberStatus { ACTIVE INACTIVE LEFT }
enum VendorStatus { ACTIVE INACTIVE CLOSED }
enum LoanStatus { ACTIVE CLOSED }
```

Better Auth adds its own `User`, `Session`, `Account`, `Verification` tables (via its Prisma
adapter). `Member.userId` references `User.id`. App roles (`SUPER_ADMIN`/`ADMIN`/`MEMBER`)
live on the Better Auth user (custom field) or a small `UserRole` mapping.

---

## 5. The one critical write path

```
postTransaction(input):                       # the heart of the system
  in prisma.$transaction:
    1. validate: sum(lines) === 0; accounts exist; amounts > 0 where required
    2. create Transaction + Entries
    3. for each line: LedgerAccount.balance += line.amount    # incremental, O(lines)
    4. if loan-related: update Loan.principalOutstanding / status
    5. write AuditLog
  revalidateTag(affectedTags)                 # only what changed

reverseTransaction(id):  post a REVERSAL with negated lines (same engine)
editTransaction(id, input): reverseTransaction(id) + postTransaction(corrected)  # atomic
```
No replay, no rescans, no recompute-everything. An edit costs O(lines), same as a write.

---

## 6. Calculations — how every figure is derived

Every number is one of four kinds: **stock** (account balance), **flow** (`SUM` of typed
entries), **expected/config** (pure function), or **derived-on-read** (interest, pending).

### Member figures (member `m`)
| Figure | Derivation |
|--------|-----------|
| Periodic deposits | `SUM` of `m`'s `PERIODIC_DEPOSIT` entries |
| Adjustments | `SUM` of `m`'s `OFFSET_DEPOSIT`/`ADJUSTMENT` entries |
| Balance / total deposits | `MEMBER_EQUITY(m)` balance |
| Withdrawals | `SUM` of `m`'s `WITHDRAW` entries |
| Profit withdrawn | `SUM` of the portion of `WITHDRAW` beyond principal (rule §7) |
| Loan outstanding | `LOAN_RECEIVABLE(m)` balance |
| Loan taken / repaid | `SUM` of `m`'s `LOAN_TAKEN` / `LOAN_REPAY` |
| Interest paid | `SUM` of `m`'s `LOAN_INTEREST` |
| Interest pending | on read: `Σ activeLoans interestToDate(loan) − interestPaid` |
| Expected deposit (to date) | `getMemberTotalDeposit(now)` over `ClubConfig.stages` |
| Pending contribution | `expected + offsetExpected − (periodic+offset)` (uses contributions, not balance) |

### Dashboard / club statistics
```
activeMembers              = COUNT(members status=ACTIVE)
clubAgeMonths              = monthsSince(ClubConfig.startedAt)   # IST

totalDeposits (expected)   = getMemberTotalDeposit(now) * activeMembers
memberDepositsPaid         = SUM(PERIODIC_DEPOSIT)
memberBalance              = memberDepositsPaid − totalDeposits
totalMemberPending         = Σ_active( expected + offsetExpected − (periodic+offset) )

profitWithdrawals          = SUM(profit portion of WITHDRAW)
memberAdjustments          = SUM(ADJUSTMENT)
pendingAdjustments         = max(0, expectedAdjustments − receivedAdjustments)

totalLoanGiven (lifetime)  = SUM(LOAN_TAKEN)
totalInterestCollected     = INTEREST_INCOME balance
currentLoanTaken (o/s)     = Σ LOAN_RECEIVABLE balances
expectedTotalLoanInterest  = Σ_loans interestToDate(loan)            # derived on read
interestBalance            = max(0, expectedTotalLoanInterest − totalInterestCollected)

vendorProfit               = Σ vendor P&L (active: max(net,0); closed: net)
vendorInvestment (holding) = Σ VENDOR_RECEIVABLE balances
totalProfit                = vendorProfit + totalInterestCollected
totalInvested              = currentLoanTaken + vendorInvestment
pendingAmounts             = totalMemberPending + interestBalance

availableCash              = CLUB_CASH balance
currentValue               = availableCash + currentLoanTaken + vendorInvestment
totalPortfolioValue        = currentValue + interestBalance + totalMemberPending
```

### Interest (the one time-based number)
```
interestToDate(loan, asOf) = outstanding × MONTH_RATE × monthsElapsed
                           + (outstanding × MONTH_RATE / daysInMonth) × extraDays
# MONTH_RATE = ClubConfig.monthlyRateBps; rounded to whole rupee (decision 4)
```

### Analytics graphs (per month, live from the ledger)
- **As-of balance** (portfolio, cash, outstanding at month-end):
  `balanceAsOf(acct, monthEnd) = Σ amount WHERE account=acct AND occurredAt <= monthEnd`
- **Per-month flow** (deposits/interest/loans in month M):
  `Σ amount WHERE type=t AND occurredAt IN [monthStart,monthEnd] GROUP BY month`
- **Interest through month M** = `Σ loans interestToDate(loan, monthEnd)`
- Historical add/edit/delete reflects **instantly** (computed from entries, not snapshots);
  re-dating moves a txn between buckets automatically.

---

## 7. Business rules (must carry over verbatim — unit-tested)

1. **Pending uses contributions, not balance** (a member who withdrew principal doesn't owe it back).
2. **Profit-withdrawal split**: a `WITHDRAW` beyond principal is booked as profit withdrawn.
3. **Vendor profit recognition**: active vendor `max(returns−invested,0)`; closed `returns−invested`.
4. **Current value = asset-side identity**: `cash + outstanding loans + vendor holding`.
5. **Interest = monthly rate + pro-rated days, rounded to ₹**.
6. **Stage-based expected deposits** from `ClubConfig.stages`.

---

## 8. Migration v1 → v2 (one-time, with reconciliation gate)

1. Stand up Neon + apply v2 schema; seed `ClubConfig` from current `clubConfig` values.
2. Create `LedgerAccount`s: one `CLUB_CASH`, `INTEREST_INCOME`; per member `MEMBER_EQUITY` +
   `LOAN_RECEIVABLE`; per vendor `VENDOR_RECEIVABLE` + `VENDOR_PROFIT`.
3. For each v1 `Transaction` (ordered by date) → emit the balanced v2 postings from §3;
   `postTransaction` keeps balances correct as it goes.
4. Map per-member `joiningOffset` + `delayOffset` → one `ADJUSTMENT` posting each.
5. Rebuild `Loan` rows from v1 loan history (principal, rate, start/close, status).
6. **Reconcile**: v2-derived totals (every figure in §6) must equal v1's reported numbers.
   This is the hard pass/fail gate — fixtures captured from current prod data.
7. Cut over; keep v1 read-only as reference.

---

## 9. Permissions matrix

| Capability | SUPER_ADMIN | ADMIN | MEMBER |
|------------|:-----------:|:-----:|:------:|
| View club dashboard & statistics | ✓ | ✓ | ✓ |
| View all members / loans / vendors / transactions | ✓ | ✓ | ✓ (read) |
| View own member statement | ✓ | ✓ | ✓ |
| Create / edit / reverse transactions | ✓ | ✓ | — |
| Manage members / vendors / loans | ✓ | ✓ | — |
| Edit club config & run maintenance | ✓ | ✓ | — |
| Lock/unlock periods | ✓ | ✓ | — |
| Manage admins & roles | ✓ | — | — |

One `requireRole()` guard wraps protected actions/pages.

---

## 10. App architecture & structure

```
src/
  app/                      # App Router (RSC by default)
    (auth)/login
    dashboard/  members/[id]  loans/  transactions/  vendors/  analytics/  settings/  profile/
  server/
    ledger/                 # double-entry engine + invariants (the core, fully tested)
    services/               # postTransaction, reverse/edit, member/vendor/loan/config CRUD
    actions/                # 'use server' thin entry points → services
    queries/                # read models: balances, dashboard, statements, graphs
    auth/                   # Better Auth config + requireRole guard
  lib/                      # money (paise<->₹), dates (IST), zod schemas, formatting
  components/               # UI per DESIGN_PROMPTS.md
  db/                       # prisma client
prisma/  schema.prisma  seed.ts  migrate-from-v1.ts
```
- Server Components read directly from `server/queries/*` (no HTTP).
- Mutations: `actions/*` → `services/*` → `ledger`. No REST layer.
- One cache layer: tag-based `revalidateTag()` after mutations.
- Money conversion lives only in `lib/money`.

### Service / action contract (build list)
- Mutations: `postTransaction`, `reverseTransaction`, `editTransaction`, member CRUD, vendor
  CRUD, loan open/close, `updateClubConfig`, `lockPeriod`.
- Queries: `getDashboard`, `getMemberStatement`, `listMembers`, `listLoans`, `listVendors`,
  `listTransactions`, `getGraphSeries`. All inputs/outputs validated by Zod.

---

## 11. Build phases

- **P0 — Foundation:** repo, Next.js, Prisma+Neon, Better Auth, `lib/money`+`lib/date`, CI;
  the `ledger` engine + `postTransaction`/`reverse` with **exhaustive unit tests** (invariants,
  every TxnType, all §7 rules) gated by v1 fixtures.
- **P1 — Core data + entry:** ClubConfig, members/vendors/loans CRUD; intent-first entry
  drawer (DESIGN_PROMPTS §4) wired to `postTransaction`; transactions ledger view.
- **P2 — Reads & dashboards:** balance queries, dashboard, member statement, loans, vendors
  (all derived; interest on read).
- **P3 — Analytics & polish:** live graph series, exports, empty/loading states, mobile cards.
- **P4 — Migration:** `migrate-from-v1.ts` + reconciliation; cutover.

Correctness (balanced books, totals matching v1) gates every phase.

---

## 12. Open decisions recap (override any in one reply)

All 17 items in §2 are set to recommended defaults. The ones most worth your confirmation:
- (5) member login scope, (7) member read-transparency, (8) edit-via-reversal + period lock,
  (9) Vercel Blob for files, (10) ClubConfig table, (3) no "overdue" status.

Reply with any changes (e.g. "members can't see other members' detail", "add overdue at 12
months", "use Cloudinary") and I'll update this doc, then we scaffold the repo.
```
</content>
