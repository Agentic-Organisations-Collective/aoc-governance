---
name: publishing-execution
description: Execute timely publication of approved content proposals to designated surfaces, respecting scheduling and thematic sequencing.
layer: company
tags:
  - marketing
  - publishing
  - scheduling
  - automation
interfaces:
  - id: content-queue
    description: Approved proposals ready for scheduling.
    required: true
  - id: linkedin-target-profile
    description: Personal or company LinkedIn target profile context.
    required: true
  - id: schedule-data
    description: Optional publication calendar or thematic timing data.
    required: false
---

# Publishing Execution

Execute timely publication of approved content proposals to designated surfaces while maintaining logical thematic sequence and respecting scheduling constraints.

Use this playbook when approved proposals exist and need to be scheduled, sequenced, and published. **This is an execution playbook—not a planning tool.** For strategic planning that assigns inputs to audiences and surfaces, use [communication-planning](../communication-planning/communication-planning.playbook.md) first. For the content creation pipeline that produces proposals, use [content-generation-mapping](../content-generation-mapping/content-generation-mapping.playbook.md) instead.

## Prerequisites

- A `content-queue` with one or more approved proposals exists.
- Each approved proposal specifies the `linkedin-target-profile`, post text, media attachment (if any), and planned publication date from the available `schedule-data`.
- LinkedIn credentials are available through secure environment configuration.
- The [publish-media-post skill](../skill-publish-media-post/SKILL.md) is operational.

## Guidelines

- Never publish without explicit approval confirmation in the proposal metadata.
- Respect the scheduled sequence. Do not reorder posts for convenience unless a conflict requires it.
- If LinkedIn rate limits or technical issues prevent publication, halt the queue and report rather than retrying aggressively.
- Keep at least 4 hours between posts on the same profile to avoid feed flooding.
- Archive results immediately after publication. Do not batch archival.
- Treat the content plan as the source of truth for scheduling intent. If a proposal's date conflicts with the plan, flag it rather than overriding silently.

## Workflow

### Phase 1 — Queue Review

- Collect all approved proposals from the active `content-queue` that are due for publication.
- Sort by planned publication date.
- Check for scheduling conflicts from `schedule-data`: multiple posts on the same day for the same `linkedin-target-profile`.
- Verify thematic sequence: ensure back-to-back posts do not repeat the same theme or contradict each other.

Quality gate: a conflict-free, thematically coherent publication queue exists.

### Phase 2 — Pre-flight Validation

For each proposal in the queue:

- Verify post text is present and within LinkedIn character limits.
- Verify `linkedin-target-profile` is specified and accessible.
- Verify media attachment exists and is in a supported format (PNG, JPG, PDF).
- Verify the scheduled date is today or in the past (due for immediate publication) or set for future scheduling.
- Flag any proposal that fails validation and remove it from the active queue.

Quality gate: every proposal in the active queue passes all validation checks.

### Phase 3 — Execution

For each validated proposal, in chronological order:

- Hand off to the Publisher agent for execution.
- The Publisher uses [publish-media-post](../skill-publish-media-post/SKILL.md) to post or schedule.
- Capture the result: success (with URL and timestamp) or failure (with error details).
- Wait for confirmation before proceeding to the next post.

Quality gate: each post in the queue has a definitive outcome recorded.

### Phase 4 — Status Update and Archival

- Update each published proposal's status to "published" with timestamp and URL.
- Move published proposals to the archive location in the consuming workspace.
- For failed proposals, set status to "failed" with error details and flag for manual intervention.
- Update the content plan to reflect actual publication dates.

Quality gate: the content archive, content plan, and proposal statuses are all synchronized.

### Phase 5 — Reporting

- Produce a summary of the publishing run: how many published, how many failed, any scheduling adjustments made.
- Note any upcoming gaps in the schedule that may need new content.

Quality gate: a clear publishing report exists for the human operator.

## Output Format

### Publishing Run Report

#### Queue Summary

- Total approved: <count>
- Published: <count>
- Failed: <count>
- Deferred: <count>

#### Published Posts

| Title | Profile | Published At | URL |
| --- | --- | --- | --- |
| <title> | personal/company | <timestamp> | <url> |

#### Failed Posts

| Title | Profile | Error | Action Needed |
| --- | --- | --- | --- |
| <title> | personal/company | <error> | <next step> |

#### Schedule Outlook

- Next scheduled post: <date, title>
- Gaps identified: <date range or "none">
