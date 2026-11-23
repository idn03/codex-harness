# Markdown harness for Codex CLI

Use this harness to develop from prompts while keeping requirements, verification and project history in the repository. A single Codex CLI session can follow all nine role briefs. The harness requires only Markdown files.

## Adopt it in a project

1. Bring [AGENTS.md](AGENTS.md), [RULES.md](RULES.md), the role briefs in `agents/`, [the workflow specification](specs/workflow.md) and [the memory guide](memory/README.md) into the target repository. Merge any existing instructions at those paths. Keep that project's README and task history.
2. Record project-specific build and test commands, branch policy and delivery constraints in the target project's instructions. Put the feature's observable requirements under `specs/`.
3. Start `codex` in the project root. Describe the outcome and point to the relevant spec or ask Codex to draft one. Role selection and checkpoints are instructions Codex follows during the session.

## Prompt-driven development

For a new feature, begin with a decision the product owner can review.

> Draft specs/export.md for CSV export of the current filtered view. Include column order, escaping and empty results. Stop after the spec so I can review the behavior.

Once the requirements are settled, start delivery.

> Implement specs/export.md. Use export-csv as the task ID. Follow the workflow and record which checks verify each acceptance criterion.

For a later session, name the task record. This works even when starting a fresh conversation.

> Resume memory/tasks/export-csv.md. Compare the working tree with the latest checkpoint, report any drift and continue from the first eligible stage.

## Automatic model selection

Start the coordinator on Astra for analysis and planning. If your CLI offers these model IDs and effort levels, you can launch it from the project root and authorize model-selectable workers in the same prompt.

```sh
codex -m gpt-6.2-astra -c 'model_reasoning_effort="high"' \
  "Implement specs/export.md. Use subagents and select their model and reasoning effort according to specs/workflow.md. Record the results in the task checkpoint."
```

For the export task, the coordinator can send a specified column-order change and its regression check to Sol at low effort. If the check reveals an unexplained difference between two export paths, Astra investigates. Once the cause is known, Sol can implement the repair and rerun the check.

The Markdown supplies the selection policy. An automatic switch takes effect when the CLI can launch an authorized worker with the selected settings. In a single session with fixed settings, the coordinator records the fallback. To change that session yourself, open `/model` and confirm the selection with `/status`. Model availability and supported reasoning levels depend on your account and client. [CLI model selection](https://developers.openai.com/codex/cli/slash-commands) · [Reasoning settings](https://developers.openai.com/codex/config-reference)

## Optional plugins and token use

Run `codex plugin list` to see the plugins available in your CLI marketplace. Use a plugin when the information needed for the current stage lives outside the checkout. [Codex plugin guide](https://developers.openai.com/codex/plugins)

| Plugin | When it helps | Prompt scope |
| --- | --- | --- |
| GitHub | A required check fails in hosted CI. | Fetch the failing job for one pull request. Return the relevant error and job link. |
| Linear | A product decision lives in an issue. | Read one issue by ID. Extract the acceptance criteria and unresolved decisions for the spec owner. |

Keep the local spec authoritative after reconciling external requirements. Read only the current role brief, relevant criteria and latest task entry on a handoff. Link to evidence and request a focused excerpt when needed. These practices limit repeated context. Actual token usage depends on the task and the tool output. [OpenAI plugin catalog](https://github.com/openai/plugins)
