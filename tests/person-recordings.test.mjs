import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  AUDIO_SIZE_MAXIMUM_MIB,
  AUDIO_SIZE_TARGET_MIB,
  assessAudioFileSize,
  resolvePersonRecordings,
  validatePersonRecordings
} from "../scripts/person-recordings.mjs";
import { renderPrintRecordings } from "../templates/print-recordings-html.mjs";

const validRecording = {
  title: "A family story",
  audio: "recording-2026-09-08-family-story.m4a",
  transcript: "recording-2026-09-08-family-story.md",
  recordedDate: "2026-09-08",
  language: "es-MX"
};

test("accepts valid recording metadata", () => {
  assert.doesNotThrow(() =>
    validatePersonRecordings(
      {
        recordings: [
          validRecording,
          {
            ...validRecording,
            audio: "recording-undated-second-story.mp3",
            transcript: "recording-undated-second-story.md",
            recordedDate: "1998",
            language: "es-419"
          }
        ]
      },
      "people/example/person.json"
    )
  );
});

test("rejects mismatched and duplicate recording stems", () => {
  assert.throws(
    () =>
      validatePersonRecordings(
        {
          recordings: [
            {
              ...validRecording,
              transcript: "recording-2026-09-08-different-story.md"
            }
          ]
        },
        "people/example/person.json"
      ),
    /matching stems/
  );
  assert.throws(
    () =>
      validatePersonRecordings(
        { recordings: [validRecording, validRecording] },
        "people/example/person.json"
      ),
    /duplicate recording stem/
  );
});

test("rejects invalid recording dates", () => {
  assert.throws(
    () =>
      validatePersonRecordings(
        {
          recordings: [
            {
              ...validRecording,
              recordedDate: "2026-02-30"
            }
          ]
        },
        "people/example/person.json"
      ),
    /recordedDate/
  );
});

test("classifies recording file sizes at policy boundaries", () => {
  const mib = 1024 * 1024;
  assert.equal(
    assessAudioFileSize(AUDIO_SIZE_TARGET_MIB * mib),
    "within-target"
  );
  assert.equal(
    assessAudioFileSize(AUDIO_SIZE_TARGET_MIB * mib + 1),
    "above-target"
  );
  assert.equal(
    assessAudioFileSize(AUDIO_SIZE_MAXIMUM_MIB * mib),
    "above-target"
  );
  assert.equal(
    assessAudioFileSize(AUDIO_SIZE_MAXIMUM_MIB * mib + 1),
    "exceeds-maximum"
  );
});

test("treats missing recording files as warnings", async (context) => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "family-recordings-"));
  context.after(() => rm(projectRoot, { recursive: true, force: true }));
  const personDirectory = path.join(projectRoot, "people", "example");
  await mkdir(personDirectory, { recursive: true });
  const warnings = [];

  const [recording] = await resolvePersonRecordings(
    { recordings: [validRecording] },
    personDirectory,
    projectRoot,
    (warning) => warnings.push(warning)
  );

  assert.equal(recording.audioAvailable, false);
  assert.equal(recording.transcriptAvailable, false);
  assert.equal(warnings.length, 2);
});

test("rejects an empty transcript when the file exists", async (context) => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "family-recordings-"));
  context.after(() => rm(projectRoot, { recursive: true, force: true }));
  const personDirectory = path.join(projectRoot, "people", "example");
  await mkdir(personDirectory, { recursive: true });
  await writeFile(path.join(personDirectory, validRecording.transcript), " \n");

  await assert.rejects(
    resolvePersonRecordings(
      { recordings: [validRecording] },
      personDirectory,
      projectRoot,
      () => {}
    ),
    /transcript must not be empty/
  );
});

test("renders available links and unavailable file labels", () => {
  const localeData = {
    strings: {
      printFamilyRecordings: "Family recordings",
      printRecorded: "Recorded",
      printSpokenLanguage: "Spoken language",
      printAudioRecording: "Audio recording",
      printTranscript: "Transcript",
      printFileUnavailable: "File unavailable:"
    }
  };
  const html = renderPrintRecordings(
    {
      id: "example",
      recordings: [
        {
          ...validRecording,
          audioAvailable: true,
          transcriptAvailable: false
        }
      ]
    },
    localeData,
    (value) => value
  );

  assert.match(
    html,
    /href="people\/example\/recording-2026-09-08-family-story\.m4a"/
  );
  assert.match(html, /File unavailable:/);
  assert.doesNotMatch(
    html,
    /href="people\/example\/recording-2026-09-08-family-story\.md"/
  );
});
