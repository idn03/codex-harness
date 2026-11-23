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

## Choosing plugins for a project

You can start using the harness with just the Markdown files. Once you know the project's stack and the work ahead, ask Codex for plugin recommendations in the project directory.

> I have added this workflow to a new React Native project. Read the spec and package manifest, then suggest plugins that would help with our next milestone. For each one, explain which task it helps with and what I would need to connect.

Codex checks the available plugin catalog against the project's existing tools and upcoming tasks. If the existing tools cover those tasks, an empty shortlist is a useful outcome. [Codex plugin guide](https://developers.openai.com/codex/plugins)

To keep token use low, scope each plugin request to the evidence needed for the current criterion. At handoff, pass a short finding and a reference to the source.
