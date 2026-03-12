import { Transaction } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { calculateLoanDetails } from "@/lib/calculators/loan-calculator";

// Helper to create a mock transaction
function mockTransaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: "test-" + Math.random().toString(36).slice(2),
    fromId: "club",
    toId: "member1",
    amount: 0,
    currency: "INR",
    type: "PERIODIC_DEPOSIT",
    method: "ACCOUNT",
    occurredAt: new Date(),
    postedAt: null,
    referenceId: null,
    description: null,
    tags: [],
    createdById: null,
    updatedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("calculateLoanDetails", () => {
  it("returns empty history for no transactions", () => {
    const { loanHistory, totalLoanBalance } = calculateLoanDetails([]);
    expect(loanHistory).toHaveLength(0);
    expect(totalLoanBalance).toBe(0);
  });

  it("creates a single active loan entry for one LOAN_TAKEN", () => {
    const transactions = [
      mockTransaction({
        type: "LOAN_TAKEN",
        amount: 50000,
        occurredAt: new Date("2024-01-15"),
        toId: "member1",
      }),
    ];

    const { loanHistory, totalLoanBalance } =
      calculateLoanDetails(transactions);
    expect(totalLoanBalance).toBe(50000);
    expect(loanHistory).toHaveLength(1);
    expect(loanHistory[0]!.active).toBe(true);
    expect(loanHistory[0]!.amount).toBe(50000);
  });

  it("handles full repayment correctly", () => {
    const transactions = [
      mockTransaction({
        type: "LOAN_TAKEN",
        amount: 50000,
        occurredAt: new Date("2024-01-15"),
        toId: "member1",
      }),
      mockTransaction({
        type: "LOAN_REPAY",
        amount: 50000,
        occurredAt: new Date("2024-03-15"),
        fromId: "member1",
      }),
    ];

    const { loanHistory, totalLoanBalance } =
      calculateLoanDetails(transactions);
    expect(totalLoanBalance).toBe(0);
    expect(loanHistory).toHaveLength(1);
    expect(loanHistory[0]!.active).toBe(false);
  });

  it("handles partial repayment (new segment with remaining balance)", () => {
    const transactions = [
      mockTransaction({
        type: "LOAN_TAKEN",
        amount: 100000,
        occurredAt: new Date("2024-01-15"),
        toId: "member1",
      }),
      mockTransaction({
        type: "LOAN_REPAY",
        amount: 60000,
        occurredAt: new Date("2024-03-15"),
        fromId: "member1",
      }),
    ];

    const { loanHistory, totalLoanBalance } =
      calculateLoanDetails(transactions);
    expect(totalLoanBalance).toBe(40000);
    // First segment closed (100000), second active (40000)
    expect(loanHistory).toHaveLength(2);
    expect(loanHistory[0]!.active).toBe(false);
    expect(loanHistory[0]!.amount).toBe(100000);
    expect(loanHistory[1]!.active).toBe(true);
    expect(loanHistory[1]!.amount).toBe(40000);
  });

  it("handles multiple loans stacking up", () => {
    const transactions = [
      mockTransaction({
        type: "LOAN_TAKEN",
        amount: 50000,
        occurredAt: new Date("2024-01-15"),
        toId: "member1",
      }),
      mockTransaction({
        type: "LOAN_TAKEN",
        amount: 30000,
        occurredAt: new Date("2024-02-15"),
        toId: "member1",
      }),
    ];

    const { loanHistory, totalLoanBalance } =
      calculateLoanDetails(transactions);
    expect(totalLoanBalance).toBe(80000);
    expect(loanHistory).toHaveLength(2);
    expect(loanHistory[0]!.amount).toBe(50000);
    expect(loanHistory[1]!.active).toBe(true);
    expect(loanHistory[1]!.amount).toBe(80000);
  });
});
