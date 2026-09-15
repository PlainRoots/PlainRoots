---
name: add-family-story
description: Add an approved text or audio family story and its optional images to the author's archive.
---

# Add a family story

Store every story in `people/<author-id>/`, regardless of who the story is
about. Register it in that author's `person.json`; the folder implies
attribution. Never hand-edit generated reports and never convert `remarks` into
a story automatically.

For real family data, require `protect-family-archive` to pass before reading a
recording, transcript, private message, or family narrative. Use
`verify-genealogy-data` to distinguish a Story from `remarks` and
`researchNotes`, evaluate attribution, and preserve uncertainty.

## Decide whether this is a Story

Use a Story for a substantial attributed first-person or family narrative that
the user wants preserved and rendered in printable reports.

- Use `remarks` for concise biographical context suitable for family reports.
- Use `researchNotes` for provenance, evidence conflicts, hypotheses,
  transcription uncertainty, and curation guidance that must not render.
- Do not store unsupported sensitive details or unrelated private
  conversations.

Recommend the appropriate location and ask for approval. Do not convert
existing `remarks`, `researchNotes`, messages, or source excerpts into a Story
automatically.

## Establish authorship and voices

The Story author is the person whose account or narrative is being preserved,
not necessarily every person discussed in it.

Before creating files:

1. Identify the Story author and confirm their existing person ID.
2. Identify the speaker or speakers in a recording.
3. Identify an interviewer, reader, translator, or recorder when known.
4. Separate the author's direct memories from events retold from another
   person.
5. Ask for clarification when the speaker and author may differ.

An interviewer is not the author merely because their voice appears in the
recording. Someone reading another person's written account is the reader, not
the original author. When a recording contains several independent narrators,
explain that the current Story model has one author and ask whether to split it
into separately attributed Stories or preserve it under one confirmed primary
author.

Record concise authorship, speaker, retelling, and source context in
`researchNotes` when needed to understand provenance. Do not alter the
verbatim Story text merely to insert hidden provenance.

## Approval sequence

Use separate approval gates:

1. Confirm permission to inspect and preserve the narrative and media.
2. Identify the author, voices, original language, and known date.
3. For audio, produce a draft verbatim transcript outside the repository and
   show uncertain or inaudible passages.
4. Ask the user to approve or correct the original transcript or supplied
   text.
5. Show the proposed title, Story ID, files, translations, media metadata,
   authorship provenance, and `person.json` entry.
6. Ask for approval before creating repository files or changing
   `person.json`.
7. Apply only the approved Story and media.

Permission to transcribe is not permission to translate, copy media into Git,
register the Story, commit, or push.

## Procedure

1. Complete the approval sequence above.
2. Confirm that the Story and all media may be shared with every repository
   collaborator. Do not add private conversations, credentials, addresses,
   phone numbers, or other sensitive material.
3. Determine the original language, date when known, and a concise title. Do
   not infer an unknown date.
4. Create a stable lowercase ASCII Story ID with hyphens. Never reuse or
   rename an existing ID.
5. Save the approved original Story as a non-empty Markdown content file named
   with a lowercase ASCII, hyphenated base and language suffix, such as
   `story-family-es-mx.md`. Preserve supplied text verbatim. For audio, use the
   approved verbatim transcript; never fabricate text.
6. After detecting the original language, load the active locales from
   `supported-locales.json`; canonical `en-US` is implicit. Translate the title
   and complete content into every active locale other than the original
   language. Save each translation in a separate lowercase ASCII Markdown
   file, such as `story-family-en-us.md`. Never duplicate the original language
   or add an empty translation. Mark uncertain wording and require review by a
   fluent speaker before treating a translation as final.
7. For optional audio, report the supplied source's name, format, and size in
   bytes and MiB. The recommended target is 5 MiB or less and the repository
   maximum is 10 MiB. Preserve the supplied format and audio unchanged and save
   it with a unique `story-*.aac`, `.flac`, `.m4a`, `.mp3`, `.ogg`, `.wav`, or
   `.webm` filename. After copying, report the final repository name, format,
   and size and confirm that it matches the source. Run `git lfs install`.
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
11. Run `npm run test:stories`, generate every active locale, and generate
    every localized full printable report. Run `npm run check:lfs` when the
    story has audio. Confirm that stories appear only in printable reports,
    with localized content, available images, and optional audio and story-text
    links.

## Transcription and translation review

- Mark inaudible audio as `[inaudible]` with a timestamp when practical.
- Mark uncertain hearing or spelling explicitly; do not silently choose a
  likely word.
- Preserve false starts, repetitions, code-switching, and distinctive wording
  unless the user approves an edited transcript.
- Keep an edited reading version separate from the verbatim original if both
  are requested. Do not replace the original transcript.
- Translate meaning and tone without repairing factual contradictions.
- Preserve names, places, kinship terms, and culturally specific wording for
  review rather than guessing.
- Identify machine-generated transcription and translation as drafts until
  reviewed.
- Ask a fluent speaker to review each translation, especially when it contains
  dialect, historical terminology, humor, idioms, or mixed languages.

## One authoritative narrative

Do not copy the same Story into every person record it mentions. Register it
once under its confirmed author. Other people remain subjects of the narrative,
not co-authors.

If another person independently tells a materially different version, preserve
that as a separately attributed Story after approval. If the difference is
only a correction, translation, or editorial revision, retain one Story and
preserve the correction or version history in provenance rather than creating
competing copies.

## Missing files

Missing content, image, or audio files are recoverable archive gaps.
Generators warn and mark the file unavailable. Do not use that tolerance for a
new story: every newly registered file must exist, and each content file must
contain text.
