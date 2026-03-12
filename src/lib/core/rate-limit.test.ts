import { describe, expect, it } from "vitest";

import { checkRateLimit } from "@/lib/core/rate-limit";

describe("checkRateLimit", () => {
  it("allows first request", () => {
    const result = checkRateLimit("test:unique1", {
      maxRequests: 3,
      windowSeconds: 60,
    });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("decrements remaining count", () => {
    const key = "test:unique2";
    const config = { maxRequests: 3, windowSeconds: 60 };

    checkRateLimit(key, config); // 1st
    const result2 = checkRateLimit(key, config); // 2nd
    expect(result2.remaining).toBe(1);

    const result3 = checkRateLimit(key, config); // 3rd
    expect(result3.remaining).toBe(0);
    expect(result3.allowed).toBe(true);
  });

  it("blocks after limit exceeded", () => {
    const key = "test:unique3";
    const config = { maxRequests: 2, windowSeconds: 60 };

    checkRateLimit(key, config); // 1st
    checkRateLimit(key, config); // 2nd (at limit)

    const result = checkRateLimit(key, config); // 3rd (over limit)
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("returns resetAt timestamp in the future", () => {
    const result = checkRateLimit("test:unique4", {
      maxRequests: 5,
      windowSeconds: 120,
    });
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });
});
