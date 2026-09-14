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
const IMAGE_EXTENSIONS = new Set([".gif", ".jpeg", ".jpg", ".png", ".webp"]);
const BYTES_PER_MIB = 1024 * 1024;
const SAFE_FILE_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*\.[a-z0-9]+$/;
const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LANGUAGE_TAG = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const STORY_FIELDS = new Set([
  "id",
  "date",
  "original",
  "translations",
  "audio",
  "images"
]);
const ORIGINAL_FIELDS = new Set(["title", "content", "language"]);
const TRANSLATION_FIELDS = new Set(["title", "content"]);
const AUDIO_FIELDS = new Set(["file"]);
const IMAGE_FIELDS = new Set(["file", "alt", "caption", "translations"]);
const IMAGE_TRANSLATION_FIELDS = new Set(["alt", "caption"]);

export function validatePersonStories(person, source) {
  if (person.stories === undefined) {
    return;
  }
  if (!Array.isArray(person.stories) || person.stories.length === 0) {
    throw new Error(
      `${source}: "stories" must be a non-empty array when present`
    );
  }

  const ids = new Set();
  for (const [index, story] of person.stories.entries()) {
    const storySource = `${source}: stories[${index}]`;
    validateObject(story, storySource);
    rejectUnsupportedFields(story, STORY_FIELDS, storySource, "story");

    if (typeof story.id !== "string" || !SAFE_ID.test(story.id)) {
      throw new Error(
        `${storySource}: "id" must contain lowercase ASCII words separated by hyphens`
      );
    }
    if (ids.has(story.id)) {
      throw new Error(`${storySource}: duplicate story ID "${story.id}"`);
    }
    ids.add(story.id);

    validateOriginal(story.original, storySource);
    validateTranslations(
      story.translations,
      story.original.language,
      story.original.content,
      storySource
    );
    validateStoryAudio(story.audio, storySource);
    validateStoryImages(
      story.images,
      story.original.language,
      storySource
    );

    if (
      story.date !== undefined &&
      (typeof story.date !== "string" || !isValidStoryDate(story.date))
    ) {
      throw new Error(
        `${storySource}: "date" must be YYYY or YYYY-MM-DD when present`
      );
    }
  }
}

