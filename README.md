# harness-demo

AI agent harness — memory, triage, checkpoints, agent team. Wraps Claude Code so a 7-agent pipeline drives one task end-to-end with cross-run memory.

## What it does

```
Human intent
  → Feature intake
  → Triage           (easy / medium / hard, route picked)
  → Product packet   (plan, when full_team)
  → Agent work loop  (step → checkpoint → validate)
  → Product delta    (diff)
  → Validation proof (typecheck / lint / build / test)
  → Memory write     (archivist updates .harness/memory/)
  → Next intent
```

The harness owns the loop. The agents do the work.

## Quick start

```bash
pnpm install
pnpm dev init                                       # creates .harness/ tree
pnpm dev run "<your intent here>"                   # writes session
pnpm dev work <session-id>                          # runs the full pipeline
pnpm dev status                                     # see active sessions
pnpm dev status --json                              # machine-readable
pnpm dev resume <session-id>                        # resume from last checkpoint
pnpm dev memory --show                              # show distilled memory
```

Requires Claude Code logged in, or `ANTHROPIC_API_KEY` in env.

## Agent team

| Agent | Model | Job |
|---|---|---|
| **triager** | haiku | Classify intent (easy / medium / hard), pick route |
| **orchestrator** | opus | Route work, enforce gates, never writes code |
| **implementer** | opus | Writes application code |
| **tester** | opus | Writes and runs tests |
| **reviewer** | sonnet | Reviews code quality + intent adherence (PASS/FAIL) |
| **validator** | sonnet | Final gate (typecheck / lint / build / test) |
| **archivist** | sonnet | Distils durable memory after PASS |

Role definitions in `.claude/agents/`. Claude Code picks them up natively via `settingSources: ["project"]`.

## State layout

```
.harness/
  intake/                 # queued intents
  active/<session-id>/
    intent.md             # raw human intent
    triage.json           # zod-validated routing verdict
    packet.md             # optional plan (full_team route)
    checkpoints/NNN.json  # one per stage transition, append-only
    log.jsonl             # full event trace from the SDK
  archive/<session-id>/   # moved here post-validation
  memory/
    progress.md           # archivist: running summary
    patterns.md           # archivist: repeated solutions
    decisions/            # archivist: non-obvious choices
    notes/
      gotchas.md          # archivist: traps + fixes
      context-map.md      # archivist: where things live
    policy/
      deny-paths.txt      # YOU edit: paths agents must not write
    views/                # YOU edit: curated reading orders
```

Only `.harness/memory/` is git-committed. `intake/`, `active/`, `archive/` are runtime state.

## Commands

| Command | What it does |
|---|---|
| `harness init` | Create `.harness/` skeleton |
| `harness run "<intent>"` | Start a new session, write `intent.md` |
| `harness work <id>` | Drive the agent loop via Claude Agent SDK |
| `harness work <id> --dry-run` | Print the orchestrator prompt without calling the SDK |
| `harness work <id> --budget 2.0 --max-turns 50` | Override safety caps |
| `harness resume <id>` | Load last checkpoint, ready to re-prime |
| `harness checkpoint <id>` | Append a checkpoint JSON from stdin (called by orchestrator via Bash) |
| `harness status [--json]` | Show active sessions and queued intake |
| `harness memory [--show]` | Inspect distilled memory |

## Safety rails

- **Deny-paths hook** — `.claude/settings.json` registers a `PreToolUse` hook that blocks `Write` / `Edit` / `NotebookEdit` on substring matches from `.harness/memory/policy/deny-paths.txt`. Bypassing the prompt is not enough — the runtime gate stops it.
- **Budget cap** — `maxBudgetUsd` defaults to $2.00. SDK halts with `error_max_budget_usd` if exceeded.
- **Turn cap** — `maxTurns` defaults to 50.
- **Zod-validated checkpoints** — bad JSON throws at the harness boundary, never lands on disk.
- **Atomic checkpoint writes** — temp file + rename, no half-written state.
- **Append-only memory** — archivist's progress / decisions / gotchas / context-map are append-only by protocol.

## Project layout

```
src/
  cli.ts                    # entry
  commands/                 # one Commander Command per file
  lib/                      # helpers (paths, schemas, SDK driver)
.claude/
  agents/                   # 7 role definitions (markdown frontmatter)
  rules/                    # project conventions
  settings.json             # hook registration + permission allow list
scripts/
  deny-paths-gate.sh        # PreToolUse hook script
docs/
  for-human/                # design + usage + evaluation + run walkthroughs
```

## Documentation

Deep dives in `docs/for-human/`:

- [`harness-design.md`](docs/for-human/harness-design.md) — architecture, loop, storage layout, MVP plan
- [`agent-team.md`](docs/for-human/agent-team.md) — why these 7 roles, when to add more
- [`usage.md`](docs/for-human/usage.md) — daily flow + manual bridging mode
- [`evaluation.md`](docs/for-human/evaluation.md) — gap analysis vs the 12 harness-engineering categories, P0/P1/P2 backlog, public-repo references
- [`example-run.md`](docs/for-human/example-run.md) — full walkthrough of a live run, bugs found, fixes proved

## Built on

- [@anthropic-ai/claude-agent-sdk](https://github.com/anthropics/claude-agent-sdk-typescript) — programmatic Claude Code
- [commander](https://github.com/tj/commander.js) — CLI parser
- [zod](https://zod.dev) — schema validation at the harness boundary
- [vitest](https://vitest.dev) — tests

## References

Two public repos worth reading before extending this harness:

- **[ai-boost/awesome-harness-engineering](https://github.com/ai-boost/awesome-harness-engineering)** — taxonomy + curated list of canonical impls (LangGraph, Letta/MemGPT, Composio, TaskWeaver, MCP Inspector). Use it as a self-audit checklist.
- **[anthropics/claude-agent-sdk-typescript](https://github.com/anthropics/claude-agent-sdk-typescript)** — the SDK powering `harness work`. Read its `Options` type for what you can wire next (custom permission handlers, MCP servers, plan mode, hooks, etc.).

## Status

Demo. Loop works end-to-end. Not production. Known gaps tracked in [`docs/for-human/evaluation.md`](docs/for-human/evaluation.md).
