import { Command } from "commander";
import { mkdir, writeFile } from "node:fs/promises";
import { harnessPaths } from "../lib/harness-paths.js";
import { sessionId } from "../lib/session-id.js";

export const runCommand = new Command("run")
  .description("Start a new run: write intent, queue triage")
  .argument("<intent...>", "free-text intent to act on")
  .action(async (intent: string[]) => {
    const paths = harnessPaths(process.cwd());
    const id = sessionId();
    const session = paths.session(id);
    await mkdir(session.checkpoints, { recursive: true });
    const body = intent.join(" ");
    await writeFile(session.intent, `# Intent\n\n${body}\n`);
    await writeFile(session.log, "");
    console.log(`Session created: ${id}`);
    console.log(`Intent: ${session.intent}`);
    console.log("Next: invoke triager via Claude Code, then 'harness work'.");
  });
