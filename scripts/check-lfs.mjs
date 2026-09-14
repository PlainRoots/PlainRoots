import { access, readFile, readdir, stat } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  AUDIO_EXTENSIONS,
  AUDIO_SIZE_MAXIMUM_MIB,
  AUDIO_SIZE_TARGET_MIB,
  assessAudioFileSize,
  validatePersonStories
} from "./person-stories.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const failures = [];
const warnings = [];
const peopleRoot = path.join(projectRoot, "people");
const personDirectories = await readdir(peopleRoot, { withFileTypes: true });
let storyCount = 0;
let availableAudioCount = 0;
const audioPaths = [];

for (const directory of personDirectories.filter((entry) =>
  entry.isDirectory()
)) {
  const personPath = path.join(peopleRoot, directory.name, "person.json");
  if (!(await fileExists(personPath))) {
    continue;
  }

  const person = JSON.parse(await readFile(personPath, "utf8"));
  const source = normalizePath(path.relative(projectRoot, personPath));
  validatePersonStories(person, source);

  for (const story of person.stories ?? []) {
    storyCount += 1;
    if (!story.audio) {
      continue;
    }
    const relativeAudioPath = normalizePath(
      path.join("people", directory.name, story.audio.file)
    );
    audioPaths.push(relativeAudioPath);
  }
}

if (audioPaths.length > 0) {
  runGit(["lfs", "version"]);
  for (const extension of AUDIO_EXTENSIONS) {
    verifyLfsAttribute(`audio-format-check${extension}`);
  }
  const lfsFiles = new Set(
    runGit(["lfs", "ls-files", "--name-only"])
      .split(/\r?\n/)
      .filter(Boolean)
      .map(normalizePath)
  );

  for (const relativeAudioPath of audioPaths) {
    verifyLfsAttribute(relativeAudioPath);
    const absoluteAudioPath = path.join(projectRoot, relativeAudioPath);
    if (!(await fileExists(absoluteAudioPath))) {
      continue;
    }

    availableAudioCount += 1;
    const audioSizeBytes = (await stat(absoluteAudioPath)).size;
    const sizeStatus = assessAudioFileSize(audioSizeBytes);
    if (sizeStatus === "exceeds-maximum") {
      failures.push(
        `${relativeAudioPath}: ${formatMiB(audioSizeBytes)} MiB exceeds the ${AUDIO_SIZE_MAXIMUM_MIB} MiB maximum`
      );
    } else if (sizeStatus === "above-target") {
      warnings.push(
        `${relativeAudioPath}: ${formatMiB(audioSizeBytes)} MiB exceeds the recommended ${AUDIO_SIZE_TARGET_MIB} MiB target`
      );
    }
    if (!lfsFiles.has(relativeAudioPath)) {
      failures.push(
        `${relativeAudioPath}: existing story audio is not stored as a Git LFS pointer`
      );
    }
  }
}

for (const warning of warnings) {
  console.warn(`Warning: ${warning}`);
}

if (failures.length > 0) {
  throw new Error(`Git LFS validation failed:\n- ${failures.join("\n- ")}`);
}

console.log(
  audioPaths.length === 0
    ? `Skipped Git LFS checks: ${storyCount} story record(s) contain no audio.`
    : `Checked Git LFS rules for ${AUDIO_EXTENSIONS.size} audio formats and ${audioPaths.length} story audio attachment(s); ${availableAudioCount} audio file(s) are available and stored with Git LFS.`
);

function formatMiB(sizeBytes) {
  return (sizeBytes / (1024 * 1024)).toFixed(1);
}

function verifyLfsAttribute(filePath) {
  const output = runGit(["check-attr", "filter", "--", filePath]).trim();
  if (!output.endsWith(": filter: lfs")) {
    failures.push(`${filePath}: Git attribute "filter" must be "lfs"`);
  }
}

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: projectRoot,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim();
    throw new Error(`git ${args.join(" ")} failed${detail ? `: ${detail}` : ""}`);
  }
  return result.stdout;
}

function normalizePath(value) {
  return value.replaceAll("\\", "/");
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
