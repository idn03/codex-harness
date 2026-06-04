# Patterns

> Repeated solutions worth remembering.

## Separate data gathering from output formatting

When a CLI command needs both human-readable and machine-readable output, extract a pure data-gathering function first, then branch on the output format flag after data is in hand. Both output paths share the single gather call and cannot drift.

Example: `gatherStatus(root)` → `StatusData`; `status-command.ts` calls it once, then branches on `options.json`.

Convention in this repo: the lib helper exports a named interface (`StatusData`) and a matching named function (`gatherStatus`) from a kebab-case file (`gather-status.ts`).
