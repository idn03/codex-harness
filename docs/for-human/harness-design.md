# Harness Design — Initial Answer

## Mental model

Think of harness as **3 layers above the agent**:

```
┌─ Driver loop ───────────────────────────────┐
│  intent → triage → plan → work → validate   │
├─ State/memory ──────────────────────────────┤
│  append log + distilled facts + checkpoints │
├─ Agent adapter ─────────────────────────────┤
│  Claude Code / Codex / API call             │
└─────────────────────────────────────────────┘
```

Agent (Claude Code / Codex) = engine. Harness = chassis + dashboard + black box recorder.

## Loop — refined version of yours

Your loop is solid. One missing step: **Triage** before Plan. And **Memory write** at end (separate from "Harness delta" — code learnings vs process learnings).

```
Human intent
  → Feature intake      (parse free text → structured spec)
  → Triage              (easy/medium/hard + risk flags)
  → Product packet      (plan: steps, files, success criteria)
  → Agent work loop     (step → checkpoint → validate → repeat)
  → Product delta       (diff/output shipped)
  → Validation proof    (tests, lints, human accept)
  → Memory write        (facts learned about project)
  → Harness delta       (process learnings: this triage wrong, etc.)
  → Next intent
```

Key invariant: **every loop edge writes a checkpoint**. Resume = read last checkpoint, replay from there.

## Storage layout

```
.harness/
  intake/           # queued intents
  active/
    <session-id>/
      intent.md
      triage.json   # {difficulty, risk, est_steps}
      packet.md     # plan
      checkpoints/  # numbered, append-only
        001.json    # {step, files_touched, validation, next}
        002.json
      log.jsonl     # every agent turn
  memory/
    project.md      # distilled facts (like CLAUDE.md)
    patterns.md     # repeated solutions
  archive/<session>/  # post-validation
```

Checkpoint = small JSON. Cheap to write every step. Resume reads last `checkpoints/*.json`, feeds it back to the agent as primer.

## Triage scheme

Cheap LLM call before main agent. Output:

```json
{
  "difficulty": "easy|medium|hard",
  "signals": ["needs_new_files", "touches_auth", "irreversible"],
  "route": "single_agent|planner_worker|full_team",
  "est_checkpoints": 3
}
```

Routes:
- **easy** → single agent, no plan doc, just do
- **medium** → plan doc + single worker + validator
- **hard** → full team (planner, worker, validator, memory)

This answers "should I use a team" dynamically per task.

## Open questions

### 1. Apply to real project

Harness lives as separate tool (`harness` binary or `npx harness`). Per-project state in `.harness/` dir. Adoption path:

- **Phase 1:** Wrap existing Claude Code calls. Harness CLI = `harness run "<intent>"` → writes intake, runs triage, calls Claude Code with primed context, captures output to checkpoints.
- **Phase 2:** Hook into Claude Code's `Stop` / `PostToolUse` hooks (settings.json) to auto-write checkpoints without wrapping.
- **Phase 3:** Project-agnostic — `.harness/` works in any repo language.

Keep harness code out of project repo. Project just has `.harness/` (gitignore most, commit `memory/project.md` only).

### 2. Agents team — yes, but lazy

Default = 1 agent does all roles. Promote to team when triage says "hard" OR when you see role failures (validator missed bug → split validator out).

Minimum useful team:
- **Triager** — classifies (small/fast model, Haiku-tier)
- **Planner** — packet writer (smart model, used once per task)
- **Worker** — executes steps (smart model, most tokens)
- **Validator** — independent check (separate context = catches blind spots)
- **Scribe** — distills checkpoints → memory updates (small model, post-task)

Choose roles by **where mistakes happen**, not by org-chart symmetry. If your worker always plans well but validates poorly, add Validator. Don't add Planner just because.

### 3. Claude Code / Codex integration

**Claude Code:**
- Worker layer = subagents (Agent tool) + skills
- Checkpoint writes = `PostToolUse` + `Stop` hooks → shell script appends to `checkpoints/`
- Triage = custom skill `/triage` or pre-prompt hook
- Memory = already has `MEMORY.md` system; harness syncs its `memory/project.md` → `CLAUDE.md`

**Codex:**
- No native subagents. Harness wraps Codex CLI per-step.
- Checkpoint via stdout parsing or wrapper script.
- Triage = pre-call LLM step in harness driver.

So: Claude Code = tighter integration (hooks do work). Codex = harness drives more explicitly.

## Suggested first build (1-day MVP)

1. `harness init` — create `.harness/` skeleton
2. `harness run "<intent>"` — writes intake, calls triage (one Claude API call), prints packet
3. `harness work` — loops Claude Code per step, writes checkpoint after each
4. `harness resume` — reads last checkpoint, re-primes Claude Code
5. `harness memory` — distills `log.jsonl` → `memory/project.md`
