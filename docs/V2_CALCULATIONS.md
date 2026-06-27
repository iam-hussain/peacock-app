# Peacock v2 — How every number is calculated (vs v1)

> This maps **every figure shown today** (dashboard, statistics, member details) to **how
> v2 derives it from the double-entry ledger**. Source of v1 behavior:
> `src/logic/settings.ts` (per-transaction accumulator DSL),
> `src/lib/calculators/club-aggregates.ts`, `src/lib/calculators/member-club-stats.ts`,
> `src/lib/transformers/dashboard-summary.ts`, `src/lib/config/club.ts`,
> `src/lib/helper.ts` (interest). **All business rules below are preserved exactly.**

---

## 0. The core insight

In v1 every number is one of four things, even though they're all jammed into JSON
`payload` fields and recomputed eagerly:

| Kind | v1 (today) | v2 (clean) |
|------|-----------|-----------|
| **Stock** (a balance "right now") | hand-maintained payload field e.g. `availableCashBalance`, `loansOutstanding`, `memberBalance` | a **ledger account balance** (cached integer, updated incrementally per posting) |
| **Lifetime flow** (a running total) | payload field e.g. `loansPrincipalDisbursed`, `interestCollectedTotal`, `memberPeriodicDepositsTotal` | `SUM(entry.amount)` filtered by txn type / account — a cheap indexed query (or an optional counter) |
| **Expected / config** | `getMemberTotalDeposit()` over stage config | **identical pure function** of club stage config + time |
| **Derived-on-read** | recomputed (expensively) on every read/write | computed on read: interest-to-date, pending = expected − actual |

So v2 doesn't need a "passbook" at all. Stocks live as account balances; flows are
`SUM`s; expected is config; derived is read-time math. Same formulas, no eager recompute.

---

## 1. The accumulator DSL → ledger postings

v1's `settings.ts` says, per transaction type, which payload fields to ADD/SUB. That table
**is** a double-entry posting spec in disguise. Translation:

| v1 transaction | v1 payload effects (FROM/TO/CLUB) | v2 balanced postings (signed paise) |
|----------------|-----------------------------------|-------------------------------------|
| `PERIODIC_DEPOSIT` | member `periodicDepositsTotal/totalDeposits/memberBalance +`; club `memberPeriodicDepositsTotal/availableCashBalance/netClubValue +` | `CLUB_CASH +A`, `MEMBER_EQUITY(m) −A` |
| `OFFSET_DEPOSIT` | member `offsetDepositsTotal +…`; club `memberOffsetDepositsTotal +…` | `CLUB_CASH +A`, `MEMBER_EQUITY(m) −A` *(tagged `ADJUSTMENT`)* |
| `WITHDRAW` | member `withdrawalsTotal +`, `profitWithdrawalsTotal += DEPOSIT_DIFF`, `memberBalance −`; club cash − | `CLUB_CASH −A`, `MEMBER_EQUITY(m) +A` |
| `LOAN_TAKEN` | member `loansOutstanding/loansPrincipalTaken +`; club `loansOutstanding/loansPrincipalDisbursed +`, cash − | `CLUB_CASH −A`, `LOAN_RECEIVABLE(m) +A` |
| `LOAN_REPAY` | member `loansPrincipalRepaid +`, `loansOutstanding −`; club cash + | `CLUB_CASH +A`, `LOAN_RECEIVABLE(m) −A` |
| `LOAN_INTEREST` | member `interestPaidTotal +`; club `interestCollectedTotal/cash +` | `CLUB_CASH +A`, `INTEREST_INCOME −A` |
| `VENDOR_INVEST` | vendor `investmentTotal/currentBalance +`; club `vendorInvestmentTotal +`, cash − | `CLUB_CASH −A`, `VENDOR_RECEIVABLE(v) +A` |
| `VENDOR_RETURNS` | vendor `returnsTotal +`, `currentBalance −`; club `vendorReturnsTotal/cash +` | `CLUB_CASH +A`, `VENDOR_RECEIVABLE(v) −P`, `VENDOR_PROFIT(v) −(A−P)` |

