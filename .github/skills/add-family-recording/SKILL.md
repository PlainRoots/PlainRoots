---
name: add-family-recording
description: Add an approved family audio recording and its transcript to a person's archive. Use when the user supplies a recording from or about a family member.
---

# Add a family recording

Store recordings and transcripts in `people/<person-id>/`. Register them in
that person's `person.json`; never hand-edit generated reports.

## Procedure

1. Identify the person whose archive should contain the recording. Ask for
   clarification when multiple people are plausible.
2. Confirm that the recording is approved for publication to repository
   collaborators. Do not add private conversations, credentials, addresses,
   phone numbers, or other sensitive material.
3. Determine the spoken language, recording date when known, and a concise
   title. Do not infer an unknown recording date.
4. Measure the supplied audio file and report its size in MiB. The recommended
   target is 5 MiB or less, and the repository maximum is 10 MiB. Based on
   testing with WhatsApp recordings (OGG format), those sizes represent roughly
   30 minutes and one hour of speech, respectively. Treat the durations as
   estimates because encoding settings and audio content vary. Warn when the
   file exceeds 5 MiB. If it exceeds 10 MiB, stop and ask the user how to
   handle that recording; do not automatically compress, split, discard, or
   externally archive the original.
5. Preserve the supplied audio format. Use a lowercase ASCII, hyphenated base
   name such as `recording-2026-09-08-family-story`. If the date is unknown,
   use `recording-undated-family-story`. Add `-2`, `-3`, and so on rather than
   overwriting an existing audio file or transcript.
6. Run `git lfs install`, then save the original audio in the person's folder.
   Supported extensions are `.aac`, `.flac`, `.m4a`, `.mp3`, `.ogg`, `.wav`,
   and `.webm`. Repository-wide `.gitattributes` rules route every file with
   one of these extensions through Git LFS, regardless of its directory.
7. Transcribe the recording verbatim in its original language. If available
   tooling cannot decode or transcribe the audio reliably, stop and explain
   the problem; never fabricate a transcript.
8. After detecting the spoken language, present only translation choices that
   add a different language:
   - For an English recording, offer no translation or Mexican Spanish.
   - For a Spanish recording, offer no translation or English.
   - For another language, offer no translation, English, Mexican Spanish, or
     both English and Mexican Spanish.
   Never create or label a translation that duplicates the original language.
9. Save the transcript beside the recording as Markdown, using the exact same
   base name and the `.md` extension. Include:
   - A title.
   - The archived person's name.
   - The recording date when known.
   - The spoken language.
   - The transcription date.
   - A `Transcript` section containing the verbatim original.
   - Only the distinct English and/or Mexican Spanish translation sections
     selected after language detection.
   Add a translation heading only when the complete, non-empty translation is
   present beneath it. Never add an empty translation section, a placeholder,
   or an explanation that a translation is unnecessary.
10. Add a `recordings` entry to `person.json`:

```json
{
  "title": "A family story",
  "audio": "recording-2026-09-08-family-story.m4a",
  "transcript": "recording-2026-09-08-family-story.md",
  "recordedDate": "2026-09-08",
  "language": "es-MX"
}
```

   Omit `recordedDate` when unknown. Use a standards-based language tag such
   as `en-US` or `es-MX`.
11. Stage the audio file normally with `git add`, then run
   `git check-attr filter -- <audio-file>` and confirm it reports
   `filter: lfs`. Run `git lfs ls-files --name-only` and confirm the audio path
   is listed. Do not complete the workflow if either check fails.
12. Run `npm run check:lfs`, `npm run test:recordings`, generate both locales,
    and generate both full printable reports. Confirm that each report
    contains clickable audio and transcript links plus their visible
    repository-relative paths.

## Missing files

Missing audio or transcript files are recoverable archive gaps. Generators and
checks warn and mark the file unavailable without failing. Do not use that
tolerance to complete a new recording workflow: both files must exist and the
transcript must contain text before reporting success.
