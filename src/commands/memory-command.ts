import { Command } from "commander";
import { readFile } from "node:fs/promises";
import { harnessPaths } from "../lib/harness-paths.js";

export const memoryCommand = new Command("memory")
  .description("Inspect or distil harness memory")
  .option("--show", "print memory/progress.md", false)
  .action(async (opts: { show: boolean }) => {
    const paths = harnessPaths(process.cwd());
    if (opts.show) {
      const body = await readFile(paths.memoryProgress, "utf-8");
      console.log(body);
      return;
    }
    console.log(`Memory dir: ${paths.memory}`);
    console.log("TODO: invoke archivist to distil latest archived sessions.");
  });
