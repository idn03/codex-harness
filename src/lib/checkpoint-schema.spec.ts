import { describe, it, expect } from "vitest";
import { checkpointSchema } from "./checkpoint-schema.js";

describe("checkpointSchema", () => {
  it("accepts a minimal valid checkpoint", () => {
    const parsed = checkpointSchema.parse({
      stage: "implementation",
      step: "wrote src/foo.ts",
      files_touched: ["src/foo.ts"],
      result: "ok",
      next: "review",
    });
    expect(parsed.stage).toBe("implementation");
    expect(parsed.files_touched).toHaveLength(1);
  });

  it("rejects unknown stage", () => {
    expect(() =>
      checkpointSchema.parse({
        stage: "deploy",
        step: "x",
        files_touched: [],
        result: "ok",
        next: "y",
      }),
    ).toThrow();
  });

  it("rejects empty step string", () => {
    expect(() =>
      checkpointSchema.parse({
        stage: "review",
        step: "",
        files_touched: [],
        result: "fail",
        next: "back to implementer",
      }),
    ).toThrow();
  });

  it("accepts optional cycle and notes", () => {
    const parsed = checkpointSchema.parse({
      stage: "test",
      step: "tests pass",
      files_touched: ["tests/foo.spec.ts"],
      result: "ok",
      next: "validation",
      cycle: 2,
      notes: "flaky on first run",
    });
    expect(parsed.cycle).toBe(2);
    expect(parsed.notes).toBe("flaky on first run");
  });
});
