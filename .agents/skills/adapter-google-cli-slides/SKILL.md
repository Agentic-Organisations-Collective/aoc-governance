---
name: google-cli-slides
description: This skill enables an agent to perform high-fidelity slide generation and manipulation using the gws (Google Workspace CLI). It prioritizes **Layout Consistency** by enforcing a "Master-First" analysis before any content injection.
layer: global
interfaces:
  - id: presentation-id
    description: Google Slides presentation identifier.
    required: true
    type: string
    examples: ['1A2B3C4D5E6F7G8H9I0J', 1q2w3e4r5t6y7u8i9o0p]
  - id: operation
    description: Layout-audit, inject-content, export-pdf, or verify operation.
    required: true
    type: string
    examples: [layout-audit, inject-content, export-pdf]
  - id: layout-id
    description: Optional master layout identifier.
    required: false
    type: string
    examples: [TITLE_AND_BODY, TWO_COLUMN]
  - id: output-path
    description: Optional PDF export destination path.
    required: false
    type: string
    examples: [./out/deck.pdf, exports/presentation.pdf]
---

# Google CLI Slides

This skill enables an agent to perform high-fidelity slide generation and manipulation using the gws (Google Workspace CLI). It prioritizes **Layout Consistency** by enforcing a "Master-First" analysis before any content injection.

Every run targets a specific `presentation-id`, selects an `operation` such as layout audit or PDF export, can narrow work to one `layout-id`, and may emit a concrete file to `output-path` during export flows.

## 1. Technical Execution Logic

- **Auth & Target**: Verify gws auth list and identify `presentation-id`.
- **Layout Audit**: Retrieve all layout names and placeholder metadata.
- **Semantic Selection**: Match content blocks to the most appropriate `layout-id` when one is specified.
- **Constraint Calculation**: Calculate maximum character/line limits based on placeholder dimensions.
- **Incremental Execution**: Apply the selected `operation` **one slide at a time**, verifying each step before proceeding — like a human collaborator working live in the deck.

## 2. Command Reference

| Action | Command | Note |
| --- | --- | --- |
| Get Presentation | gws slides presentations get --params '{"presentationId":"ID"}' | Returns the full presentation for `presentation-id` (layouts, slides, elements). No field filtering available. |
| Create Deck | gws slides presentations create --json '{"title":"Name"}' | Initialize a new file. |
| Get Schema | gws schema slides.CreateSlideRequest | Check any schema by name (e.g., slides.Request, slides.LayoutReference). |
| Apply Changes | gws slides presentations batchUpdate --params '{"presentationId":"ID"}' --json '{"requests":[...]}' | Add slides, text, or images atomically before any export writes to `output-path`. |

### CLI Parameter Rules

- --params provides URL/path parameters (e.g., presentationId). Used by get and batchUpdate.
- --json provides the **request body**. Only valid for write commands (batchUpdate, create). **Not available on ****get****.**
- The get command has no field-filtering option — it always returns the full presentation JSON.

### Output Handling

The CLI outputs Using keyring backend: keyring to stderr before the JSON response. When parsing output programmatically:

# Save to file first, then parse (recommended)

gws slides presentations get --params '{"presentationId":"ID"}' 2>/dev/null > "$TMPDIR/presentation.json"

python3 parse_script.py

# Or redirect stderr when piping

gws slides presentations get --params '{"presentationId":"ID"}' 2>/dev/null | python3 ...

**Never pipe directly without****2>/dev/null** — the keyring message will break JSON parsing.

## 3. Layout Analysis Process (Agent Rulebook)

To ensure presentations remain professional, the agent **must** follow this analysis loop:

### Step A: Semantic Identification

Map the technical layout names to presentation goals:

- TITLE -> Main Title Slide.
- SECTION_HEADER -> Transition Slides.
- TWO_COLUMN -> Comparisons or Features.
- TITLE_AND_BODY -> Standard Text/Bullets.

### Step B: Formatting Constraints

Before writing text, the agent must estimate the "Safe Zone":

- **Titles**: Max 1 line. If text > 60 chars, truncate or rewrite.
- **Body Text**: Ensure font size allows for at least 0.5 inches of padding from the box edge.
- **Bullets**: Limit to 7 per slide. Use a second slide for overflow rather than shrinking font size.

## 4. Layout Memory (Persistent Cache)

The layout analysis from Step 3 is expensive and rarely changes. To avoid re-running it on every interaction, the agent **must** persist the result as a memory file and consult it first.

### Storage Location & Format

Store one memory file per `presentation-id` deck in the same project folder:

<project-folder>/layout-memory/<presentationId>.md

The file uses YAML front matter for metadata and Markdown for the structured layout data:

---

presentationId: "<ID>"

title: "<Deck Title>"

analyzedAt: "2026-05-05T14:32:00Z"

layoutCount: 8

---

# Master Layout Structure

## Layouts

| Layout Name | Semantic Role | Placeholders | Constraints |

| --- | --- | --- | --- |

| TITLE | Main Title Slide | TITLE, SUBTITLE | Title: max 60 chars / 1 line |

| SECTION_HEADER | Transition Slide | TITLE | Title: max 60 chars / 1 line |

| TITLE_AND_BODY | Standard Text | TITLE, BODY | Body: max 7 bullets |

| TWO_COLUMN | Comparison | TITLE, BODY_L, BODY_R | Max 3 bullets/col |

| ... | ... | ... | ... |

## Placeholder Details

### TITLE (Layout: TITLE)

- objectId: `p1_title`
- size: { width: 720pt, height: 60pt }
- position: { x: 40pt, y: 180pt }
- fontConstraint: max 44pt, 1 line

