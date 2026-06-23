---
name: google-cli-docs
description: This skill enables an agent to read, create, and edit Google Docs using the gws (Google Workspace CLI). It focuses on **reliable Markdown conversion** and **local document caching** to avoid redundant API calls.
layer: global
interfaces:
  - id: document-id
    description: Google Docs document identifier.
    required: true
    type: string
    examples: ['1A2B3C4D5E6F7G8H9I0J', 1m2n3o4p5q6r7s8t9u0v]
  - id: operation
    description: Read, write, update, or cache-sync operation.
    required: true
    type: string
    examples: [read, write, batch-update]
  - id: cache-strategy
    description: Optional markdown cache lookup strategy.
    required: false
    type: string
    examples: [check-cache-first, refresh-cache]
---

# Google CLI Docs

This skill enables an agent to read, create, and edit Google Docs using the gws (Google Workspace CLI). It focuses on **reliable Markdown conversion** and **local document caching** to avoid redundant API calls.

The adapter always targets one `document-id`, performs a specific `operation` such as read or batch update, and may apply a `cache-strategy` before hitting the API.

## 1. Technical Execution Logic

- **Auth & Target**: Verify gws auth list and identify `document-id`.
- **Read or Write**: Determine which `operation` should run: reading, writing, or both.
- **Local Cache Check**: Before fetching from the API, check for a cached Markdown version according to `cache-strategy`.
- **Conversion**: When reading docs, convert the raw JSON to clean Markdown using the formatting rules in this skill.
- **Incremental Edits**: Apply changes via batchUpdate, working with character indices.

## 2. Command Reference

| Action | Command | Note |
| --- | --- | --- |
| Get Document | gws docs documents get --params '{"documentId":"ID"}' | Returns full document JSON. No field filtering available. |
| Create Document | gws docs documents create --json '{"title":"Name"}' | Creates a blank document. Only title is used. |
| Append Text | gws docs +write --document ID --text 'content' | Helper: appends plain text at end of body. |
| Batch Update | gws docs documents batchUpdate --params '{"documentId":"ID"}' --json '{"requests":[...]}' | Insert, delete, format, or replace content atomically. |
| Get Schema | gws schema docs.Request | Check any schema by name (e.g., docs.InsertTextRequest). |

### CLI Parameter Rules

- --params provides URL/path parameters (e.g., documentId). Used by get and batchUpdate.
- --json provides the **request body**. Only valid for write commands (batchUpdate, create). **Not available on ****get****.**
- The get command has no field-filtering option — it always returns the full document JSON.

### Output Handling

The CLI outputs Using keyring backend: keyring to stderr before the JSON response. When parsing output programmatically:

# Save to file first, then parse (recommended)

gws docs documents get --params '{"documentId":"ID"}' 2>/dev/null > "$TMPDIR/document.json"

# Or redirect stderr when piping

gws docs documents get --params '{"documentId":"ID"}' 2>/dev/null | python3 ...

**Never pipe directly without****2>/dev/null** — the keyring message will break JSON parsing.

## 3. Available Request Types (batchUpdate)

| Request | Purpose |
| --- | --- |
| insertText | Insert text at a specific index or end of segment. |
| deleteContentRange | Delete content within a range. |
| replaceAllText | Find-and-replace across the document. |
| insertInlineImage | Insert an image at a location. |
| insertTable | Insert a table at a location. |
| insertTableRow / insertTableColumn | Add rows/columns to existing tables. |
| deleteTableRow / deleteTableColumn | Remove rows/columns. |
| createParagraphBullets | Apply bullet/numbered list formatting. |
| deleteParagraphBullets | Remove bullet formatting. |
| updateTextStyle | Apply bold, italic, font, color, links. |
| updateParagraphStyle | Apply heading styles, alignment, spacing. |
| updateDocumentStyle | Modify page-level styles (margins, size). |
| replaceNamedRangeContent | Replace content within named ranges. |
| createNamedRange | Create a named range for later reference. |
| insertSectionBreak / insertPageBreak | Structural breaks. |
| createHeader / createFooter | Add header/footer sections. |

### Index-Based Editing

Google Docs uses **character indices** for all positioning. Key rules:

- The document body starts at index 1 (index 0 is reserved).
- Every newline (\n) counts as one character.
- **Insert operations shift all subsequent indices.** Always work **back-to-front** when making multiple insertions in a single batchUpdate.
- To append at the end, use endOfSegmentLocation instead of calculating the final index.

