import { describe, it, expect } from "vitest";
import { ingestBodySchema } from "../ingest-schema";

describe("ingestBodySchema", () => {
  it("accepts a normal 7-day payload", () => {
    const result = ingestBodySchema.safeParse({
      days: [
        { date: "2026-01-01", steps: 8000 },
        { date: "2026-01-02", steps: 10234 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed date", () => {
    const result = ingestBodySchema.safeParse({ days: [{ date: "01-01-2026", steps: 1000 }] });
    expect(result.success).toBe(false);
  });

  it("rejects negative steps", () => {
    const result = ingestBodySchema.safeParse({ days: [{ date: "2026-01-01", steps: -1 }] });
    expect(result.success).toBe(false);
  });

  it("rejects steps over the 100k sanity ceiling", () => {
    const result = ingestBodySchema.safeParse({ days: [{ date: "2026-01-01", steps: 100_001 }] });
    expect(result.success).toBe(false);
  });

  it("allows exactly 100k steps", () => {
    const result = ingestBodySchema.safeParse({ days: [{ date: "2026-01-01", steps: 100_000 }] });
    expect(result.success).toBe(true);
  });

  it("rejects an empty days array", () => {
    const result = ingestBodySchema.safeParse({ days: [] });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer steps", () => {
    const result = ingestBodySchema.safeParse({ days: [{ date: "2026-01-01", steps: 1000.5 }] });
    expect(result.success).toBe(false);
  });
});
