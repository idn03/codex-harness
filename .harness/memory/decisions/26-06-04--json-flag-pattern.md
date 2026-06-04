# Machine-readable output via `--json` flag on CLI commands

Date: 2026-06-04
Session: 26-06-04--08-35-16-g6h8

## Context

`harness status` needed to support both human-readable text output (default) and machine-readable JSON output for scripting/piping.

## Decision

Add a `--json` Commander option to the command. Data gathering is extracted into a dedicated lib helper that returns a typed interface. The command calls the helper once, then branches only on output format.

```
gatherStatus(root) -> StatusData
  if --json: JSON.stringify(data)
  else:      formatted text
```

## Alternatives considered

- Separate `harness status --json` subcommand — rejected: unnecessary surface area, same intent.
- Inline the directory reads inside the command — rejected: text and JSON paths would share no code and could drift.

## Why

Single source of truth for data; output format is the only variable. Matches the lib convention already established by `harness-paths.ts` (interface + function, kebab filename).