export async function resolvePersonStories(
  person,
  personDirectory,
  projectRoot,
  languageTag,
  reportWarning = console.warn
) {
  validatePersonStories(
    person,
    path.relative(projectRoot, path.join(personDirectory, "person.json"))
  );
  if (!LANGUAGE_TAG.test(languageTag)) {
    throw new Error(`Invalid story output language "${languageTag}"`);
  }

  return Promise.all(
    (person.stories ?? []).map(async (story) => {
      const version =
        sameLanguage(story.original.language, languageTag)
          ? story.original
          : findTranslation(story.translations, languageTag) ?? story.original;
      const contentPath = path.join(personDirectory, version.content);
      const contentAvailable = await fileExists(contentPath);
      let content = null;

      if (!contentAvailable) {
        reportMissing(contentPath, projectRoot, reportWarning);
      } else {
        content = await readFile(contentPath, "utf8");
        if (content.trim() === "") {
          throw new Error(
            `${path.relative(projectRoot, contentPath)}: story content must not be empty`
          );
        }
      }

      let audio;
      if (story.audio) {
        const audioPath = path.join(personDirectory, story.audio.file);
        const available = await fileExists(audioPath);
        if (!available) {
          reportMissing(audioPath, projectRoot, reportWarning);
        }
        audio = { ...story.audio, available };
      }

      const images = await Promise.all(
        (story.images ?? []).map(async (image) => {
          const imagePath = path.join(personDirectory, image.file);
          const available = await fileExists(imagePath);
          if (!available) {
            reportMissing(imagePath, projectRoot, reportWarning);
          }
          const translation =
            sameLanguage(story.original.language, languageTag)
              ? null
              : findTranslation(image.translations, languageTag);
          return {
            file: image.file,
            alt: translation?.alt ?? image.alt,
            ...(translation?.caption || image.caption
              ? { caption: translation?.caption ?? image.caption }
              : {}),
            available
          };
        })
      );

      return {
        id: story.id,
        ...(story.date ? { date: story.date } : {}),
        title: version.title,
        contentFile: version.content,
        contentLanguage:
          canonicalLanguageTag(
            version === story.original ? story.original.language : languageTag
          ),
        originalLanguage: canonicalLanguageTag(story.original.language),
        contentAvailable,
        content,
        ...(audio ? { audio } : {}),
        ...(story.images ? { images } : {})
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

function validateOriginal(original, source) {
  const originalSource = `${source}: original`;
  validateObject(original, originalSource);
  rejectUnsupportedFields(
    original,
    ORIGINAL_FIELDS,
    originalSource,
    "original story"
  );
  for (const field of ORIGINAL_FIELDS) {
    requireNonEmptyString(original[field], originalSource, field);
  }
  validateContentFile(original.content, originalSource);
  validateLanguageTag(original.language, originalSource, "language");
}

function validateTranslations(
  translations,
  originalLanguage,
  originalContent,
  source
) {
  if (translations === undefined) {
    return;
  }
  validateObject(translations, `${source}: translations`);
  if (Object.keys(translations).length === 0) {
    throw new Error(
      `${source}: "translations" must not be empty when present`
    );
  }

  const canonicalOriginalLanguage = canonicalLanguageTag(originalLanguage);
  const translatedLanguages = new Set();
  const contentFiles = new Set([originalContent]);
  for (const [language, translation] of Object.entries(translations)) {
    const translationSource = `${source}: translations.${language}`;
    const canonicalLanguage = canonicalLanguageTag(
      language,
      `${source}: translations`,
      language
    );
    if (canonicalLanguage === canonicalOriginalLanguage) {
      throw new Error(
        `${translationSource} duplicates the original story language`
      );
    }
    if (translatedLanguages.has(canonicalLanguage)) {
      throw new Error(
        `${translationSource} duplicates another story translation language`
      );
    }
    translatedLanguages.add(canonicalLanguage);
    validateObject(translation, translationSource);
    rejectUnsupportedFields(
      translation,
      TRANSLATION_FIELDS,
      translationSource,
      "story translation"
    );
    for (const field of TRANSLATION_FIELDS) {
      requireNonEmptyString(translation[field], translationSource, field);
    }
    validateContentFile(translation.content, translationSource);
    if (contentFiles.has(translation.content)) {
      throw new Error(
        `${translationSource}: content file "${translation.content}" duplicates another story language`
      );
    }
    contentFiles.add(translation.content);
  }
}

function validateStoryAudio(audio, source) {
  if (audio === undefined) {
    return;
  }
  const audioSource = `${source}: audio`;
  validateObject(audio, audioSource);
  rejectUnsupportedFields(audio, AUDIO_FIELDS, audioSource, "audio");
  requireNonEmptyString(audio.file, audioSource, "file");
  validateFileName(audio.file, audioSource, "file");
  const extension = path.extname(audio.file).toLowerCase();
  if (!AUDIO_EXTENSIONS.has(extension)) {
    throw new Error(`${audioSource}: unsupported audio extension "${extension}"`);
  }
}

function validateStoryImages(images, originalLanguage, source) {
  if (images === undefined) {
    return;
  }
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error(`${source}: "images" must be a non-empty array when present`);
  }

  const files = new Set();
  for (const [index, image] of images.entries()) {
    const imageSource = `${source}: images[${index}]`;
    validateObject(image, imageSource);
    rejectUnsupportedFields(image, IMAGE_FIELDS, imageSource, "image");
    for (const field of ["file", "alt"]) {
      requireNonEmptyString(image[field], imageSource, field);
    }
    validateFileName(image.file, imageSource, "file");
    const extension = path.extname(image.file).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(extension)) {
      throw new Error(
        `${imageSource}: unsupported image extension "${extension}"`
      );
    }
    if (files.has(image.file)) {
      throw new Error(`${imageSource}: duplicate image file "${image.file}"`);
    }
    files.add(image.file);
    validateOptionalCaption(image.caption, imageSource);
    validateImageTranslations(
      image.translations,
      originalLanguage,
      image.caption !== undefined,
      imageSource
    );
  }
}

function validateImageTranslations(
  translations,
  originalLanguage,
  hasCaption,
  source
) {
  if (translations === undefined) {
    return;
  }
  validateObject(translations, `${source}: translations`);
  if (Object.keys(translations).length === 0) {
    throw new Error(
      `${source}: "translations" must not be empty when present`
    );
  }
  const canonicalOriginalLanguage = canonicalLanguageTag(originalLanguage);
  const translatedLanguages = new Set();
  for (const [language, translation] of Object.entries(translations)) {
    const translationSource = `${source}: translations.${language}`;
    const canonicalLanguage = canonicalLanguageTag(
      language,
      `${source}: translations`,
      language
    );
    if (canonicalLanguage === canonicalOriginalLanguage) {
      throw new Error(
        `${translationSource} duplicates the original image language`
      );
    }
    if (translatedLanguages.has(canonicalLanguage)) {
      throw new Error(
        `${translationSource} duplicates another image translation language`
      );
    }
    translatedLanguages.add(canonicalLanguage);
    validateObject(translation, translationSource);
    rejectUnsupportedFields(
      translation,
      IMAGE_TRANSLATION_FIELDS,
      translationSource,
      "image translation"
    );
    requireNonEmptyString(translation.alt, translationSource, "alt");
    validateOptionalCaption(translation.caption, translationSource);
    if (hasCaption !== (translation.caption !== undefined)) {
      throw new Error(
        `${translationSource}: translated caption must match whether the original image has a caption`
      );
    }
  }
}

function validateContentFile(fileName, source) {
  validateFileName(fileName, source, "content");
  if (path.extname(fileName).toLowerCase() !== ".md") {
    throw new Error(`${source}: content must be a Markdown file`);
  }
}

function validateLanguageTag(value, source, field) {
  canonicalLanguageTag(value, source, field);
}

function canonicalLanguageTag(value, source = "Story", field = "language") {
  if (typeof value !== "string" || !LANGUAGE_TAG.test(value)) {
    throw new Error(
      `${source}: "${field}" must be a language tag such as "en-US" or "es-MX"`
    );
  }
  try {
    return Intl.getCanonicalLocales(value)[0];
  } catch {
    throw new Error(
      `${source}: "${field}" must be a language tag such as "en-US" or "es-MX"`
    );
  }
}

function sameLanguage(left, right) {
  return canonicalLanguageTag(left) === canonicalLanguageTag(right);
}

function findTranslation(translations, languageTag) {
  if (!translations) {
    return undefined;
  }
  const targetLanguage = canonicalLanguageTag(languageTag);
  const entry = Object.entries(translations).find(
    ([language]) => canonicalLanguageTag(language) === targetLanguage
  );
  return entry?.[1];
}

function requireNonEmptyString(value, source, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${source}: "${field}" must be a non-empty string`);
  }
}

function validateOptionalCaption(value, source) {
  if (
    value !== undefined &&
    (typeof value !== "string" || value.trim() === "")
  ) {
    throw new Error(
      `${source}: "caption" must be a non-empty string when present`
    );
  }
}

function validateObject(value, source) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${source} must be an object`);
  }
}

function rejectUnsupportedFields(value, allowedFields, source, kind) {
  const unsupportedField = Object.keys(value).find(
    (field) => !allowedFields.has(field)
  );
  if (unsupportedField) {
    throw new Error(
      `${source}: unsupported ${kind} field "${unsupportedField}"`
    );
  }
}

function isValidStoryDate(value) {
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
    typeof fileName !== "string" ||
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
