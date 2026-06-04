# Context Map

> Where things live in this repo.

CLI commands → `src/commands/*-command.ts` → one Commander `Command` export per file
Lib helpers  → `src/lib/*.ts` → pure helpers; filename matches camelCase export name
Status data  → `src/lib/gather-status.ts` → `gatherStatus(root)` returns `StatusData { active, intake }`
Path config  → `src/lib/harness-paths.ts` → `harnessPaths(root)` returns `HarnessPaths` (all `.harness/` dir paths)
CLI entry    → `src/cli.ts` → registers all commands
