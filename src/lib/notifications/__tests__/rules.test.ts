import { describe, it, expect } from "vitest";
import {
  computeOvertakes,
  isNewLeadChange,
  crossedMilestone,
  crossedStreakMilestone,
  shouldSkipIngest,
  isCloseRace,
  isStreakAtRisk,
  INGEST_COOLDOWN_MS,
} from "../rules";

describe("computeOvertakes", () => {
  it("flags members whose steps sit strictly between the before and after total", () => {
    const others = [
      { id: "a", steps: 5000 }, // between 4000 and 7000 -> overtaken
      { id: "b", steps: 6000 }, // between 4000 and 7000 -> overtaken
      { id: "c", steps: 9000 }, // still ahead of 7000 -> not overtaken
    ];
    const result = computeOvertakes(4000, 7000, others);
    expect(result.map((r) => r.id).sort()).toEqual(["a", "b"]);
  });

  it("computes the correct gap for each overtaken member", () => {
    const result = computeOvertakes(1000, 5000, [{ id: "x", steps: 3000 }]);
    expect(result).toEqual([{ id: "x", diff: 2000 }]);
  });

  it("returns nothing if the update didn't increase today's total", () => {
    expect(computeOvertakes(5000, 5000, [{ id: "a", steps: 4000 }])).toEqual([]);
    expect(computeOvertakes(5000, 4000, [{ id: "a", steps: 4500 }])).toEqual([]);
  });

  it("does not flag someone tied with the new total (a tie isn't a pass)", () => {
    expect(computeOvertakes(1000, 5000, [{ id: "a", steps: 5000 }])).toEqual([]);
  });

  it("does not flag someone the actor was already ahead of", () => {
    expect(computeOvertakes(6000, 7000, [{ id: "a", steps: 3000 }])).toEqual([]);
  });
});

describe("isNewLeadChange", () => {
  it("is true when the actor newly takes sole first place", () => {
    expect(isNewLeadChange(4000, 8000, [{ steps: 7000 }, { steps: 5000 }])).toBe(true);
  });

  it("is false if the actor was already leading", () => {
    expect(isNewLeadChange(8000, 9000, [{ steps: 5000 }])).toBe(false);
  });

  it("is false if someone else is still ahead after the update", () => {
    expect(isNewLeadChange(1000, 4000, [{ steps: 5000 }])).toBe(false);
  });

  it("is false with no other members", () => {
    expect(isNewLeadChange(0, 100, [])).toBe(false);
  });
});

describe("crossedMilestone", () => {
  it("fires only the first time 20k is crossed", () => {
    expect(crossedMilestone(19000, 20000)).toBe(true);
    expect(crossedMilestone(20000, 21000)).toBe(false);
    expect(crossedMilestone(19000, 19999)).toBe(false);
  });
});

describe("crossedStreakMilestone", () => {
  it("matches exactly the configured milestone days", () => {
    expect(crossedStreakMilestone(7)).toBe(true);
    expect(crossedStreakMilestone(14)).toBe(true);
    expect(crossedStreakMilestone(30)).toBe(true);
    expect(crossedStreakMilestone(8)).toBe(false);
    expect(crossedStreakMilestone(0)).toBe(false);
  });
});

describe("shouldSkipIngest", () => {
  it("never skips the very first ingest", () => {
    expect(shouldSkipIngest(null)).toBe(false);
  });

  it("skips a call that lands inside the cooldown window", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    const last = new Date(now.getTime() - INGEST_COOLDOWN_MS / 2);
    expect(shouldSkipIngest(last, now)).toBe(true);
  });

  it("allows a call once the cooldown has fully elapsed", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    const last = new Date(now.getTime() - INGEST_COOLDOWN_MS - 1);
    expect(shouldSkipIngest(last, now)).toBe(false);
  });
});

describe("isCloseRace / isStreakAtRisk", () => {
  it("treats the leader (gap 0) as not in a close race with themself", () => {
    expect(isCloseRace(0)).toBe(false);
  });

  it("is true within the threshold and false just beyond it", () => {
    expect(isCloseRace(1500)).toBe(true);
    expect(isCloseRace(1501)).toBe(false);
  });

  it("streak risk requires an active streak and a reachable remainder", () => {
    expect(isStreakAtRisk(3, 1000)).toBe(true);
    expect(isStreakAtRisk(0, 1000)).toBe(false); // no streak to protect
    expect(isStreakAtRisk(3, 0)).toBe(false); // goal already met
    expect(isStreakAtRisk(3, 5000)).toBe(false); // too far to realistically close
  });
});
