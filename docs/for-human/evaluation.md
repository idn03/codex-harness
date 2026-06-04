# Harness Evaluation & Improvement Plan

## Strengths

- Role split mirrors quick-meet-Di's proven model. Write/read separation, single coordinator, archivist-only-on-PASS — sound.
- Triager added as cheap pre-gate. Saves cycles on easy intents.
- Memory layout matches what archivist needs: append-only `progress.md`, human-vs-agent ownership split (`policy/`, `views/` human; `decisions/`, `notes/`, `progress.md` agent).
- `harness-paths.ts` = single source of truth. Refactoring layout = edit one file.
- Gitignore strategy correct: ignore `active/`, `archive/`, `intake/`; commit `memory/` only.
- Each agent has explicit *must NOT* list — anti-overreach guardrail.

## Gaps — mapped to awesome-harness-engineering's 12 categories

| Category | Gap |
|---|---|
| Agent Loop | `work` / `resume` are stubs. No executor. Orchestrator spec lives in markdown only. |
| Planning | `packet.md` referenced but no producer. Planner role missing — implementer plans inline. |
| Context Delivery | No token budget, no compaction, no prompt-cache strategy. Long runs will blow context. |
| Tool Design | Agent frontmatter lists tools, but harness doesn't validate or enforce at runtime. |
| Skills & MCP | No MCP integration. `.harness/memory/` could be served as MCP resource — isn't. |
| Permissions | `deny-paths.txt` is convention only. No runtime gate. Any agent can violate it. |
| Memory | Single-project. Stated goal was *"harness for many projects"* — no cross-project / shared layer. |
| Orchestration | Hardcoded sequential. No parallelism, no agent-as-a-service. |
| Verification | Gates listed (`lint`/`typecheck`/`test`) but harness doesn't run them — relies on agent self-report. |
| Observability | `log.jsonl` planned, no schema. No tracing UI. No `harness log --tail`. |
| DX | No `harness inspect <id>`, no checkpoint diff, no cost report. |
| Human-in-the-loop | No approval gate between stages. |

## Other concrete bugs / debts

- `zod` is in deps but unused. No schema validation on `triage.json` or checkpoint JSON.
- No tests for the CLI itself (`vitest` configured, zero specs written).
- `session-id` has a 4-char random suffix but no collision check on disk.
- Archivist decision tree has no dedup mechanism — repeated runs can double-write.
- No `harness archive <id>` to move `active → archive` after PASS.
- No cost tracking per session.

## Improvements — Ranked

### P0 — unblock usefulness

1. Wire `work` to actually invoke orchestrator (Claude Code SDK *or* Anthropic API).
2. Zod-validate `triage.json` + checkpoint JSON schemas.
3. Atomic checkpoint writer: `harness checkpoint <id> <json>` so any agent / hook can append.
4. Enforce `deny-paths.txt` via a Claude Code `PreToolUse` hook → block disallowed writes at the harness layer, not via prompt politeness.

### P1 — high value

5. Cross-project memory: `~/.harness-global/memory/` layered under project-local. Patterns from project A surface in project B's triager context.
6. Expose `.harness/memory/` as an MCP server. Agents read via MCP, not by pasting into the prompt.
7. Per-stage JSONL log + `harness log <id> --stage validation --tail`.
8. Token + cost meter per session (record `usage` from each API call, surface in `harness status`).
9. Promote `packet.md` to a real Planner role for the `full_team` route.
10. Human-in-the-loop gate: `harness gate <id>` blocks until you type `y`.

### P2 — nice

11. Git worktree per session — each run isolated, no contamination on parallel runs.
12. Sandboxed workspace (Docker) like OpenHands — for runs that touch shell / destructive ops.
13. `harness eval` — replay an archived session against a modified agent prompt for A/B comparison.

## Public-repo references

### 1. `ai-boost/awesome-harness-engineering`

*The* curated taxonomy for this discipline. Defines the 12-category framework used in the Gaps table (Agent Loop, Planning, Context, Tools, Skills/MCP, Permissions, Memory, Orchestration, Verification, Observability, DX, Human-in-the-Loop). Points at canonical implementations per category:

- **LangGraph** — loop primitives
- **Letta/MemGPT** — 3-tier memory architecture (study before extending `memory/`)
- **Composio** — tool wrapper library
- **TaskWeaver** — plan-then-execute
- **MCP Inspector** — MCP debugging

Use it as a **self-audit checklist** — walk the harness through each row, identify the gap. Highest-leverage read for this stage.

URL: https://github.com/ai-boost/awesome-harness-engineering

### 2. `OpenHands/software-agent-sdk` (V1)

Production SDK from the OpenHands team (formerly OpenDevin). v1.24.0 (May 2026), used at TikTok / Netflix / Amazon / Google / NVIDIA. Core abstractions worth stealing:

- **Event stream as source of truth** — every action/observation is an event; state derives from replaying events. Replaces the current ad-hoc `log.jsonl` + `checkpoints/NNN.json` split with one append-only log. Resume = re-derive state from events, not load a snapshot.
- **Workspace abstraction** — local *or* ephemeral Docker/K8s. Same agent code, different sandbox. Solves P2 #12 cleanly.
- **Tool definitions** as first-class composable objects with schemas, not just frontmatter strings.
- **REST + WebSocket agent server** — decouples driver (the `harness` CLI) from runtime (the agent process). Lets a UI be added later without rewriting the engine.

Don't fork it. Read `Agent`, `EventStream`, `Workspace`, `Conversation` modules and steal the patterns into the TypeScript layer.

URL: https://github.com/OpenHands/software-agent-sdk

### Honorable mention

**`bradAGI/awesome-cli-coding-agents`** — narrower list focused on terminal-native coding agents + their harnesses (Claude Code, Codex, Gemini CLI, Aider, Goose, OpenCode). Useful when comparing how each one handles checkpoints, parallelism, autonomous loops.

URL: https://github.com/bradAGI/awesome-cli-coding-agents

## Sources

- [awesome-harness-engineering](https://github.com/ai-boost/awesome-harness-engineering)
- [OpenHands software-agent-sdk](https://github.com/OpenHands/software-agent-sdk/)
- [awesome-cli-coding-agents](https://github.com/bradAGI/awesome-cli-coding-agents)
- [awesome-agent-harness](https://github.com/Picrew/awesome-agent-harness)
- [HKUDS/OpenHarness](https://github.com/HKUDS/OpenHarness)
