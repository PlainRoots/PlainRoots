---
name: add-family-story
description: Add an approved text or audio family story and its optional images to the author's archive.
---

# Add a family story

Store every story in `people/<author-id>/`, regardless of who the story is
about. Register it in that author's `person.json`; the folder implies
attribution. Never hand-edit generated reports and never convert `remarks` into
a story automatically.

## Procedure

1. Identify the story's author. Ask for clarification when multiple people are
   plausible.
2. Confirm that the story and all media are approved for publication to
   repository collaborators. Do not add private conversations, credentials,
   addresses, phone numbers, or other sensitive material.
3. Determine the original language, date when known, and a concise title. Do
   not infer an unknown date.
4. Create a stable lowercase ASCII story ID with hyphens. Never reuse or rename
   an existing ID.
5. Save the original story as a non-empty Markdown content file named with a
   lowercase ASCII, hyphenated base and language suffix, such as
   `story-family-es-mx.md`. Preserve supplied text verbatim. For audio,
   transcribe the recording verbatim into this content file; never fabricate
   text.
6. After detecting the original language, offer only translations into
   different languages:
   - For English, offer no translation or Mexican Spanish.
   - For Spanish, offer no translation or English.
   - For another language, offer no translation, English, Mexican Spanish, or
     both.
   Save each complete translation in a separate lowercase ASCII Markdown file,
   such as `story-family-en-us.md`. Never add an empty translation.
7. For optional audio, report its size in MiB. The recommended target is 5 MiB
   or less and the repository maximum is 10 MiB. Preserve the supplied format
   and save it with a unique `story-*.aac`, `.flac`, `.m4a`, `.mp3`, `.ogg`,
   `.wav`, or `.webm` filename. Run `git lfs install`.
8. For each optional image, preserve the original, use a unique lowercase
   ASCII `story-*` filename, and record non-empty alternative text plus an
   optional caption. Supported formats are GIF, JPEG, JPG, PNG, and WebP.
   Report the imported image's pixel dimensions and file size.
9. Add a `stories` entry to `person.json`:

```json
{
  "id": "a-family-story",
  "date": "2026-09-08",
  "original": {
    "title": "Una historia familiar",
    "content": "story-family-es-mx.md",
    "language": "es-MX"
  },
  "translations": {
    "en-US": {
      "title": "A family story",
      "content": "story-family-en-us.md"
    }
  },
  "audio": {
    "file": "story-family.m4a"
  },
  "images": [
    {
      "file": "story-family-1.jpg",
      "alt": "Dos familiares compartiendo una historia",
      "caption": "Una reunión familiar.",
      "translations": {
        "en-US": {
          "alt": "Two relatives sharing a family story",
          "caption": "A family gathering."
        }
      }
    }
  ]
}
```

   Only `id` and `original` are required; `original` contains `title`,
   `content`, and `language`. Omit `date`, `translations`, `audio`, `images`, or
   image `caption` when unavailable. The story author's folder provides
   attribution.
10. When audio exists, stage it normally and confirm both
    `git check-attr filter -- <audio-file>` reports `filter: lfs` and
    `git lfs ls-files --name-only` lists it.
11. Run `npm run test:stories`, generate both locales, and generate both full
    printable reports. Run `npm run check:lfs` when the story has audio.
    Confirm that stories appear only in printable reports, with localized
    content, available images, and optional audio and story-text links.

## Missing files

Missing content, image, or audio files are recoverable archive gaps.
Generators warn and mark the file unavailable. Do not use that tolerance for a
new story: every newly registered file must exist, and each content file must
contain text.
