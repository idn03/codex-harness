#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init-command.js";
import { runCommand } from "./commands/run-command.js";
import { workCommand } from "./commands/work-command.js";
import { resumeCommand } from "./commands/resume-command.js";
import { memoryCommand } from "./commands/memory-command.js";
import { statusCommand } from "./commands/status-command.js";
import { checkpointCommand } from "./commands/checkpoint-command.js";

const program = new Command();

program
  .name("harness")
  .description("AI agent harness — memory, triage, checkpoints, agent team")
  .version("0.0.1");

program.addCommand(initCommand);
program.addCommand(runCommand);
program.addCommand(workCommand);
program.addCommand(resumeCommand);
program.addCommand(memoryCommand);
program.addCommand(statusCommand);
program.addCommand(checkpointCommand);

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