# Insert text at end of document

gws docs documents batchUpdate --params '{"documentId":"ID"}' \

  --json '{"requests":[{"insertText":{"endOfSegmentLocation":{},"text":"New paragraph\n"}}]}'

# Insert text at specific position (index 10)

gws docs documents batchUpdate --params '{"documentId":"ID"}' \

  --json '{"requests":[{"insertText":{"location":{"index":10},"text":"Inserted text"}}]}'

# Delete content between indices 5 and 15

gws docs documents batchUpdate --params '{"documentId":"ID"}' \

  --json '{"requests":[{"deleteContentRange":{"range":{"startIndex":5,"endIndex":15}}}]}'

# Apply heading style to a range

gws docs documents batchUpdate --params '{"documentId":"ID"}' \

  --json '{"requests":[{"updateParagraphStyle":{"range":{"startIndex":1,"endIndex":20},"paragraphStyle":{"namedStyleType":"HEADING_1"},"fields":"namedStyleType"}}]}'

## 4. Document-to-Markdown Conversion

When reading a Google Doc, the agent must convert the JSON response to clean Markdown. This section codifies the proven formatting rules derived from production use.

### Structural Element Mapping

| Doc Element | Markdown Output |
| --- | --- |
| paragraph with HEADING_1 | # text |

| paragraph with HEADING_2 | ## text |

| paragraph with HEADING_3–HEADING_6 | ###–###### accordingly |

| paragraph with NORMAL_TEXT | Plain paragraph text |
| paragraph with bullet property | - text (nested:   - text) |
| table (1×1) | Render cell content inline (layout box) |
| table (multi-cell) | Markdown table with ` |
| inlineObjectElement (image) | ![alt](images/filename.ext) — see §7 |
| tableOfContents | Skip |
| sectionBreak | Skip |

### Text Run Formatting

| Style | Markdown |
| --- | --- |
| Bold | **text** |
| Italic | *text* |
| Bold + Italic | ***text*** |
| Strikethrough | ~~text~~ |
| Code font (Courier New / Consolas) | `text` |
| Link | [text](url) |

### Critical Sanitization Rules

These handle real-world issues found in Google Docs output:

- **Control characters**: Strip \u0000–\u0008, \u000B, \u000C, \u000E–\u001F.
- **Private Use Area**: Strip \uE000–\uF8FF (used internally by Docs).
- **Pipe escaping in tables**: Replace | with \| inside table cell content.
- **Empty paragraphs**: Render as a single \n (blank line), not a paragraph.

### Markdown Linting (Post-Processing)

After conversion, apply markdown formatting rules defined in the `markdown-formatting` skill (`@schafe-vorm-fenster/skill-markdown-formatting`). The skill defines the heuristics; its companion `adapter-markdown-cli` provides automated enforcement via `cmd/lint.mjs`.

```bash
# Fix all violations in the converted file
markdown-lint --fix <output-file>.md

