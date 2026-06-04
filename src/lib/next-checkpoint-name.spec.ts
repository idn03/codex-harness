import { describe, it, expect, beforeEach } from "vitest";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { nextCheckpointName } from "./next-checkpoint-name.js";

describe("nextCheckpointName", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "ckpt-"));
  });

  it("returns 001.json for empty dir", async () => {
    expect(await nextCheckpointName(dir)).toBe("001.json");
  });

  it("returns next number based on max existing", async () => {
    await writeFile(join(dir, "001.json"), "{}");
    await writeFile(join(dir, "002.json"), "{}");
    await writeFile(join(dir, "005.json"), "{}");
    expect(await nextCheckpointName(dir)).toBe("006.json");
  });

  it("ignores non-checkpoint files", async () => {
    await writeFile(join(dir, "001.json"), "{}");
    await writeFile(join(dir, "notes.md"), "");
    await writeFile(join(dir, ".gitkeep"), "");
    expect(await nextCheckpointName(dir)).toBe("002.json");
  });
});
