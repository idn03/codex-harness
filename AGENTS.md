## Project

Harness CLI — gives AI agents memory, triage, checkpoints, and a role-split agent team across projects.

## Loop

`Human intent → Feature intake → Triage → Product packet → Agent work loop (step → checkpoint → validate) → Product delta → Validation proof → Memory write → Next intent`

## Team

| Agent | Role |
|---|---|
| triager | Classifies intent (easy/medium/hard) and routes |
| orchestrator | Routes work, enforces gates, never writes code |
| implementer | Writes application code |
| tester | Writes and runs tests |
| reviewer | Reviews code quality + intent adherence (PASS/FAIL) |
| validator | Final gate (typecheck/lint/build/test) |
| archivist | Distils durable memory after PASS |

See `.claude/agents/` for full role definitions.

## State Layout

```
.harness/
  intake/                 # queued intents
  active/<session-id>/
    intent.md
    triage.json
    packet.md
    checkpoints/NNN.json  # append-only
    log.jsonl
  archive/<session-id>/   # post-validation
  memory/
    progress.md           # archivist: running summary
    patterns.md           # archivist: repeated solutions
    decisions/            # archivist: non-obvious choices
    notes/
      gotchas.md          # archivist: traps + fixes
      context-map.md      # archivist: where things live
    policy/
      deny-paths.txt      # human: paths agents must not write
    views/                # human: curated reading orders
```

## Rules

@.claude/rules/general.md

## Memory

@.harness/memory/progress.md
@.harness/memory/notes/context-map.md
@.harness/memory/notes/gotchas.md
@.harness/memory/policy/deny-paths.txt
