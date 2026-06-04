# Example Run — End-to-End Walkthrough

A complete trace of running the harness against itself (dogfooding), showing what the loop produced, what broke, what got fixed, and what the second run proved.

## What was tested

The full pipeline: `harness run "<intent>"` → `harness work <id>` → orchestrator drives triager → implementer → validator → archivist → done.

**Target intent:**

> Add a `--json` flag to the `harness status` command so it prints active sessions and queued intake as a JSON object `{active:[...], intake:[...]}`. Default text output unchanged when `--json` not set.

Picked because: small, well-scoped, fits the TypeScript CLI project, has a clear success criterion (run `harness status --json`, see JSON; run `harness status`, see same text as before).

## Pre-flight

Before the live SDK call, the following safeguards were configured:

- **Deny-paths** (`.harness/memory/policy/deny-paths.txt`) protect critical files from agent writes:
  ```
  .claude/agents/
  .claude/settings.json
  scripts/deny-paths-gate.sh
  .harness/memory/policy/
  .harness/memory/views/
  package.json
  pnpm-lock.yaml
  ```
- **Budget cap** — `maxBudgetUsd: 0.5` (later bumped to 2.0)
- **Turn cap** — `maxTurns: 30` (later bumped to 50)
- **Permission mode** — `acceptEdits` so file edits don't prompt

## Run 1 — failed at $0.50 budget cap

### Trace

| Event # | Action | Result |
|---|---|---|
| 5 | Orchestrator reads `intent.md` | ok |
| 8 | Orchestrator delegates to triager | ok |
| 12–48 | Triager reads 14 files | over-fetched |
| 59 | Orchestrator: *"triager produced verdict but couldn't write — its toolset lacks Write"* | bug 1 |
| 60 | Orchestrator writes `triage.json` itself | workaround |
| 63 | Tries `echo '{...}' \| pnpm dev checkpoint <id>` | blocked (pipe) |
| 68 | Retries with different pipe form | blocked |
| 75 | Writes payload to `/tmp/ckpt-qx8x.json` | ok |
| 82 | Tries `pnpm dev checkpoint <id> < .harness/active/<id>/ckpt-tmp.json` | blocked (stdin redirect) |
| 89 | Gives up on checkpoint, delegates to implementer anyway | proceeds |
| 90–103 | Implementer reads project files, starts work | partial |
| 104 | `subtype=error_max_budget_usd` at $0.5056 | budget cap hit |

### Bugs surfaced

1. **Triager has no `Write` tool.** Frontmatter declared `tools: Read, Glob, Grep`, but its prompt said to write `triage.json`. Contradiction. Orchestrator papered over it.
2. **Checkpoint command blocked by permission system.** `Bash` calls with pipes or stdin redirection require interactive approval — unavailable inside an SDK call. Three different attempts all failed. End result: zero checkpoints in `checkpoints/` despite the orchestrator trying hard.
3. **Triager was chatty.** 14 reads before a verdict on an "easy" task — too much context-discovery on the cheapest pre-gate.
4. **$0.50 doesn't clear a real loop.** 9 turns consumed just to get past triage into the start of implementation. Each subagent invocation reloads project context (cache_read: 189K tokens by event 104).

### What worked despite the failures

- ✓ SDK invocation streamed 104 events to `log.jsonl`
- ✓ Agent discovery: orchestrator delegated to triager via the Agent tool
- ✓ Triage verdict was correct: `easy → single_agent`, notes named the target file
- ✓ Budget cap fired cleanly with the right subtype
- ✓ Project setting sources loaded `.claude/agents/*.md` from disk

The architecture was sound. The failures were tuning issues.

## Fixes applied between runs

| Fix | File | Change |
|---|---|---|
| A | `.claude/agents/triager.md` | Added `Write` to tools list; trimmed context discovery from 5 steps to 2 (intent + gotchas only) |
| B | `.claude/settings.json` | Added `"Bash(pnpm dev checkpoint *)"` and other harness commands to `permissions.allow` |
| C | (same as A) | Slim triager prompt explicitly forbids browsing the project |
| D | `src/lib/run-orchestrator.ts` + `src/commands/work-command.ts` | Default `maxBudgetUsd: 2.0`, default `maxTurns: 50`, both overridable via `--budget` / `--max-turns` flags |

## Run 2 — full pipeline PASS at $0.99

### Final result

```
[done] subtype=success cost=$0.9949 turns=14
```

### Pipeline trace

| # | Stage | Agent | Result | Files touched |
|---|---|---|---|---|
| 001 | Triage | triager | ok | `triage.json` (self-written this time ✓) |
| 002 | Implementation | implementer | ok | `src/commands/status-command.ts`, `src/lib/gather-status.ts` |
| 003 | Validation | validator | PASS | (re-ran typecheck + manual feature checks) |
| 004 | Archive | archivist | ok | `progress.md`, `patterns.md`, `notes/context-map.md`, `decisions/26-06-04--json-flag-pattern.md` |

### Feature verification (post-run)

```bash
$ pnpm dev status --json
{
  "active": ["26-06-04--02-45-02-6kw8", "26-06-04--08-00-42-qx8x", "26-06-04--08-35-16-g6h8"],
  "intake": []
}

$ pnpm dev status              # text mode unchanged
Active sessions: 3
  - 26-06-04--02-45-02-6kw8
  - 26-06-04--08-00-42-qx8x
  - 26-06-04--08-35-16-g6h8
Queued intake: 0
```