# Or check without modifying (CI mode)
markdown-lint <output-file>.md
```

The `markdown-formatting` skill enforces (among others):

- **Max blank lines**: Collapse sequences of 3+ blank lines to exactly 2.
- **Heading spacing**: Ensure exactly one blank line before and after headings.
- **List compaction**: Remove blank lines between consecutive list items within the same list.
- **Line ending normalization**: Convert \r\n to \n.
- **Trailing newline**: Ensure file ends with exactly one \n.

Always run markdown linting on the converted Markdown before caching or committing. Refer to `markdown-formatting.skill.md` for the full rule set.

### Conversion Script (Python, for use in $TMPDIR)

When the document is large or complex, use this script pattern:

# !/usr/bin/env python3

"""Convert Google Doc JSON to Markdown."""

import json, sys, re

def convert(doc):

    title = doc.get('title', 'Untitled')

    md = f"# {title}\n\n"

    body = doc.get('body', {}).get('content', [])

    md += process_elements(body)

    return lint_markdown(md)

def process_elements(elements):

    result = ""

    for el in elements:

        if 'paragraph' in el:

            result += process_paragraph(el['paragraph'])

        elif 'table' in el:

            result += process_table(el['table'])

    return result

def process_paragraph(para):

    style = para.get('paragraphStyle', {}).get('namedStyleType', 'NORMAL_TEXT')

    elements = para.get('elements', [])

    text = ''.join(process_text_run(e.get('textRun', {})) for e in elements if 'textRun' in e)

    if not text.strip():

        return "\n"

    # Bullet handling

    bullet = para.get('bullet')

    if bullet:

        level = bullet.get('nestingLevel', 0)

        indent = '  ' * level

        return f"{indent}- {text}\n"

    # Heading mapping

    headings = {

        'HEADING_1': '#', 'HEADING_2': '##', 'HEADING_3': '###',

        'HEADING_4': '####', 'HEADING_5': '#####', 'HEADING_6': '######'

    }

    if style in headings:

        return f"{headings[style]} {text}\n\n"

    return f"{text}\n\n"

def process_text_run(run):

    text = run.get('content', '')

    # Sanitize control chars and PUA

    text = re.sub(r'[\u0000-\u0008\u000b\u000c\u000e-\u001f\ue000-\uf8ff]', '', text)

    style = run.get('textStyle', {})

    if not style:

        return text

    # Formatting

    bold = style.get('bold', False)

    italic = style.get('italic', False)

    if bold and italic:

        text = f"***{text}***"

    elif bold:

        text = f"**{text}**"

    elif italic:

        text = f"*{text}*"

    if style.get('strikethrough'):

        text = f"~~{text}~~"

    # Code font

    font = style.get('weightedFontFamily', {}).get('fontFamily', '')

    if font in ('Courier New', 'Consolas'):

        text = f"`{text}`"

    # Links

    link = style.get('link', {}).get('url')

    if link:

        text = f"[{text.strip()}]({link})"

    return text

def process_table(table):

    rows = table.get('tableRows', [])

    if not rows:

        return ""

    # 1x1 table = layout box

    if len(rows) == 1 and len(rows[0].get('tableCells', [])) == 1:

        cell = rows[0]['tableCells'][0]

        return process_elements(cell.get('content', [])) + "\n"

    # Multi-cell table

    result = ""

    for i, row in enumerate(rows):

        cells = [get_cell_text(c).replace('|', '\\|') or ' ' for c in row.get('tableCells', [])]

        result += "| " + " | ".join(cells) + " |\n"

        if i == 0:

            result += "| " + " | ".join('---' for _ in cells) + " |\n"

    return result + "\n"

def get_cell_text(cell):

    text = ""

    for el in cell.get('content', []):

        for te in el.get('paragraph', {}).get('elements', []):

            text += te.get('textRun', {}).get('content', '')

    return text.strip()

def lint_markdown(md):

    md = md.replace('\r\n', '\n')

    md = re.sub(r'\n{3,}', '\n\n', md)  # max 2 blank lines

    # Heading spacing

    md = re.sub(r'([^\n])\n(#{1,6}\s+)', r'\1\n\n\2', md)

    md = re.sub(r'(#{1,6}\s+[^\n]*)\n+', r'\1\n', md)

    md = re.sub(r'(#{1,6}\s+[^\n]*)\n([^\n])', r'\1\n\n\2', md)

    return md.strip() + "\n"

if **name** == '**main**':

    doc = json.load(open(sys.argv[1]))

    print(convert(doc))

## 5. Local Document Cache (Self-Managed Memory)

The agent maintains a local Markdown cache of documents to avoid redundant API calls. This is especially useful for **read-heavy workflows** where the same document is referenced multiple times.

### Storage Location & Format

Store one cached file per document in the project folder:

<project-folder>/doc-cache/<documentId>.md

The file uses YAML front matter for metadata and the converted Markdown as body:

---

documentId: "<ID>"

title: "<Document Title>"

fetchedAt: "2026-05-05T14:32:00Z"

revisionId: "<revisionId from doc>"

sourceUrl: "https://docs.google.com/document/d/<ID>/edit"

---

# Document Title

Content in Markdown...

### Lifecycle Rules

| Trigger | Action |
| --- | --- |
| First read | No cache file exists → fetch from API → convert to Markdown → write cache file. |
| Subsequent read | Cache exists → read local file, skip API call. |
| Staleness check | If fetchedAt is older than 1 hour, re-fetch from API and overwrite cache. |
| After write operations | If the agent edits the document, invalidate cache → re-fetch and rewrite. |
| Manual refresh | If the user explicitly asks to refresh, re-fetch regardless of age. |
| Read-only task | If the task is purely reading documents (research, analysis), always prefer the cache. Log whether cache was used. |

### When to Cache

The agent **should** cache when:

- The task involves reading a document that may be referenced again in the session.
- The user asks to "read", "summarize", "analyze", or "review" a document.
- Multiple documents are being compared or cross-referenced.

The agent **should NOT** cache when:

- The user explicitly asks for the "latest" or "live" version.
- The document is being actively edited in the same session.
- The task is a one-shot write operation with no subsequent reads.

### Reading the Cache

Before any document fetch, the agent must:

- Check if <project-folder>/doc-cache/<documentId>.md exists.
- If it exists, parse the YAML front matter to check fetchedAt.
- If fresh (< 1 hour) and no writes have occurred, use the cached Markdown.
- If stale or missing, fetch from API, convert, and write/overwrite cache.

### Cache Invalidation

The cache is invalidated (must be refreshed) when:

- The agent performs any batchUpdate or +write on the document.
- The user reports that the content has changed.
- The fetchedAt timestamp exceeds 1 hour.
- The user explicitly requests a refresh.

## 6. Writing to Google Docs

### Simple Append

For appending plain text:

gws docs +write --document DOC_ID --text 'New content here'

### Structured Content (batchUpdate)

For structured edits, use batchUpdate. Always follow these principles:

- **Fetch first**: Get the current document to know the end index.
- **Work back-to-front**: When inserting at multiple positions, start from the highest index to avoid shifting subsequent positions.
- **Separate structure from style**: First insert text, then apply formatting in a second batchUpdate.

#### Example: Insert a Heading + Body Text

# Step 1: Insert the heading text

gws docs documents batchUpdate --params '{"documentId":"ID"}' \

  --json '{"requests":[

    {"insertText":{"endOfSegmentLocation":{},"text":"\nNew Section\n"}},

    {"updateParagraphStyle":{

      "range":{"startIndex":START,"endIndex":END},

      "paragraphStyle":{"namedStyleType":"HEADING_2"},

      "fields":"namedStyleType"

    }}

  ]}'

# Step 2: Append body content

gws docs +write --document ID --text 'Body paragraph content here.'

#### Example: Replace All Occurrences

gws docs documents batchUpdate --params '{"documentId":"ID"}' \

  --json '{"requests":[{"replaceAllText":{"containsText":{"text":"old text","matchCase":true},"replaceText":"new text"}}]}'

### Markdown-to-Doc Workflow

When the user provides Markdown content to insert into a Google Doc:

- **Parse Markdown structure** — Identify headings, paragraphs, lists, bold/italic spans.
- **Insert plain text first** — Use insertText to place all content as plain text.
- **Apply paragraph styles** — Use updateParagraphStyle to set heading levels.
- **Apply text styles** — Use updateTextStyle for bold, italic, links, etc.
- **Apply bullets** — Use createParagraphBullets for list items.

This two-pass approach (text then formatting) avoids index calculation errors from interleaved inserts and style changes.

## 7. Embedded Images

Google Docs stores images as `inlineObjectElement` entries within paragraph elements. The actual image metadata (including the download URI) lives in the top-level `inlineObjects` dictionary of the document JSON. See **External References** for the canonical API documentation.

### 7.1 Reading: Download Images to Local Subfolder

When converting a Google Doc to Markdown, extract and download all embedded images:

#### Document JSON Structure

```json
{
  "inlineObjects": {
    "kix.abc123": {
      "inlineObjectProperties": {
        "embeddedObject": {
          "imageProperties": {
            "contentUri": "https://lh3.googleusercontent.com/...",
            "sourceUri": "https://example.com/original.png"
          },
          "title": "Screenshot",
          "description": "Alt text for the image",
          "size": { "width": {"magnitude": 400, "unit": "PT"}, "height": {"magnitude": 300, "unit": "PT"} }
        }
      }
    }
  }
}
```

Paragraph elements reference images via:

```json
{
  "inlineObjectElement": {
    "inlineObjectId": "kix.abc123",
    "textStyle": {}
  }
}
```

#### Image Download Workflow

1. **Create image subfolder**: `<output-dir>/images/`
2. **Extract image URIs** from `inlineObjects[id].inlineObjectProperties.embeddedObject.imageProperties.contentUri`
3. **Download each image** using `curl` and save with a stable filename derived from the object ID.
4. **Insert Markdown image link** at the corresponding position: `![alt](images/<filename>)`

#### Updated Conversion Script (Image Support)

Add the following to the conversion script:

```python
import os, urllib.request, hashlib

