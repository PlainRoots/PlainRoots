import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

export const AUDIO_EXTENSIONS = new Set([
  ".aac",
  ".flac",
  ".m4a",
  ".mp3",
  ".ogg",
  ".wav",
  ".webm"
]);
export const AUDIO_SIZE_TARGET_MIB = 5;
export const AUDIO_SIZE_MAXIMUM_MIB = 10;
const BYTES_PER_MIB = 1024 * 1024;
const SAFE_FILE_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*\.[a-z0-9]+$/;
const LANGUAGE_TAG = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;

export function validatePersonRecordings(person, source) {
  if (person.recordings === undefined) {
    return;
  }
  if (!Array.isArray(person.recordings) || person.recordings.length === 0) {
    throw new Error(
      `${source}: "recordings" must be a non-empty array when present`
    );
  }

  const stems = new Set();
  for (const [index, recording] of person.recordings.entries()) {
    const recordingSource = `${source}: recordings[${index}]`;
    if (!recording || typeof recording !== "object" || Array.isArray(recording)) {
      throw new Error(`${recordingSource} must be an object`);
    }
    for (const field of ["title", "audio", "transcript", "language"]) {
      if (
        typeof recording[field] !== "string" ||
        recording[field].trim() === ""
      ) {
        throw new Error(`${recordingSource}: "${field}" must be a non-empty string`);
      }
    }
    validateFileName(recording.audio, recordingSource, "audio");
    validateFileName(recording.transcript, recordingSource, "transcript");

    const audioExtension = path.extname(recording.audio).toLowerCase();
    if (!AUDIO_EXTENSIONS.has(audioExtension)) {
      throw new Error(
        `${recordingSource}: unsupported audio extension "${audioExtension}"`
      );
    }
    if (path.extname(recording.transcript).toLowerCase() !== ".md") {
      throw new Error(`${recordingSource}: transcript must be a Markdown file`);
    }

    const audioStem = path.basename(recording.audio, audioExtension);
    const transcriptStem = path.basename(recording.transcript, ".md");
    if (audioStem !== transcriptStem) {
      throw new Error(
        `${recordingSource}: audio and transcript filenames must have matching stems`
      );
    }
    if (stems.has(audioStem)) {
      throw new Error(`${recordingSource}: duplicate recording stem "${audioStem}"`);
    }
    stems.add(audioStem);

    if (!LANGUAGE_TAG.test(recording.language)) {
      throw new Error(
        `${recordingSource}: "language" must be a language tag such as "en-US" or "es-MX"`
      );
    }
    if (
      recording.recordedDate !== undefined &&
      (typeof recording.recordedDate !== "string" ||
        !isValidRecordingDate(recording.recordedDate))
    ) {
      throw new Error(
        `${recordingSource}: "recordedDate" must be YYYY or YYYY-MM-DD when present`
      );
    }
  }
}

export async function resolvePersonRecordings(
  person,
  personDirectory,
  projectRoot,
  reportWarning = console.warn
) {
  validatePersonRecordings(
    person,
    path.relative(projectRoot, path.join(personDirectory, "person.json"))
  );

  return Promise.all(
    (person.recordings ?? []).map(async (recording) => {
      const audioPath = path.join(personDirectory, recording.audio);
      const transcriptPath = path.join(personDirectory, recording.transcript);
      const audioAvailable = await fileExists(audioPath);
      const transcriptAvailable = await fileExists(transcriptPath);

      if (!audioAvailable) {
        reportMissing(audioPath, projectRoot, reportWarning);
      }
      if (!transcriptAvailable) {
        reportMissing(transcriptPath, projectRoot, reportWarning);
      } else if ((await readFile(transcriptPath, "utf8")).trim() === "") {
        throw new Error(
          `${path.relative(projectRoot, transcriptPath)}: transcript must not be empty`
        );
      }

      return {
        ...recording,
        audioAvailable,
        transcriptAvailable
      };
    })
  );
}

export function assessAudioFileSize(sizeBytes) {
  if (!Number.isInteger(sizeBytes) || sizeBytes < 0) {
    throw new Error("Audio file size must be a non-negative integer");
  }
  if (sizeBytes > AUDIO_SIZE_MAXIMUM_MIB * BYTES_PER_MIB) {
    return "exceeds-maximum";
  }
  if (sizeBytes > AUDIO_SIZE_TARGET_MIB * BYTES_PER_MIB) {
    return "above-target";
  }
  return "within-target";
}

function isValidRecordingDate(value) {
  if (/^\d{4}$/.test(value)) {
    return true;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31
  ];
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth[month - 1];
}

function validateFileName(fileName, source, field) {
  if (
    path.basename(fileName) !== fileName ||
    !SAFE_FILE_NAME.test(fileName)
  ) {
    throw new Error(
      `${source}: "${field}" must be a lowercase ASCII hyphenated filename without directories`
    );
  }
}

async function fileExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

function reportMissing(filePath, projectRoot, reportWarning) {
  reportWarning(
    `Warning: ${path.relative(projectRoot, filePath)} is missing; printable reports will mark it unavailable.`
  );
}
