import { describe, it, expect } from "vitest";
import { triageSchema } from "./triage-schema.js";

describe("triageSchema", () => {
  it("accepts a minimal valid triage verdict", () => {
    const parsed = triageSchema.parse({
      difficulty: "easy",
      signals: [],
      route: "single_agent",
      est_checkpoints: 1,
      spec_required: false,
      notes: "trivial edit",
    });
    expect(parsed.difficulty).toBe("easy");
    expect(parsed.route).toBe("single_agent");
  });

  it("rejects an unknown signal", () => {
    expect(() =>
      triageSchema.parse({
        difficulty: "medium",
        signals: ["totally_made_up"],
        route: "planner_worker",
        est_checkpoints: 3,
        spec_required: true,
        notes: "n/a",
      }),
    ).toThrow();
  });

  it("rejects non-positive est_checkpoints", () => {
    expect(() =>
      triageSchema.parse({
        difficulty: "hard",
        signals: ["irreversible"],
        route: "full_team",
        est_checkpoints: 0,
        spec_required: true,
        notes: "n/a",
      }),
    ).toThrow();
  });
});
