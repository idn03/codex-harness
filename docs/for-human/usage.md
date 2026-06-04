# Usage Guide

## One-time setup (this repo)

```bash
cd /Volumes/Valhalla/Workihola/harness-demo
pnpm install
```

Optional — install globally so `harness` works anywhere:

```bash
pnpm build
pnpm link --global
# now `harness` is on $PATH
```

Otherwise use `pnpm dev <cmd>` from inside `harness-demo/`.

## Daily flow

### 1. Init on a target project (once per project)

```bash
cd /path/to/your/project
harness init       # or: pnpm --dir /Volumes/Valhalla/Workihola/harness-demo dev init
```

Creates `.harness/` tree. Adds memory dir + policy file. Safe to re-run (won't overwrite memory unless `--force`).

### 2. Start a run — every time you give the agent a new task

```bash
harness run "Add a /health endpoint that returns OK"
# → Session created: 26-06-04--02-45-02-6kw8
```

Writes `intent.md`. Session id is timestamp-based, sortable.

### 3. See what's queued / running

```bash
harness status
# Active sessions: 1
#   - 26-06-04--02-45-02-6kw8
```

### 4. Drive the work loop (currently a stub — see "Limitations" below)

```bash
harness work 26-06-04--02-45-02-6kw8
```

When wired, this will route to orchestrator → triager → implementer → reviewer → tester → validator → archivist.

### 5. Resume after interruption

```bash
harness resume 26-06-04--02-45-02-6kw8
```

Reads last checkpoint in `.harness/active/<id>/checkpoints/`, re-primes the agent.

### 6. Inspect memory

```bash
harness memory --show              # prints memory/progress.md
harness memory                     # (future) trigger archivist distil pass
```

## Right-now workflow (until `work` is wired)

Until step 4 calls Claude Code automatically, you bridge it manually:

1. `harness run "<intent>"` → get session id.
2. Open Claude Code in the project repo.
3. Tell Claude: *"Read `.harness/active/<id>/intent.md` and route via the orchestrator agent."*
4. Claude Code picks up `.claude/agents/*.md` natively and invokes the team.
5. When done, you (or the orchestrator agent) write a checkpoint JSON into `.harness/active/<id>/checkpoints/001.json`.
6. On PASS, ask the archivist agent to update `.harness/memory/`.

This is the "Phase 1" adoption pattern from the design doc.

## State map

| Path | Owner | When to read |
|---|---|---|
| `.harness/active/<id>/intent.md` | run cmd | start of work |
| `.harness/active/<id>/triage.json` | triager | route decision |
| `.harness/active/<id>/checkpoints/` | orchestrator | resume |
| `.harness/active/<id>/log.jsonl` | orchestrator | post-mortem |
| `.harness/memory/progress.md` | archivist | next run's primer |
| `.harness/memory/decisions/` | archivist | "why was X done?" |
| `.harness/memory/notes/gotchas.md` | archivist | avoid known traps |
| `.harness/memory/policy/deny-paths.txt` | **you** | guard sensitive paths |
| `.harness/memory/views/` | **you** | curated reading orders |

## What you should edit by hand

- `.harness/memory/policy/deny-paths.txt` — list paths agents should never touch (e.g. `prisma/migrations/`, `.env*`).
- `.harness/memory/views/*.md` — write reading orders for new contributors (human or AI).
- `.claude/rules/*.md` — project conventions. The team reads these every run.

Don't hand-edit `decisions/`, `notes/gotchas.md`, `progress.md` — archivist owns them.

## Limitations (current state)

- `harness work` and `harness resume` print TODOs, don't actually invoke agents yet.
- No triager LLM call. JSON output spec exists, executor missing.
- No automatic checkpoint writing. Hooks for Claude Code's `PostToolUse` would do this — not configured.
- No archivist distil pass. Manual until `harness memory` is wired.

## Next wiring step

To make `work` real, pick one:

- **Claude Code SDK** — spawn Claude Code as subprocess from `work-command.ts`, pass orchestrator prompt + paths.
- **Anthropic API direct** — `@anthropic-ai/sdk`, call orchestrator role with tool grants, loop until done.
