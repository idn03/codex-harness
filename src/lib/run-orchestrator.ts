import { query } from "@anthropic-ai/claude-agent-sdk";
import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { orchestratorPrompt } from "./orchestrator-prompt.js";

type RunOptions = {
  sessionId: string;
  cwd: string;
  logPath: string;
  budgetUsd: number;
  maxTurns: number;
};

const writeLogLine = async (path: string, line: unknown): Promise<void> => {
  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, JSON.stringify(line) + "\n");
};

export const runOrchestrator = async (opts: RunOptions): Promise<void> => {
  const result = query({
    prompt: orchestratorPrompt(opts.sessionId),
    options: {
      cwd: opts.cwd,
      settingSources: ["project"],
      permissionMode: "acceptEdits",
      maxTurns: opts.maxTurns,
      maxBudgetUsd: opts.budgetUsd,
    },
  });

  for await (const event of result) {
    await writeLogLine(opts.logPath, event);
    if (event.type === "assistant") {
      for (const block of event.message.content) {
        if (block.type === "text") {
          process.stdout.write(block.text);
        } else if (block.type === "tool_use") {
          process.stdout.write(`\n[tool_use ${block.name}]\n`);
        }
      }
    } else if (event.type === "result") {
      const cost = event.total_cost_usd?.toFixed(4) ?? "?";
      process.stdout.write(`\n[done] subtype=${event.subtype} cost=$${cost} turns=${event.num_turns}\n`);
    }
  }
};
