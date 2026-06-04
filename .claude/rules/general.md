## General Rules

1. Choose clear and meaningful names.
2. Prefer explicit type annotations and generics for readability and type safety.
3. No file should exceed 120 lines.
4. Decompose complex logic into small, composable functions.
5. Favor immutability by returning new data instances.
6. Clearly separate pure logic from side-effect operations.
7. Keep data structures and the logic that manipulates them separate.
8. Use reusable patterns and higher-order functions to minimize repetition.
9. Maximize testability through purity and dependency injection.
10. Prefer built-in or proven third-party libraries over custom implementations.
11. Avoid advanced functional concepts (monads, specialized libraries) — prioritize maintainability.
12. Export only one item (function, class, type, interface) per file, except barrel (`index`) files.
13. Use kebab-case for directory names. File names must exactly match the name of the item they export.
14. Use named exports instead of default exports.
15. Only write documentation and add tests when explicitly requested.
16. Create a git commit each time a task is completed (if repo is git).
17. Unless otherwise requested, save temporary documents under `docs/temps`. Prefix filename with `YY-MM-DD--HH-mm-ss-` (UTC via CLI).
18. When the cause of an error is not yet clear, add debug logs at appropriate locations.
19. Always think and communicate in English unless explicitly asked otherwise.
20. When reading log files, check line count first. If it exceeds 75 lines, delegate to a subagent.
21. Use a subagent (e.g. Explore) for investigation across multiple files. Read directly only when the path is already known.
22. Only pursue performance improvements when performance is actually a problem.
23. Apply YAGNI.
24. Use widely adopted libraries; build in-house only when no third-party option fits.
25. Less is more.
26. TypeScript is the default unless explicitly told otherwise.
27. Do not unconditionally agree with the user. Critically evaluate.
28. When calling a subagent, pass all context information necessary for the task.

## Harness-Specific Rules

29. All run-time state lives under `.harness/`. Source code never reads/writes `.harness/intake`, `.harness/active`, `.harness/archive` outside the harness CLI itself.
30. Memory is the only directory under `.harness/` that may be committed to git. Everything else stays runtime-local.
31. Agents must not edit each other's domain (see each agent's "What You Must NOT Do").

## Documentation Policy

- Except for env, keep separate documentation minimal and concise.
- We do not write or maintain a README file.
- Architecture decision records are recorded by the archivist in `.harness/memory/decisions/`, not maintained by hand.