(repeat for each placeholder)

### Lifecycle Rules

| Trigger | Action |
| --- | --- |
| First use | No memory file exists → run full Layout Analysis (Step 3) → write memory file. |
| Subsequent use | Memory file exists → read it and skip the API call. |
| Periodic refresh | If analyzedAt is older than 7 days, re-run analysis and overwrite the file. |
| Conflict detected | If a batchUpdate fails with an objectId mismatch, or a placeholder referenced in memory doesn't exist on the slide → treat memory as stale → re-run analysis → overwrite. |
| Manual trigger | If the user explicitly requests a layout refresh, re-run and overwrite regardless of age. |

### Reading the Memory

Before any slide creation or editing operation, the agent must:

- Check if <project-folder>/layout-memory/<presentationId>.md exists.
- If it exists, read it and parse the YAML front matter to check analyzedAt.
- If fresh (< 7 days) and no conflicts have occurred, use the cached data as the authoritative layout reference.
- If stale or missing, proceed to a full analysis and write/overwrite the memory file.

### Writing & Updating the Memory

When writing or updating a memory file, the agent must:

- Run the full Layout Analysis Process (Section 3, Steps A & B).
- Format the results using the template above.
- Write the file to the designated path, overwriting any existing content.
- Confirm the update in the execution log (e.g., "Layout memory refreshed for ").

### Conflict Detection (Auto-Refresh)

The agent must monitor for these signals during slide operations:

- **objectId not found** — A placeholder ID from memory doesn't match the live deck.
- **Layout name mismatch** — A layout referenced in memory no longer exists or has been renamed.
- **Unexpected placeholder count** — The number of placeholders on a layout differs from memory.

When any of these occur:

- Log the conflict (e.g., "Conflict: placeholder p3_body not found on layout TITLE_AND_BODY").
- Immediately re-run the full Layout Analysis.
- Overwrite the memory file.
- Retry the failed operation with the refreshed data.

## 5. Incremental Execution Model

The agent works **interactively and incrementally** — never preparing an entire presentation in isolation and pushing it in one monolithic update. Instead, it acts like a human collaborator: one slide at a time, visible in real-time.

### Core Principle

**One logical unit per batchUpdate call.** A "logical unit" is typically one slide (creation + content injection) or one focused edit to an existing slide.

### Step-by-Step Workflow

- **Create the slide** — Issue a batchUpdate with createSlide for a single slide using the correct layout.
- **Inject content** — Issue a follow-up batchUpdate to insert text/images into the placeholders of that slide.
- **Verify** — Optionally retrieve the presentation state to confirm the slide looks correct.
- **Report** — Briefly confirm to the user what was done (e.g., "Slide 3 created: Section Header — 'Market Opportunity'").
- **Advance** — Move to the next slide only after the previous one is confirmed.

### Why Not One Big Batch?

| Concern | Incremental Approach |
| --- | --- |
| Error isolation | A failure affects only one slide, not the entire deck. |
| User visibility | The user sees progress in real-time inside Google Slides. |
| Course correction | The user can intervene or redirect after any step. |
| Conflict detection | Layout memory mismatches surface immediately per-slide, not after 20 slides fail. |
| Collaboration | Mirrors how a human teammate would build slides — one at a time, checking alignment as they go. |

### Batching Exceptions

Multiple requests **may** be combined into a single batchUpdate only when:

- They target the **same slide** (e.g., create slide + insert title + insert body = one atomic unit).
- They are trivial formatting changes across adjacent slides (e.g., applying the same font fix to 3 consecutive slides).

Never combine slide creation for multiple different slides into one call.

### User Interaction Points

After completing each logical unit, the agent should pause and:

- Summarize what was written (slide number, layout used, headline/content preview).
- Ask if the user wants to adjust before continuing.
- If the user has pre-approved the full outline, the agent may proceed without pausing but must still execute incrementally (one slide per step) and report progress.

## 6. Example: Multi-Column Constraint Enforcement

If a 4-column layout is detected for detailed metrics:

- **Header**: Limit to 2 words per column.
- **Content**: Max 3 bullet points per column.
- **Formatting**: Ensure all 4 columns use identical font sizes (GWS CLI batchUpdate allows specifying font scale).

## 7. Agent Troubleshooting & Hints

### Avoiding Layout Drift

- **Rule**: Never create "Text Boxes" from scratch on a blank slide if a layout exists.
- **Reason**: Standard layouts handle responsive resizing better and maintain brand-approved alignment.

### Debugging API Requests

- Use gws schema slides.<SchemaName> to find the exact key names for JSON requests (e.g., gws schema slides.CreateSlideRequest, gws schema slides.LayoutReference).
- If a batchUpdate fails, check the objectId of the page or element being targeted.
- Use gws slides presentations get --help to verify available flags before assuming parameters exist.

### Handling Images

- Images should be inserted into **Image Placeholders** rather than floating on the canvas to ensure they respect the master layout's aspect ratio.

## [!IMPORTANT]

Agent Goal: Never win a design award for "creativity." Win it for Consistency. A professional deck produced by an agent should look exactly like a deck produced by the company's marketing team. Use the Master Layout as the absolute source of truth.

## External References

- [Google Slides API — Request types (batchUpdate)](https://developers.google.com/workspace/slides/api/reference/rest/v1/presentations/request)
- [Google Slides API — Presentation resource](https://developers.google.com/workspace/slides/api/reference/rest/v1/presentations)
- [Google Slides API overview](https://developers.google.com/workspace/slides/api)
