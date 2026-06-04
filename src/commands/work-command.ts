import { Command } from "commander";
import { readFile, access } from "node:fs/promises";
import { harnessPaths } from "../lib/harness-paths.js";
import { triageSchema } from "../lib/triage-schema.js";
import { orchestratorPrompt } from "../lib/orchestrator-prompt.js";
import { runOrchestrator } from "../lib/run-orchestrator.js";

const exists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

type WorkOptions = {
  dryRun: boolean;
  budget: string;
  maxTurns: string;
};

export const workCommand = new Command("work")
  .description("Drive the agent work loop for an active session")
  .argument("<session-id>", "session id from `harness run`")
  .option("--dry-run", "print orchestrator prompt and exit; do not call the SDK", false)
  .option("--budget <usd>", "max budget in USD (default 2.0)", "2.0")
  .option("--max-turns <n>", "max conversation turns (default 50)", "50")
  .action(async (id: string, opts: WorkOptions) => {
    const paths = harnessPaths(process.cwd());
    const session = paths.session(id);
    const intent = await readFile(session.intent, "utf-8");
    console.log(`Session: ${id}`);
    console.log("--- intent ---");
    console.log(intent);

    if (await exists(session.triage)) {
      const triage = triageSchema.parse(
        JSON.parse(await readFile(session.triage, "utf-8")),
      );
      console.log("--- triage ---");
      console.log(`  difficulty: ${triage.difficulty}`);
      console.log(`  route:      ${triage.route}`);
      console.log(`  signals:    ${triage.signals.join(", ") || "none"}`);
    }

    if (opts.dryRun) {
      console.log("--- orchestrator prompt (dry-run) ---");
      console.log(orchestratorPrompt(id));
      return;
    }

    const budgetUsd = Number.parseFloat(opts.budget);
    const maxTurns = Number.parseInt(opts.maxTurns, 10);
    console.log(`--- invoking orchestrator (budget=$${budgetUsd} maxTurns=${maxTurns}) ---`);
    await runOrchestrator({
      sessionId: id,
      cwd: process.cwd(),
      logPath: session.log,
      budgetUsd,
      maxTurns,
    });
  });
