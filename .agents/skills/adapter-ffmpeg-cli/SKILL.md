---
name: ffmpeg-cli
description: CLI adapter for FFmpeg — audio compression, segmentation, and format conversion for transcription preprocessing.
layer: global
tags:
  - audio
  - compression
  - segmentation
  - ffmpeg
  - cli
permissions:
  shell: true
interfaces:
  - id: operation
    description: Compress or segment operation.
    required: true
    type: string
    examples: [compress, segment]
  - id: input-file
    description: Audio source path.
    required: true
    type: string
    examples: [recording.m4a, ./audio/interview.wav]
  - id: bitrate
    description: Optional bitrate in kbps.
    required: false
    type: string
    examples: ['64', '128']
  - id: output-path
    description: Optional output destination path.
    required: false
    type: string
    examples: [recording.compressed.mp3, ./tmp/output.mp3]
---

# FFmpeg CLI

Adapter for [FFmpeg](https://ffmpeg.org/) — a command-line tool for audio and video processing. Primary use case in leafcutter-os: compressing audio recordings before transcription to reduce file size, upload time, and API token cost.

Use `operation` to choose whether the adapter should compress or segment audio, pass the source recording as `input-file`, override `bitrate` when speech defaults are not enough, and set `output-path` when the generated destination should not be auto-derived.

## Prerequisites

- **FFmpeg installed:** `brew install ffmpeg` (macOS) or `apt install ffmpeg` (Linux).
- **Supported input formats:** WAV, MP3, M4A, FLAC, OGG, WEBM, AAC, and most other audio formats.

### Prerequisite Check

```bash
command -v ffmpeg >/dev/null 2>&1 || { echo "MISSING: ffmpeg not installed"; exit 1; }
```

## Audio Compression

### Default: Speech-Optimized Compression

Compress the `input-file` to 64 kbps mono MP3 at 16 kHz — optimal for speech transcription when `operation` is `compress`:

```bash
audio-compress path/to/recording.m4a
```

Output is written to the derived `output-path` `path/to/recording.compressed.mp3` and a JSON summary goes to stdout.

### Custom Settings

Override `bitrate` when the default speech profile should produce a denser output, and pass `output-path` when the generated file should not use the standard sibling naming.

```bash
audio-compress path/to/recording.m4a --bitrate 128 --samplerate 22050 --output custom.mp3
```

### Programmatic Usage

```bash
node cmd/compress.mjs input.m4a --output output.mp3
```

## Output Format

The command writes diagnostics to stderr and a JSON result to stdout:

```json
{
  "input": "/absolute/path/to/original.m4a",
  "output": "/absolute/path/to/original.compressed.mp3",
  "inputSize": 460000000,
  "outputSize": 118000000,
  "reduction": "74%"
}
```

## Design Rationale

- **64 kbps mono at 16 kHz** is the sweet spot for speech: reduces file size by ~74% while maintaining full fidelity for transcription models.
- Higher bitrates (128 kbps) offer no measurable improvement in transcription accuracy for speech content.
- The compressed output stays within inline upload limits (< 25 MB) for most recordings under 1 hour.

## Audio Segmentation

Split audio into fixed-duration segments for chunked processing. Used by the
audio-to-text pipeline when files exceed the Gemini API size limit.

### Default: 1-Hour Segments

```bash
node cmd/segment.mjs path/to/recording.mp3
```

Output is written to `path/to/segments/segment_000.mp3`, `segment_001.mp3`, etc.

### Custom Duration and Output

```bash
node cmd/segment.mjs recording.mp3 --output-dir ./chunks --duration 1800
```

### Segment Output Format

```json
{
  "input": "/absolute/path/to/recording.mp3",
  "outputDir": "/absolute/path/to/segments/",
  "duration": 3600,
  "segments": ["/path/to/segments/segment_000.mp3", "..."],
  "count": 8
}
```

### Segmentation Rationale

- Uses `-c copy` (stream copy) — no re-encoding, instant segmentation
- Segment boundaries align to keyframes, not exact timestamps
- 1-hour default chosen to keep `operation` `segment` outputs well under API limits when the incoming `input-file` already reflects the default 64 kbps `bitrate` profile (~55 MB)

## External References

- [FFmpeg Official Documentation](https://ffmpeg.org/documentation.html)
- [FFmpeg Audio Encoding Guide](https://ffmpeg.org/wiki/Encode/HighQualityAudio)
- [Audio Codecs and Bitrates](https://wiki.hydrogenaud.io/index.php?title=Comparison_of_codecs)
