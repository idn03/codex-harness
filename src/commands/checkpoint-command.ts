import { Command } from "commander";
import { mkdir, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { harnessPaths } from "../lib/harness-paths.js";
import { checkpointSchema } from "../lib/checkpoint-schema.js";
import { readStdin } from "../lib/read-stdin.js";
import { nextCheckpointName } from "../lib/next-checkpoint-name.js";

export const checkpointCommand = new Command("checkpoint")
  .description("Append a validated checkpoint from stdin JSON")
  .argument("<session-id>", "session id")
  .action(async (id: string) => {
    const raw = await readStdin();
    const parsed = checkpointSchema.parse(JSON.parse(raw));
    const p = harnessPaths(process.cwd());
    const s = p.session(id);
    await mkdir(s.checkpoints, { recursive: true });
    const name = await nextCheckpointName(s.checkpoints);
    const final = join(s.checkpoints, name);
    const tmp = `${final}.tmp`;
    await writeFile(tmp, JSON.stringify(parsed, null, 2));
    await rename(tmp, final);
    console.log(final);
  });
