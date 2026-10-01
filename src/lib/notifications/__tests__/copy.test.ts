import { describe, it, expect } from "vitest";
import {
  overtakeTemplates,
  closeRaceTemplates,
  reminderTemplates,
  overtakeCopy,
  closeRaceCopy,
  reminderCopy,
} from "../copy";

describe("copy template pools", () => {
  it("the high-frequency pools (overtake, close race, reminder) each have 15+ variants", () => {
    expect(overtakeTemplates.length).toBeGreaterThanOrEqual(15);
    expect(closeRaceTemplates.length).toBeGreaterThanOrEqual(15);
    expect(reminderTemplates.length).toBeGreaterThanOrEqual(15);
  });

  it("every template in a pool is unique (no accidental duplicate copy)", () => {
    expect(new Set(overtakeTemplates).size).toBe(overtakeTemplates.length);
    expect(new Set(reminderTemplates).size).toBe(reminderTemplates.length);
  });
});

describe("copy rendering", () => {
  it("overtakeCopy substitutes the actor and diff with no leftover placeholders", () => {
    for (let i = 0; i < 25; i++) {
      const text = overtakeCopy({ actor: "Marco", diff: 340 });
      expect(text).not.toMatch(/\{[a-zA-Z]+\}/);
      expect(text.length).toBeGreaterThan(0);
    }
  });

  it("reminderCopy needs no variables and never leaves a placeholder", () => {
    for (let i = 0; i < 25; i++) {
      expect(reminderCopy()).not.toMatch(/\{[a-zA-Z]+\}/);
    }
  });

  it("closeRaceCopy handles both the gap-based and streak-based variants", () => {
    for (let i = 0; i < 25; i++) {
      const text = closeRaceCopy({ leader: "Marco", gap: 850 });
      expect(text).not.toMatch(/\{[a-zA-Z]+\}/);
    }
  });
});
