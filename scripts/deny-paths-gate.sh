#!/usr/bin/env bash
# Claude Code PreToolUse hook — blocks Write/Edit/NotebookEdit against
# any path matching a substring in .harness/memory/policy/deny-paths.txt.
#
# Stdin JSON shape:
#   {
#     "tool_name": "Write" | "Edit" | "NotebookEdit",
#     "tool_input": { "file_path": "/abs/or/rel/path", ... },
#     "cwd": "/project/dir",
#     ...
#   }
#
# Exit 0 = allow, exit 2 = block (stderr returned to the calling agent).
set -euo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

case "$TOOL_NAME" in
  Write|Edit|NotebookEdit) ;;
  *) exit 0 ;;
esac

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')
DENY_FILE="${CWD:-.}/.harness/memory/policy/deny-paths.txt"

if [ -z "$FILE_PATH" ] || [ ! -f "$DENY_FILE" ]; then
  exit 0
fi

while IFS= read -r raw; do
  pattern="${raw%%#*}"
  pattern="$(echo "$pattern" | tr -d '[:space:]')"
  [ -z "$pattern" ] && continue
  case "$FILE_PATH" in
    *"$pattern"*)
      echo "Harness deny-path block: '$FILE_PATH' matches pattern '$pattern' in $DENY_FILE" >&2
      exit 2
      ;;
  esac
done < "$DENY_FILE"

exit 0