def extract_images(doc, output_dir):
    """Download all inline images and return a mapping of objectId -> local path."""
    inline_objects = doc.get('inlineObjects', {})
    image_map = {}
    images_dir = os.path.join(output_dir, 'images')
    os.makedirs(images_dir, exist_ok=True)

    for obj_id, obj in inline_objects.items():
        props = obj.get('inlineObjectProperties', {}).get('embeddedObject', {})
        image_props = props.get('imageProperties', {})
        uri = image_props.get('contentUri') or image_props.get('sourceUri')
        if not uri:
            continue

        # Derive stable filename from object ID
        safe_id = obj_id.replace('.', '_')
        # Detect extension from URI or default to .png
        ext = '.png'
        for candidate in ('.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'):
            if candidate in uri.lower():
                ext = candidate
                break
        filename = f"{safe_id}{ext}"
        local_path = os.path.join(images_dir, filename)

        # Download image
        urllib.request.urlretrieve(uri, local_path)
        image_map[obj_id] = f"images/{filename}"

    return image_map

def process_paragraph(para, image_map=None):
    style = para.get('paragraphStyle', {}).get('namedStyleType', 'NORMAL_TEXT')
    elements = para.get('elements', [])
    text = ''
    for e in elements:
        if 'textRun' in e:
            text += process_text_run(e['textRun'])
        elif 'inlineObjectElement' in e:
            obj_id = e['inlineObjectElement'].get('inlineObjectId', '')
            local_path = (image_map or {}).get(obj_id, '')
            # Use description as alt text if available
            alt = ''
            if image_map and obj_id:
                alt = image_map.get(f"{obj_id}_alt", '')
            text += f"![{alt}]({local_path})"

    if not text.strip():
        return "\n"

    # Bullet handling
    bullet = para.get('bullet')
    if bullet:
        level = bullet.get('nestingLevel', 0)
        indent = '  ' * level
        return f"{indent}- {text}\n"

    # Heading mapping
    headings = {
        'HEADING_1': '#', 'HEADING_2': '##', 'HEADING_3': '###',
        'HEADING_4': '####', 'HEADING_5': '#####', 'HEADING_6': '######'
    }
    if style in headings:
        return f"{headings[style]} {text}\n\n"

    return f"{text}\n\n"
