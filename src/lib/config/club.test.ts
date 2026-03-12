import { describe, expect, it } from "vitest";

import { clubMonthsFromStart, getMemberTotalDeposit } from "@/lib/config/club";

describe("getMemberTotalDeposit", () => {
  it("returns 0 for a date before club started", () => {
    const result = getMemberTotalDeposit(new Date("2020-01-01"));
    expect(result).toBe(0);
  });

  it("calculates correct deposit for alpha stage (₹1000/month)", () => {
    // Alpha: Sep 2020 – Sep 2023, ₹1000/month
    // 12 months from Sep 2020 to Sep 2021
    const result = getMemberTotalDeposit(new Date("2021-09-01"));
    expect(result).toBe(12 * 1000);
  });

  it("calculates correct deposit spanning into bravo stage (₹2000/month)", () => {
    // Alpha: Sep 2020 – Sep 2023 = 36 months at ₹1000 = ₹36,000
    // Bravo: Sep 2023 onwards at ₹2000
    // Up to Jan 2024 = ~4 months at ₹2000 in bravo
    const result = getMemberTotalDeposit(new Date("2024-01-01"));
    expect(result).toBeGreaterThan(36000); // At least alpha stage complete
  });

  it("returns positive number for current date", () => {
    const result = getMemberTotalDeposit();
    expect(result).toBeGreaterThan(0);
  });
});

describe("clubMonthsFromStart", () => {
  it("returns 1 for the club start month", () => {
    const result = clubMonthsFromStart(new Date("2020-09-15"));
    expect(result).toBe(1);
  });

  it("returns correct months for a known date", () => {
    // Sep 2020 to Sep 2021 = 12 months + 1 = 13
    const result = clubMonthsFromStart(new Date("2021-09-01"));
    expect(result).toBe(13);
  });

  it("returns positive for current date", () => {
    const result = clubMonthsFromStart();
    expect(result).toBeGreaterThan(0);
  });
});
