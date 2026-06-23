---
name: github-cli
description: This file provides the logical framework and command reference for managing GitHub Actions, monitoring workflow runs, and extracting diagnostic logs using the gh CLI.
layer: global
interfaces:
  - id: operation
    description: GitHub CLI workflow or diagnostic operation to perform.
    required: true
    type: string
    examples: [run-list, run-view, run-watch]
  - id: target-run-id
    description: Optional workflow run identifier for run-specific diagnostics.
    required: false
    type: string
    examples: ['12345678901', '9876543210']
  - id: json-fields
    description: Optional explicit JSON fields to request from gh commands.
    required: false
    type: string
    examples: ['id,status,workflowName', 'databaseId,status,conclusion,createdAt']
---

# GitHub CLI Operations

This file provides the logical framework and command reference for managing GitHub Actions, monitoring workflow runs, and extracting diagnostic logs using the gh CLI.

Use `operation` to decide which GitHub CLI flow to run, provide `target-run-id` whenever the workflow is scoped to one specific run, and pass `json-fields` explicitly when a `gh ... --json` call needs structured output.

## 1. Logical Execution Sequence

When analyzing GitHub Actions, agents should follow this diagnostic path:

- **Auth & Context**: Verify gh authentication before any `operation` and identify the current repository.
- **Workflow Discovery**: List recent runs or specific workflows to identify `target-run-id`.
- **Run Overview**: Get a high-level summary for the selected `target-run-id`.
- **Deep Log Inspection**: Extract logs for failed jobs or specific steps as the chosen `operation`.
- **Interactive Monitoring**: Use "watch" or "follow" when the selected `operation` needs real-time visibility during active runs.

## 2. Core Discovery & Triggering

Commands to find workflows and start new runs.

| Action | Command | Note |
| --- | --- | --- |
| Check Auth | gh auth status | Ensures the agent has API access. |
| List Runs | gh run list | Shows the last 30 runs (all workflows). |
| List (JSON) | gh run list --json id,status,workflowName | Critical: Must specify `json-fields` in JSON mode. |
| Filter by Branch | gh run list --branch <name> | Narrow down runs to a specific feature branch. |
| Trigger Run | gh workflow run <name.yml> | Manually dispatches a workflow. |

## 3. Run Insights & Summaries

Retrieve metadata and status for specific execution attempts.

- **View Run Summary**: gh run view <run-id>
  - *Returns:* Jobs list, duration, and elapsed time.
- **Exit Code Integration**: gh run view <run-id> --exit-status
  - Returns a non-zero exit code if the run failed (useful for script logic).
- **Watch Progress**: gh run watch <run-id>
  - Provides a live-updating TUI of the run's progress.

## 4. Log Management & Extraction

Efficiently retrieving logs to diagnose CI/CD failures.

### Full Run Logs

- **View All Logs**: gh run view <run-id> --log
- **Search Logs (via Grep)**: gh run view <run-id> --log | grep "Error"

### Job-Specific Logs

If a run has multiple jobs, isolate the failure first:

- **Find Job IDs**: gh run view <run-id> --json jobs
- **View Job Log**: gh run view --job <job-id> --log
  - *Note:* You can also use gh job view <job-id> --log in recent CLI versions.

### Artifacts

- **List Artifacts**: gh run download <run-id> --list
- **Download All**: gh run download <run-id>

## 5. Agent Hints & Advanced Usage

### Explicit JSON Fields

Unlike other CLIs, gh requires you to explicitly name the fields you want when using --json.

- *Correct:* gh run list --json databaseId,status,conclusion,createdAt via explicit `json-fields`
- *Incorrect:* gh run list --json

### Debugging the CLI

If an API call fails with a 403 or 404, the agent should:

- Set export GH_DEBUG=api to see the underlying REST/GraphQL requests.

### Advanced Filtering (jq)

The gh CLI has built-in jq support. Use this to find the last failed run ID quickly:

- gh run list --limit 1 --status failure --json databaseId --jq '.[0].databaseId'

### 2026 "Agent Task" Insight

For repositories using GitHub's AI-native features:

- **View Agent Sessions**: gh agent-task view
- Use this to inspect logs of automated PR fixes or AI-generated commits.

## 6. Troubleshooting Logic

- **"No runs found"**: Verify the branch name or run gh run list --all to include disabled workflows.
- **"Permission Denied"**: Check if the token has the workflow scope via gh auth status.
- **Large Log Files**: If gh run view --log hangs, try downloading the logs as a zip: gh run download <run-id> --name logs.
- **Stuck Runs**: If a run is "queued" indefinitely, check GitHub Status or cancel it: gh run cancel <run-id>.

[!TIP]

**Need Syntax Help?
**

Always append --help to any command. For Actions specifically: gh run --help or gh workflow --help.

## External References

- [GitHub CLI manual](https://cli.github.com/manual/)
- [gh actions](https://cli.github.com/manual/gh_run)
- [gh workflow](https://cli.github.com/manual/gh_workflow)
- [GitHub Actions documentation](https://docs.github.com/en/actions)