```

#### Shell Workflow (Download with Images)

```bash
# 1. Fetch document JSON
gws docs documents get --params '{"documentId":"DOC_ID"}' 2>/dev/null > "$TMPDIR/document.json"

# 2. Convert to Markdown with images downloaded to ./images/
python3 convert_with_images.py "$TMPDIR/document.json" ./output/
# Produces: ./output/document.md and ./output/images/*.png
```

#### Cache Structure with Images

When caching documents that contain images, store them alongside the Markdown:

```
<project-folder>/doc-cache/
├── <documentId>.md        ← Markdown with relative image links
└── <documentId>/
    └── images/
        ├── kix_abc123.png
        └── kix_def456.jpg
```

The Markdown file references images with relative paths: `![alt](<documentId>/images/kix_abc123.png)`

### 7.2 Writing: Upload Markdown with Images to Google Doc

When creating or updating a Google Doc from Markdown that contains image links (`![alt](path)`), embed the images into the document.

#### Requirements

- Images must be accessible via a **public HTTPS URL** for `insertInlineImage`.
- Local images must first be uploaded to a hosting location (e.g., Google Drive with link sharing, or a public bucket).

#### Workflow: Markdown with Images → Google Doc

1. **Parse Markdown** — Identify all image references: `![alt](url_or_path)`
2. **Resolve image URIs**:
   - If the path is already an HTTPS URL → use directly.
   - If the path is local → upload to Google Drive and obtain a shareable link, or use another public host.
3. **Insert text content first** (two-pass approach as described in §6).
4. **Insert images** at their correct positions using `insertInlineImage`.

#### insertInlineImage Request

```bash
gws docs documents batchUpdate --params '{"documentId":"DOC_ID"}' \
  --json '{"requests":[{
    "insertInlineImage": {
      "uri": "https://example.com/image.png",
      "location": {"index": 42},
      "objectSize": {
        "width": {"magnitude": 400, "unit": "PT"},
        "height": {"magnitude": 300, "unit": "PT"}
      }
    }
  }]}'