`A` = amount; `P` = principal portion of a vendor return. Every row sums to 0.

> The signed-balance convention (asset accounts positive, equity/income negative) is what
> makes `netClubValue` fall out automatically instead of being a hand-summed field.

---

## 2. Member details — each figure in v2

For member `m`, with `paise` integers throughout:

| Shown today | v1 source | v2 derivation |
|-------------|-----------|---------------|
| Periodic deposits | `periodicDepositsTotal` | `SUM(entry.amount)` over `m`'s `DEPOSIT` postings to `MEMBER_EQUITY` |
| Adjustments / offset | `offsetDepositsTotal` | `SUM` over `m`'s `ADJUSTMENT` postings |
| Total deposits / balance | `memberBalance` | `MEMBER_EQUITY(m)` **account balance** (= deposits + adjustments − withdrawals) |
| Withdrawals | `withdrawalsTotal` | `SUM` over `m`'s `WITHDRAW` postings |
| Profit withdrawn | `profitWithdrawalsTotal` | `SUM` of the `DEPOSIT_DIFF` portion (withdrawal beyond principal) — rule preserved (see §5) |
| Loan outstanding | `loansOutstanding` | `LOAN_RECEIVABLE(m)` **account balance** |
| Loan principal taken / repaid | `loansPrincipalTaken/Repaid` | `SUM` of `m`'s `LOAN_TAKEN` / `LOAN_REPAY` |
| Interest paid | `interestPaidTotal` | `SUM` of `m`'s `LOAN_INTEREST` |
| **Interest pending (to date)** | derived | **on read**: `Σ activeLoans interestToDate(loan)` − interest already paid (see §4) |
| **Expected deposit (to date)** | `getMemberTotalDeposit()` | **identical** stage-config function of time |
| **Pending contribution** | `expected + offsetExpected − (periodic+offset)` | same formula; uses contributions, **not** balance, so past withdrawals don't create phantom debt (rule preserved) |
| Expected return / profit share | `totalReturnPerMember` | `availableProfit / activeMemberCount` (see §3) |
| Current value | per-member | equity balance + profit share − amounts already withdrawn (same as today) |

---

## 3. Club statistics — each figure in v2

| Statistic | v1 | v2 |
|-----------|----|----|
| Active members | count of `ACTIVE` | `COUNT(members WHERE status=ACTIVE)` |
| Club age (months) | `clubMonthsFromStart()` | identical date function |
| Total offset/adjustments | Σ member offsets | `SUM` of all `ADJUSTMENT` postings |
| Total interest collected | `interestCollectedTotal` | `INTEREST_INCOME` balance (= Σ `LOAN_INTEREST`) |
| Total vendor profit | Σ max(returns−invested,0) per vendor | Σ `VENDOR_PROFIT` balances, with active/inactive rule (§5) |
| Total profit collected | `offset + interestCollected + vendorProfit` | same, from the three sources above |
| Available profit | `totalProfitCollected − profitWithdrawals` | same |
| Return per member | `availableProfit / activeMembers` | same |
| **Expected total loan interest** | recompute over all loans | **on read**: `Σ loans interestToDate(loan)` (§4) |
| Interest balance | `expectedInterest − collected` (≥0) | same |
| Expected loan-profit per member | `interestBalance / activeMembers` | same |

---

## 4. Dashboard tiles — exact formulas in v2

All terms below are ledger reads (balances or `SUM`s) or the config/derived helpers.