### Code quality (post-run)

- `pnpm typecheck` → exit 0
- 10 vitest specs still pass
- New helper `src/lib/gather-status.ts` follows project rules:
  - Single named export
  - kebab-case filename matches export name
  - Pure function separated from I/O via `harness-paths.ts` indirection
  - Under 20 lines

```typescript
import { readdir } from "node:fs/promises";
import { harnessPaths } from "./harness-paths.js";

export interface StatusData {
  active: string[];
  intake: string[];
}

export const gatherStatus = async (root: string): Promise<StatusData> => {
  const paths = harnessPaths(root);
  const active = await readdir(paths.active).catch(() => [] as string[]);
  const intake = await readdir(paths.intake).catch(() => [] as string[]);
  return {
    active: active.filter((f) => f !== ".gitkeep"),
    intake: intake.filter((f) => f !== ".gitkeep"),
  };
};
```

### Archivist memory — non-trivial output

`.harness/memory/decisions/26-06-04--json-flag-pattern.md`:

> ### Context
> `harness status` needed to support both human-readable text output (default) and machine-readable JSON output for scripting/piping.
>
> ### Decision
> Add a `--json` Commander option. Data gathering is extracted into a dedicated lib helper that returns a typed interface. The command calls the helper once, then branches only on output format.
>
> ### Alternatives considered
> - Separate `harness status --json` subcommand — rejected: unnecessary surface area, same intent.
> - Inline the directory reads inside the command — rejected: text and JSON paths would share no code and could drift.
>
> ### Why
> Single source of truth for data; output format is the only variable.

The archivist captured the *why*, not just the *what*. The next run's triager/implementer will see this and can lean on the same pattern.

### Orchestrator judgment moment

After validation PASS, the orchestrator noticed project rule #16 (commit each completed task) and *paused* instead of force-committing:

> *"The repository has no commits yet — every file (the entire project) is untracked, and we're on the default `main` branch. Auto-committing here would either mean creating a sweeping initial commit of the whole project (out of scope for this task) or partially staging only these files into a repo with no baseline. Neither is the right call to make unilaterally, so I'm leaving the commit to you."*

Worth noting because the agent could have blindly followed the rule and made a mess. It read the situation correctly.

## What the second run proved

| Fix | Evidence |
|---|---|
| A — triager has Write | Wrote its own `triage.json`; orchestrator didn't intervene |
| B — checkpoint pre-authorized | All 4 checkpoints landed via `pnpm dev checkpoint` |
| C — slim triager | Triage stage finished after ~5 reads (was 14) |
| D — $2 budget | Hit `subtype=success` at $0.99, well under cap |

## Per-stage cost rough breakdown

Total $0.99 / 14 turns. The dominant cost line in the result event:

```
cache_creation: 27,350 tokens (1h)
cache_read:    189,173 tokens
input:           4,991 tokens
output:          3,698 tokens
```

Cache reuse across stages saved roughly 6x the cost. Without prompt caching the same run would have been ~$5–6. The SDK's default cache strategy is doing real work.

## Limitations observed

- **Subagent context bloat.** Each `Agent` tool call re-loads project context. Cache helps, but multi-subagent loops compound.
- **No streaming progress** for the user during long stages — only tool-use markers.
- **`pnpm lint` fails repo-wide** — pre-existing missing ESLint flat-config. Unrelated to this task but the validator surfaced it correctly as "rule compliance" gap and noted it without failing the pipeline.
- **No `git init` yet.** Rule 16 (commit on completion) had no target to fire against. Worth doing before the next run.

## Replicate this run yourself

```bash
cd /Volumes/Valhalla/Workihola/harness-demo
pnpm install
pnpm dev init

# Optional: pick your own intent
pnpm dev run "Add a --json flag to 'harness status' that prints {active, intake}."

# Note the session id from output, then:
pnpm dev work <session-id>                # default $2 budget, 50 turns
pnpm dev work <session-id> --budget 0.5   # tighter cap

# Inspect afterwards
pnpm dev status
ls .harness/active/<session-id>/checkpoints
cat .harness/memory/progress.md
ls .harness/memory/decisions/
```

Requires Claude Code logged in or `ANTHROPIC_API_KEY` set.

## Artifacts referenced

| Path | Content |
|---|---|
| `.harness/active/26-06-04--08-35-16-g6h8/intent.md` | The intent |
| `.harness/active/26-06-04--08-35-16-g6h8/triage.json` | Triage verdict (easy/single_agent) |
| `.harness/active/26-06-04--08-35-16-g6h8/checkpoints/001.json`–`004.json` | One per stage |
| `.harness/active/26-06-04--08-35-16-g6h8/log.jsonl` | 100+ events, full trace |
| `.harness/memory/progress.md` | One-line summary of the run |
| `.harness/memory/decisions/26-06-04--json-flag-pattern.md` | Archivist ADR |
| `docs/temps/26-06-04--08-39-29-status-json-flag.md` | Orchestrator's post-run summary |
| `src/lib/gather-status.ts` | New helper produced by implementer |
| `src/commands/status-command.ts` | Modified to accept `--json` |
