---
name: audio-to-text
description: Transcribe audio recordings into clean, complete text using Gemini CLI or multimodal agent fallback.
layer: global
tags:
  - transcription
  - audio
  - gemini
interfaces:
  - id: audio-file-path
    description: Path to the audio recording to transcribe.
    required: true
  - id: glossary-file
    description: Optional domain terminology reference.
    required: false
  - id: output-format
    description: Optional transcript format preference.
    required: false
---

# Audio to Text

Transcribe spoken audio into accurate, usable text that preserves meaning, order, and relevant detail while removing low-value speech noise.

Use this skill when the task is to produce a clean transcript from a recording, meeting, interview, or voice note. Keep the transcript faithful to the source, but remove verbal artifacts that do not add meaning.

Pass the recording through `audio-file-path`, supply `glossary-file` when domain spelling matters, and use `output-format` only to control how the final transcript is emitted.

## Transcription Strategy

This skill supports two execution paths. Always attempt the primary path first.

### Primary: Gemini CLI via Helper Script (preferred)

Use the bundled `transcribe.mjs` helper from the `gemini-cli` adapter. This automatically handles file size, prerequisites, and API selection for best quality and reliability.

**Quick start:**

```bash
node .agents/skills/adapter-gemini-cli/cmd/transcribe.mjs recording.m4a --output transcript.md
```

**With glossary for domain terms:**

```bash
node .agents/skills/adapter-gemini-cli/cmd/transcribe.mjs recording.m4a \
  --glossary terminology.md \
  --output transcript.md
```

This path maps `glossary-file` to `--glossary`, and the chosen `output-format` should only affect how the transcript is rendered after the `audio-file-path` has been transcribed.

**What the helper does:**

- ✅ Verifies Python 3 and `google-genai` SDK (exits with code 2 if missing)
- ✅ Uploads audio via Gemini Files API for reliable processing
- ✅ Applies consistent transcription rules
- ✅ Writes status updates to JSON file (optional `--status-file`)
- ✅ Defaults to `<input-basename>.transcript.md` when `--output` is omitted
- ✅ Returns exit code: 0 = success, 2 = missing deps, 3 = transcription failed

For full helper documentation, see [gemini-cli.adapter.md](../adapter-gemini-cli/SKILL.md).

### Fallback: Agent Multimodal Processing

If Gemini CLI is unavailable (not installed, no authentication, network issues), fall back to the agent's native multimodal capabilities:

**When to use:**

- `gemini` command not found or authentication fails
- File is too large for API tier
- Agent runtime supports audio natively (e.g., Claude with audio, GPT-4o)

**How it works:**

1. The agent loads the audio file into its context window
2. The agent applies the transcription rules from the [Workflow](#workflow) section
3. Quality depends on the agent's audio processing capabilities

**Limitations:**

- Not all agent runtimes support audio input (check your runtime documentation)
- May have lower quality or different accuracy than Gemini
- No glossary support

**Hard constraint:** If the agent runtime cannot process audio natively, report failure with a clear error message. Never generate, invent, or approximate transcript content.

## Workflow

**Hard constraints — violations invalidate the transcript:**

- **Never translate.** Output must be in the same language as the spoken audio. A translated transcript is not a transcript.
- **Never fabricate.** If the audio cannot be processed, fail with an error. Do not generate plausible content.
- **Transcript only.** Return the transcript text as a raw document. No preface, no explanation, no surrounding commentary, no conversational framing.

**Default output:** When no output path is specified, write the transcript to `<input-basename>.transcript.md` next to the source file.

1. Process the recording from `audio-file-path` start to finish without skipping sections, even when the source is long.
2. Preserve the order of statements and the substantive content of what was said.
3. Remove purely verbal filler words and clearly irrelevant side talk that does not contribute to the main topic.
4. Use any provided glossary or reference document as the primary source for specialized terminology, names, and preferred spelling.
5. When a term is not covered by the glossary, infer the most likely correct spelling from the surrounding context rather than leaving obvious phonetic mistakes in place.
6. Correct spelling and grammar only to improve readability, while preserving the intended meaning and the speaker's substantive style.
7. Format the result as plain flowing text with logical paragraph breaks at topic shifts.

## Templates / Examples

Expected output shape:

```text
<Plain transcript text only>

<Second paragraph when the topic changes>

<Third paragraph when needed>
```

## Guidelines

- Do not summarize, compress, or omit relevant content for brevity.
- Distinguish between speech cleanup and meaning changes: remove noise, not information.
- If the recording references domain-specific terms, prefer glossary-backed spelling over generic transcription guesses.
- If the input includes greetings or minor social filler that is clearly outside the task's main purpose, remove it only when the user expects a cleaned transcript rather than a forensic verbatim record.
- If verbatim legal, journalistic, or evidentiary fidelity is required, treat that as a stricter mode and do not remove content unless explicitly instructed.

## Context Grounding

Context grounding improves transcription accuracy by providing speaker names, acronyms, and domain terminology alongside the audio. Two mechanisms are supported:

1. **Explicit glossary:** Pass a `--glossary <path>` file to the transcription command.
2. **Auto-discovery:** Place `.md` files in the same directory as the audio input. When no explicit glossary is given, all co-located `.md` files (excluding `*.transcript.md`) are concatenated and used as context.

**Recommended context file content:**

- Speaker names and roles (helps with attribution and spelling)
- Acronyms and their expansions
- Product names, project names, and technical terms
- Preferred spellings for ambiguous words

This works because the Gemini model receives the context alongside the audio prompt, allowing it to resolve ambiguous terms during transcription rather than requiring a separate post-correction pass.