```
activeMembers              = COUNT(members status=ACTIVE)
clubAgeMonths              = monthsSince(clubStart)

# Member funds
totalDeposits (expected)   = getMemberTotalDeposit(now) * activeMembers      # config × count
memberDepositsPaid         = SUM(DEPOSIT)                                     # ledger flow
memberBalance              = memberDepositsPaid − totalDeposits
totalMemberPending         = Σ_active( expected + offsetExpected − (periodic+offset) )

# Member outflow
profitWithdrawals          = SUM(profit portion of WITHDRAW)
memberAdjustments          = SUM(ADJUSTMENT)
pendingAdjustments         = max(0, expectedAdjustments − receivedAdjustments)

# Loans
totalLoanGiven (lifetime)  = SUM(LOAN_TAKEN)
totalInterestCollected     = INTEREST_INCOME balance
currentLoanTaken (o/s)     = Σ LOAN_RECEIVABLE balances
interestBalance            = max(0, expectedTotalLoanInterest − totalInterestCollected)   # expected = derived-on-read (§ below)

# Vendor
vendorProfit               = Σ vendor P&L (active: max(net,0); inactive: net)
vendorInvestment (holding) = vendorInvestmentTotal − (vendorReturnsTotal − vendorProfit)
                           = Σ VENDOR_RECEIVABLE balances (equivalently)

# Cash flow
totalProfit                = vendorProfit + totalInterestCollected
totalInvested              = currentLoanTaken + vendorInvestment(holding)
pendingAmounts             = totalMemberPending + interestBalance

# Valuation / portfolio
availableCash              = CLUB_CASH balance
currentValue               = availableCash + currentLoanTaken + vendorInvestment(holding)
totalPortfolioValue        = currentValue + interestBalance + totalMemberPending
```

These are **the same formulas** as `dashboard-summary.ts` today — only the *inputs* change
from hand-maintained JSON fields to ledger reads. No behavior change, no eager recompute.

### Expected total loan interest (the one genuinely time-based number)
```
interestToDate(loan) = outstanding × MONTH_RATE × monthsElapsed
                     + (outstanding × MONTH_RATE / daysInMonth) × extraDaysElapsed
expectedTotalLoanInterest = Σ_loans interestToDate(loan)      # computed ON READ
```
This is exactly `calculateInterestByAmount()` from `src/lib/helper.ts` (monthly rate +
pro-rated days, rounded). In v2 it runs at read time for active loans only — no stored
`expectedTotalLoanInterest`, no recompute-on-write, no background job.

---

## 5. Business rules that MUST carry over verbatim

1. **Pending uses contributions, not balance.** `pending = expected + offset − (periodic+offset deposits)`,
   so a member who withdrew principal doesn't appear to "owe" it back.
   (`club-aggregates.ts:83-95`.)
2. **Profit-withdrawal split (`DEPOSIT_DIFF`).** A `WITHDRAW` beyond the member's principal is
   booked as profit withdrawn, not principal. (`settings.ts:88-96`.)
3. **Vendor profit recognition.** Active vendor → `max(returns−invested, 0)`; closed/inactive
   vendor → full `returns−invested`. (`dashboard-summary.ts:135-141`.)
4. **Current value = asset-side identity** `cash + loansOutstanding + vendorHolding` — never the
   old equity-side sum that over-counted withdrawals. (`dashboard-summary.ts:161-169`.)
5. **Interest = monthly rate + pro-rated days, rounded** (`helper.ts:262-293`).
6. **Stage-based expected deposits** (the club raised the monthly amount over time) — driven by
   `clubConfig.stages`. (`config/club.ts`.)

These live in small, **unit-tested** pure functions in `server/queries/*` and the `ledger`
engine — the same characterization fixtures (v1 numbers) gate them.

---

## 6. Why this is better

- **No passbook, no payload JSON, no eager recompute.** Stocks are account balances updated
  O(1) per posting; flows are indexed `SUM`s; expected/interest are read-time pure functions.
- **Auditable**: every figure traces to ledger entries; corrections are reversing entries.
- **Cheap reads**: a dashboard is a handful of balance reads + a few `SUM`s + one interest
  pass over active loans — all indexed, all small.
- **Identical outputs**: every formula above matches v1, so the migration reconciliation
  (v2 totals == v1 reported totals) is a hard pass/fail gate.
```
</content>
