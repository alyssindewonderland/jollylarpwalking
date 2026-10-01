import { describe, it, expect } from "vitest";
import { dateKey, isFutureDateKey, isQuietHours, weekRange, previousWeekRange, localHour } from "../timezone";

const TZ = "Europe/Rome";

describe("dateKey", () => {
  it("rolls over to the next local day even while still the previous UTC day", () => {
    // 23:30 UTC on Jan 1 is 00:30 CET (Jan 2) in Europe/Rome.
    const when = new Date("2026-01-01T23:30:00Z");
    expect(dateKey(when, TZ)).toBe("2026-01-02");
  });

  it("stays on the same local day just before midnight", () => {
    const when = new Date("2026-01-01T22:30:00Z"); // 23:30 CET
    expect(dateKey(when, TZ)).toBe("2026-01-01");
  });
});

describe("isFutureDateKey", () => {
  it("rejects a date after today in the group timezone", () => {
    const farFuture = "2099-01-01";
    expect(isFutureDateKey(farFuture, TZ)).toBe(true);
  });

  it("accepts today and past dates", () => {
    expect(isFutureDateKey("2000-01-01", TZ)).toBe(false);
  });
});

describe("weekRange / previousWeekRange", () => {
  it("weeks start on Monday and end on Sunday", () => {
    // 2026-01-07 is a Wednesday.
    const { startKey, endKey } = weekRange(new Date("2026-01-07T12:00:00Z"), TZ);
    expect(startKey).toBe("2026-01-05"); // Monday
    expect(endKey).toBe("2026-01-11"); // Sunday
  });

  it("previousWeekRange is the full week immediately before the current one", () => {
    const { startKey, endKey } = previousWeekRange(new Date("2026-01-07T12:00:00Z"), TZ);
    expect(startKey).toBe("2025-12-29");
    expect(endKey).toBe("2026-01-04");
  });
});

describe("isQuietHours / localHour", () => {
  it("treats 23:00-08:00 local as quiet hours", () => {
    const midnight = new Date("2026-01-01T23:30:00Z"); // 00:30 CET
    expect(localHour(midnight, TZ)).toBe(0);
    expect(isQuietHours(midnight, TZ)).toBe(true);
  });

  it("does not flag the middle of the day as quiet hours", () => {
    const noon = new Date("2026-01-01T11:00:00Z"); // 12:00 CET
    expect(isQuietHours(noon, TZ)).toBe(false);
  });

  it("08:00 local is the boundary and counts as not-quiet", () => {
    const eightAm = new Date("2026-01-01T07:00:00Z"); // 08:00 CET
    expect(localHour(eightAm, TZ)).toBe(8);
    expect(isQuietHours(eightAm, TZ)).toBe(false);
  });
});
