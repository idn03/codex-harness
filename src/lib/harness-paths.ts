import { join } from "node:path";

export const harnessPaths = (root: string) => {
  const harness = join(root, ".harness");
  const memory = join(harness, "memory");
  return {
    root: harness,
    intake: join(harness, "intake"),
    active: join(harness, "active"),
    archive: join(harness, "archive"),
    memory,
    memoryProgress: join(memory, "progress.md"),
    memoryPatterns: join(memory, "patterns.md"),
    memoryDecisions: join(memory, "decisions"),
    memoryNotes: join(memory, "notes"),
    memoryGotchas: join(memory, "notes", "gotchas.md"),
    memoryContextMap: join(memory, "notes", "context-map.md"),
    memoryPolicy: join(memory, "policy"),
    memoryDenyPaths: join(memory, "policy", "deny-paths.txt"),
    memoryViews: join(memory, "views"),
    session: (id: string) => {
      const dir = join(harness, "active", id);
      return {
        dir,
        intent: join(dir, "intent.md"),
        triage: join(dir, "triage.json"),
        packet: join(dir, "packet.md"),
        checkpoints: join(dir, "checkpoints"),
        log: join(dir, "log.jsonl"),
      };
    },
  };
};

export type HarnessPaths = ReturnType<typeof harnessPaths>;
