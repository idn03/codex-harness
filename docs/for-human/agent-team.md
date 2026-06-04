# Agent Team — Decision Doc

## TL;DR

Copy quick-meet-Di's 6-agent team verbatim in role structure. Add **Triager** as the first gate so the harness can pick the right pipeline shape per task.

Final team: 7 agents. 4 write (implementer, tester, archivist, + future planner if needed), 3 read-only (triager, reviewer, validator), 1 coordinator (orchestrator).

## Why this team

quick-meet-Di proved the role split works in practice:

- **Strong write/read separation** — only implementer and tester write source; reviewer and validator are read-only. Catches the "writer marks own homework" failure mode.
- **Single coordinator** — orchestrator never touches code. Makes cycle limits enforceable.
- **Memory writer is its own agent** — archivist runs only on PASS. Failed runs don't pollute durable memory.
- **Specialized models** — opus for writers (implementer, tester, orchestrator), sonnet for verifiers (reviewer, validator, archivist), haiku for the cheap classifier (triager).

## What's new: Triager

quick-meet-Di starts every run with the full pipeline. That's fine for a single product where every change is roughly the same shape. The harness is general-purpose — most intents are small. Triager classifies first and the orchestrator picks:

- `single_agent` — implementer only, no review cycle. For typos, one-file edits.
- `planner_worker` — implementer + validator, skip separate reviewer. Medium tasks.
- `full_team` — every stage. Hard tasks or flagged signals (auth, schema, irreversible).

Cost: 1 cheap Haiku call up front. Saves expensive cycles on easy intents.

## Role table

| Agent | Model | Write scope | Hard gate |
|---|---|---|---|
| triager | haiku | `.harness/active/<id>/triage.json` only | — |
| orchestrator | opus | None (coordinates only) | Cycle limits |
| implementer | opus | App source code | `lint`, `typecheck` exit 0 |
| tester | opus | Test files only | `test` exit 0 |
| reviewer | sonnet | None (read-only) | No critical/major issues |
| validator | sonnet | None (read-only) | `test`/`lint`/`typecheck`/`build` exit 0 |
| archivist | sonnet | `.harness/memory/` only (not `policy/`, `views/`) | Runs on PASS only |

## When to add more agents

Don't add now. Add when triage routinely says "full_team" and you see the same failure pattern repeating:

- **Planner** — if intents arrive vague and implementer keeps re-planning mid-task → split planning into its own agent that writes `packet.md`.
- **Security reviewer** — if a security-sensitive area gets a regression that the general reviewer missed → specialize.
- **Doc writer** — if shipped features ship without user-facing docs → add. Not before.

Rule: choose roles by where mistakes happen, not by org-chart symmetry.

## How Claude Code / Codex use this team

**Claude Code:**
- `.claude/agents/*.md` files are picked up natively. Orchestrator invokes others via the Agent tool with `subagent_type`.
- Hooks (`PostToolUse`, `Stop` in `settings.json`) can auto-write checkpoints, so the harness CLI doesn't have to wrap every call.
- `MEMORY.md` system already exists — the harness syncs `.harness/memory/progress.md` content into it (or vice versa) so Claude Code's memory tooling stays primary.

**Codex:**
- No native subagents. The harness CLI invokes Codex once per role, passing the role's prompt as system message. Each call writes its checkpoint via the wrapper.
- Memory loading = harness reads `.harness/memory/*.md` and pastes the relevant slices into the Codex prompt.

So: Claude Code = the agents are the team. Codex = the CLI simulates the team.

## Open follow-ups

- Wire orchestrator's `Agent(triager, ...)` tool grants once we test on a real intent.
- Decide `single_agent` route's checkpoint cadence — current default writes one per Edit, may be too noisy.
- Confirm haiku is enough for triager on ambiguous intents; consider sonnet fallback when `signals: ["ambiguous_intent"]`.
