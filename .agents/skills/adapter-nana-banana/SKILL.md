---
name: nana-banana
description: Technical skill for generating images via Google's generative AI APIs. Use this as the execution layer when another skill (e.g., optimize-media-image) defines *what* to generate.
layer: global
interfaces:
    - id: model-id
      description: Gemini image model identifier.
      required: true
      type: string
      examples: [imagen-4.0-generate-001, imagen-4.0-ultra-generate-001]
    - id: prompt
      description: Image generation instruction text.
      required: true
      type: string
      examples: ['Rural village event scene at golden hour', 'Minimal infographic background for a LinkedIn post']
    - id: aspect-ratio
      description: Optional dimension ratio such as 16:9 or 1:1.
      required: false
      type: string
      examples: ['16:9', '1:1']
---

# Nana Banana — Image Generation Technical Reference

Technical skill for generating images via Google's generative AI APIs. Use this as the execution layer when another skill (e.g., optimize-media-image) defines *what* to generate.

Choose the rendering runtime with `model-id`, provide the actual image instruction through `prompt`, and set `aspect-ratio` whenever the output dimensions must stay under explicit layout control.

## Available Models

Choose `model-id` from the following runtime families depending on quality, speed, and aspect-ratio control needs:

| Model ID | API Method | Aspect Ratio Control | Best For |
| --- | --- | --- | --- |
| imagen-4.0-generate-001 | generate_images | Yes (parameter) | Production images, controlled dimensions |
| imagen-4.0-ultra-generate-001 | generate_images | Yes (parameter) | Highest quality, slower |
| imagen-4.0-fast-generate-001 | generate_images | Yes (parameter) | Speed-optimized |
| gemini-2.5-flash-image | generate_content | No (always 1024x1024) | Conversational image editing, iterative refinement |
| gemini-3-pro-image-preview | generate_content | No | High-fidelity with reasoning |
| gemini-3.1-flash-image-preview | generate_content | No | Fast iterative |

## Critical Rules

- **For controlled aspect ratio, ALWAYS use ****generate_images**** with an Imagen `model-id`.** The generate_content method ignores `aspect-ratio` instructions in `prompt` and always outputs 1024x1024.
- **Gemini CLI does NOT support image generation models via the ****-m**** flag.** Do not attempt gemini -m imagen-*or gemini -m gemini-*-image.
- **There is no ****--output_file**** flag** in the Gemini CLI.

## Supported Aspect Ratios (Imagen models)

"1:1" | "3:4" | "4:3" | "9:16" | "16:9"

## Execution: Python API (Recommended)

This is the only reliable method for generating images with controlled dimensions.

### Prerequisites

pip3 install --break-system-packages google-genai Pillow

### Environment

Requires GEMINI_API_KEY environment variable.

### Code Template — Controlled Aspect Ratio (Imagen)

import os

from google import genai

from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

response = client.models.generate_images(

    model="imagen-4.0-generate-001",

    prompt="<YOUR_PROMPT>",

    config=types.GenerateImagesConfig(

        number_of_images=1,

        aspect_ratio="16:9",  # or "1:1", "3:4", "4:3", "9:16"

    )

)

for img in response.generated_images:

    with open("output.png", "wb") as f:

        f.write(img.image.image_bytes)

### Code Template — Conversational / Iterative (Gemini Flash Image)

Use when `aspect-ratio` is not critical or when `prompt` needs conversational image-to-image refinement:

import os

from google import genai

from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

response = client.models.generate_content(

    model="gemini-2.5-flash-image",

    contents="<YOUR_PROMPT>",

    config=types.GenerateContentConfig(

        response_modalities=["IMAGE", "TEXT"],

    )

)

for part in response.candidates[0].content.parts:

    if part.inline_data is not None:

        with open("output.png", "wb") as f:

            f.write(part.inline_data.data)

**Warning:** This always outputs 1024x1024 regardless of prompt instructions.

## Execution: Gemini CLI Delegation (Fallback)

The Gemini CLI can generate images only when invoked **without** specifying an image model — it uses its default model's tool-calling to delegate internally. This is unreliable and slow.

gemini -p "<PROMPT_REQUESTING_IMAGE_GENERATION_AND_FILE_SAVE>" --yolo

**Do NOT use:**

- gemini -m gemini-2.0-flash-preview-image-generation — model does not exist
- gemini -m gemini-2.5-flash-preview-image-generation — model does not exist
- gemini -m gemini-2.0-flash-exp — model does not exist
- gemini --output_file — flag does not exist

## Verification

Always verify output dimensions after generation:

from PIL import Image

img = Image.open("output.png")

print(f"Dimensions: {img.size[0]}x{img.size[1]} (ratio: {img.size[0]/img.size[1]:.2f})")

Expected ratios: 16:9 → ~1.78, 4:3 → ~1.33, 1:1 → 1.00

## External References

- [Google Imagen API documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/image/overview)
- [Imagen on Vertex AI — Generate images](https://cloud.google.com/vertex-ai/generative-ai/docs/image/generate-images)
