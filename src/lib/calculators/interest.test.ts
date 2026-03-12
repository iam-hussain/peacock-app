import { describe, expect, it } from "vitest";

import { calculateInterestByAmount, ONE_MONTH_RATE } from "@/lib/helper";

describe("calculateInterestByAmount", () => {
  it("calculates zero interest for zero amount", () => {
    const result = calculateInterestByAmount(0, "2024-01-01", "2024-06-01");
    expect(result.interestAmount).toBe(0);
  });

  it("calculates interest for exactly 1 month", () => {
    const result = calculateInterestByAmount(10000, "2024-01-01", "2024-02-01");
    // 10000 * 0.01 * 1 month = 100
    expect(result.interestAmount).toBe(100);
    expect(result.monthsPassed).toBe(1);
    expect(result.daysPassed).toBe(0);
  });

  it("calculates interest for multiple months", () => {
    const result = calculateInterestByAmount(10000, "2024-01-01", "2024-04-01");
    // 10000 * 0.01 * 3 months = 300
    expect(result.interestAmount).toBe(300);
    expect(result.monthsPassed).toBe(3);
  });

  it("prorates interest for partial months", () => {
    const result = calculateInterestByAmount(10000, "2024-01-01", "2024-01-16");
    // 15 days of January (31 days in month)
    // 10000 * 0.01 / 31 * 15 ≈ 48.39 → rounds to 48
    expect(result.monthsPassed).toBe(0);
    expect(result.daysPassed).toBe(15);
    expect(result.interestAmount).toBeGreaterThan(0);
    expect(result.interestAmount).toBeLessThan(100);
  });

  it("handles same start and end date (zero interest)", () => {
    const result = calculateInterestByAmount(10000, "2024-01-01", "2024-01-01");
    expect(result.interestAmount).toBe(0);
    expect(result.monthsPassed).toBe(0);
    expect(result.daysPassed).toBe(0);
  });

  it("uses default rate of 1% per month", () => {
    expect(ONE_MONTH_RATE).toBe(0.01);
  });

  it("returns correct date objects", () => {
    const result = calculateInterestByAmount(10000, "2024-01-15", "2024-03-15");
    expect(result.startDate).toBeInstanceOf(Date);
    expect(result.endDate).toBeInstanceOf(Date);
  });

  it("handles large amounts correctly", () => {
    const result = calculateInterestByAmount(200000, "2024-01-01", "2024-06-01");
    // 200000 * 0.01 * 5 months = 10000
    expect(result.interestAmount).toBe(10000);
  });
});
