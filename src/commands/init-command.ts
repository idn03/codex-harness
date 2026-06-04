import { Command } from "commander";
import { mkdir, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import { harnessPaths } from "../lib/harness-paths.js";

const exists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const seed = async (path: string, body: string, force: boolean) => {
  if (force || !(await exists(path))) {
    await writeFile(path, body);
  }
};

export const initCommand = new Command("init")
  .description("Initialize .harness/ in current working dir")
  .option("--force", "overwrite existing memory files", false)
  .action(async (opts: { force: boolean }) => {
    const p = harnessPaths(process.cwd());
    const dirs = [
      p.intake, p.active, p.archive, p.memory,
      p.memoryDecisions, p.memoryNotes, p.memoryPolicy, p.memoryViews,
    ];
    for (const dir of dirs) {
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, ".gitkeep"), "");
    }
    await seed(p.memoryProgress, "# Progress\n\n> Running summary across runs. Archivist appends after PASS.\n\n", opts.force);
    await seed(p.memoryPatterns, "# Patterns\n\n> Repeated solutions worth remembering.\n\n", opts.force);
    await seed(p.memoryGotchas, "# Gotchas\n\n> Known traps. Avoid these.\n\n", opts.force);
    await seed(p.memoryContextMap, "# Context Map\n\n> Where things live in this repo.\n\n", opts.force);
    await seed(p.memoryDenyPaths, "# Paths agents must not write to. One per line.\n", opts.force);
    console.log(`Harness initialized at ${p.root}`);
  });
