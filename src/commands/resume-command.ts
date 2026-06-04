import { Command } from "commander";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { harnessPaths } from "../lib/harness-paths.js";
import { checkpointSchema } from "../lib/checkpoint-schema.js";

export const resumeCommand = new Command("resume")
  .description("Resume an interrupted session from last checkpoint")
  .argument("<session-id>", "session id to resume")
  .action(async (id: string) => {
    const paths = harnessPaths(process.cwd());
    const session = paths.session(id);
    const files = (await readdir(session.checkpoints).catch(() => [] as string[]))
      .filter((f) => /^\d{3}\.json$/.test(f))
      .sort();
    const last = files[files.length - 1];
    if (!last) {
      console.log(`No checkpoints found for ${id}. Run 'harness work ${id}' fresh.`);
      return;
    }
    const path = join(session.checkpoints, last);
    const raw = JSON.parse(await readFile(path, "utf-8"));
    const checkpoint = checkpointSchema.parse(raw);
    console.log(`Last checkpoint: ${last}`);
    console.log(`  stage:  ${checkpoint.stage}`);
    console.log(`  step:   ${checkpoint.step}`);
    console.log(`  result: ${checkpoint.result}`);
    console.log(`  next:   ${checkpoint.next}`);
    console.log("TODO: re-prime orchestrator and continue from this point.");
  });
