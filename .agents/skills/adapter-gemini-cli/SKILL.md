---
name: gemini-cli
description: CLI adapter for Google Gemini — audio transcription, multimodal processing, and text generation via the local gemini command.
layer: global
tags:
  - transcription
  - audio
  - gemini
  - cli
permissions:
  shell: true
  network:
    allow:
      - generativelanguage.googleapis.com
interfaces:
  - id: audio-file-path
    description: Path to the audio recording to transcribe.
    required: true
    type: string
    examples: [recording.m4a, ./audio/interview.wav]
  - id: model
    description: Optional Gemini model identifier.
    required: false
    type: string
    examples: [gemini-2.5-flash, gemini-2.5-pro]
  - id: glossary-file
    description: Optional domain terminology reference file.
    required: false
    type: string
    examples: [./glossaries/civic-terms.txt, ./context/domain-glossary.md]
  - id: output-path
    description: Optional transcript destination path.
    required: false
    type: string
    examples: [recording.transcript.md, ./out/interview-transcript.md]
---

# Gemini CLI

Adapter for the [Gemini CLI](https://github.com/google-gemini/gemini-cli) — a local command-line interface to Google's Gemini models. Primary use case in leafcutter-os: transcribing audio files into clean text using multimodal Gemini models.

Treat `audio-file-path` as the primary source asset, use `model` to override the default Gemini runtime when needed, attach `glossary-file` for domain spelling control, and set `output-path` when the transcript should land somewhere other than the default sibling markdown file.

## Prerequisites

- **Python 3 with google-genai SDK:** `pip install google-genai` (required for audio transcription).
- **Authentication:** A valid `GEMINI_API_KEY` environment variable or Google Cloud credentials.
- **Authentication:** A valid `GEMINI_API_KEY` environment variable or Google Cloud credentials for the selected `model`.
- **Supported audio formats:** WAV, MP3, M4A, FLAC, OGG, WEBM (all formats supported by the Gemini API).
- **Gemini CLI (optional):** `npm install -g @google/gemini-cli` — for general text generation and multimodal processing (not used for transcription from `audio-file-path`).

### Prerequisite Check

Before invoking transcription, verify that Python and the SDK are available:

```bash
# 1. Check Python 3
command -v python3 >/dev/null 2>&1 || { echo "MISSING: Python 3 not installed"; exit 1; }

# 2. Check google-genai SDK
python3 -c "from google import genai" 2>/dev/null || { echo "MISSING: pip install google-genai"; exit 1; }
```

If either check fails, fall back to the multimodal agent context strategy (see the `audio-to-text` skill).

## Bundled Helper: `cmd/transcribe.mjs`

This adapter includes a helper script that automates transcription via the Gemini Files API:

```bash
node cmd/transcribe.mjs <audio-file> [options]
```

**How it works:**

- Uploads audio via the Gemini Files API using the Python `google-genai` SDK
- Supports any file size supported by the API tier
- Defaults `output-path` to `<input-basename>.transcript.md` when `--output` is omitted

**Options:**

- `--model <name>`: Gemini model to use (default: `gemini-2.5-flash`)
- `--glossary <path>`: Reference `glossary-file` for domain-specific term spelling
- `--output <path>`: Write transcript to file (default: `<input>.transcript.md`)
- `--status-file <path>`: JSON status updates for monitoring/automation
- `--help`: Show detailed help

**Example:**

```bash
node cmd/transcribe.mjs meeting.m4a --output transcript.md --status-file status.json
```

## Audio Transcription

The `cmd/transcribe.mjs` helper is the recommended way to transcribe audio. For direct API usage, use the Python SDK:

### Basic Transcription (Python SDK)

```python
from google import genai

client = genai.Client()
audio = client.files.upload(file="recording.m4a")
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[audio, "Transcribe this audio recording completely. Preserve the order and substantive content. Remove verbal filler words. Output clean flowing text with paragraph breaks at topic shifts. Return only the transcript text."]
)
print(response.text)
client.files.delete(name=audio.name)
```

### Model Selection

| Model | Use Case |
| --- | --- |
| `gemini-2.5-flash` | Default `model` — fast, cost-effective, sufficient quality for most transcriptions |
| `gemini-2.5-pro` | Alternate `model` for complex audio with heavy domain terminology or overlapping speakers |

## General Multimodal Processing

The Gemini CLI also supports image and document inputs:

```bash
# Process an image
gemini -m gemini-2.5-flash -p "Describe this image." --file "screenshot.png"

# Process a PDF
gemini -m gemini-2.5-flash -p "Summarize this document." --file "document.pdf"
```

## Configuration

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | API key for authentication (alternative to Google OAuth login) |
| `GOOGLE_CLOUD_PROJECT` | Google Cloud project ID (for paid Code Assist license) |

## Limitations

- Maximum file size depends on the Gemini API tier (free tier: 20 MB audio).
- Very long recordings (>1 hour) may need to be split into segments.
- The CLI streams output to stdout — pipe or redirect as needed when `output-path` is not used.

## Error Handling

| Error | Resolution |
| --- | --- |
| `command not found: gemini` | Install Gemini CLI or check PATH |
| `Authentication required` | Run `gemini auth login` or set `GOOGLE_API_KEY` for the requested `model` |
| `File too large` | Split audio into smaller segments |
| `Unsupported format` | Convert the `audio-file-path` to WAV/MP3/M4A first |

## External References

- [Gemini CLI GitHub Repository](https://github.com/google-gemini/gemini-cli)
- [Gemini API Audio Documentation](https://ai.google.dev/gemini-api/docs/audio)
- [Supported Audio Formats](https://ai.google.dev/gemini-api/docs/prompting_with_media#supported_file_formats)