```

#### Parameters for insertInlineImage

| Field | Required | Description |
| --- | --- | --- |
| uri | Yes | Public HTTPS URL of the image. Must be accessible without authentication. |
| location.index | Yes | Character index where the image will be inserted. |
| endOfSegmentLocation | Alt. | Use instead of location to append at end. |
| objectSize.width | No | Desired display width (magnitude + unit). |
| objectSize.height | No | Desired display height (magnitude + unit). |

#### Index Calculation for Images

Images occupy **one character index** in the document once inserted. When inserting multiple images:

- Work **back-to-front** (highest index first) to avoid shifting.
- After inserting text in the first pass, re-fetch the document to get accurate indices for image positions.
- Each image placeholder in the Markdown (e.g., `![alt](url)`) corresponds to a position in the inserted text. Track these positions during the text insertion pass.

#### Example: Full Markdown-to-Doc with Images

```bash
# 1. Create document
DOC_ID=$(gws docs documents create --json '{"title":"My Document"}' 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin)['documentId'])")

# 2. Insert plain text (with image placeholders noted)
gws docs documents batchUpdate --params "{\"documentId\":\"$DOC_ID\"}" \
  --json '{"requests":[{"insertText":{"endOfSegmentLocation":{},"text":"Introduction\n\nSee the diagram below:\n\n\nConclusion\n"}}]}'

# 3. Apply heading styles (omitted for brevity, see §6)

# 4. Insert image at the blank line (calculate index from step 2)
gws docs documents batchUpdate --params "{\"documentId\":\"$DOC_ID\"}" \
  --json '{"requests":[{"insertInlineImage":{"uri":"https://example.com/diagram.png","location":{"index":35},"objectSize":{"width":{"magnitude":468,"unit":"PT"},"height":{"magnitude":300,"unit":"PT"}}}}]}'
```

#### Uploading Local Images to Google Drive

When images are local files, upload them to Google Drive first:

```bash
# Upload image to Drive and get file ID
FILE_ID=$(gws drive files create --upload-file ./images/diagram.png --json '{"name":"diagram.png","mimeType":"image/png"}' 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")

# Make it publicly accessible
gws drive permissions create --params "{\"fileId\":\"$FILE_ID\"}" --json '{"role":"reader","type":"anyone"}'

# Use the Drive thumbnail URL for embedding
IMAGE_URI="https://drive.google.com/uc?id=$FILE_ID&export=download"
```

### 7.3 Image Size Defaults

When no explicit size is available (e.g., downloading from a Doc), use the size from the document's `embeddedObject.size`. When uploading without size info, use these defaults:

| Context | Default Width | Default Height |
| --- | --- | --- |
| Full-width image | 468 PT (6.5 inches, standard body width) | Auto (maintain aspect ratio) |
| Inline icon | 18 PT | 18 PT |
| Diagram/chart | 400 PT | 300 PT |

To maintain aspect ratio when only width is specified, omit `height` from the request — Google Docs will auto-scale.

## 8. Error Handling

| Error | Cause | Resolution |
| --- | --- | --- |
| 400 Bad Request | Invalid index, deleting protected content, or malformed JSON. | Re-fetch document, recalculate indices, retry. |
| 404 Not Found | Wrong documentId or no access. | Verify ID and permissions. |
| 403 Forbidden | Insufficient OAuth scope. | Check gws auth list for docs scope. |
| Index out of range | Document changed between read and write. | Re-fetch, recalculate indices, retry. |

## 9. Incremental Execution Model

Like the slides skill, the agent works **incrementally**:

- **One logical edit per batchUpdate** — don't batch unrelated changes.
- **Verify after writes** — re-fetch or use cache invalidation to confirm changes.
- **Report progress** — brief confirmation after each operation.
- **Pause for user input** — unless pre-approved, check with the user between major changes.

### Exception: Atomic Multi-Request Batches

Multiple requests may be combined when they form an **atomic logical unit**:

- Insert text + apply style to that same text.
- Delete a range + insert replacement content at the same position.
- Multiple replaceAllText operations that are independent.

Never combine unrelated structural changes (e.g., editing section A and section B) in one batch.

## External References

- [Google Docs API — Request types (batchUpdate)](https://developers.google.com/workspace/docs/api/reference/rest/v1/documents/request)
- [InsertInlineImageRequest](https://developers.google.com/workspace/docs/api/reference/rest/v1/documents/request#InsertInlineImageRequest)
- [ReplaceImageRequest](https://developers.google.com/workspace/docs/api/reference/rest/v1/documents/request#ReplaceImageRequest)
- [Document resource — InlineObject](https://developers.google.com/workspace/docs/api/reference/rest/v1/documents#InlineObject)
- [Images guide](https://developers.google.com/workspace/docs/api/how-tos/images)
- [Google Docs API overview](https://developers.google.com/workspace/docs/api)
