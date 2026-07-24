import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, clearRateLimits } from "@/lib/practice-lab/rate-limit";

describe("rate limit", () => {
  beforeEach(() => {
    clearRateLimits();
  });

  it("allows requests under the limit", () => {
    const first = checkRateLimit("user-1", 3);
    const second = checkRateLimit("user-1", 3);
    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(1);
  });

  it("blocks requests over the limit", () => {
    checkRateLimit("user-2", 2);
    checkRateLimit("user-2", 2);
    const blocked = checkRateLimit("user-2", 2);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("isolates keys", () => {
    checkRateLimit("a", 1);
    const other = checkRateLimit("b", 1);
    expect(other.allowed).toBe(true);
  });
});
