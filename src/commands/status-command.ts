import { Command } from "commander";
import { gatherStatus } from "../lib/gather-status.js";

export const statusCommand = new Command("status")
  .description("Show active sessions and queued intake")
  .option("--json", "Output as JSON object { active, intake }")
  .action(async (options: { json?: boolean }) => {
    const { active: sessions, intake: queued } = await gatherStatus(
      process.cwd(),
    );
    if (options.json) {
      console.log(JSON.stringify({ active: sessions, intake: queued }, null, 2));
      return;
    }
    console.log(`Active sessions: ${sessions.length}`);
    sessions.forEach((s) => console.log(`  - ${s}`));
    console.log(`Queued intake: ${queued.length}`);
    queued.forEach((q) => console.log(`  - ${q}`));
  });
