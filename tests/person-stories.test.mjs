import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  AUDIO_SIZE_MAXIMUM_MIB,
  AUDIO_SIZE_TARGET_MIB,
  assessAudioFileSize,
  resolvePersonStories,
  validatePersonStories
} from "../scripts/person-stories.mjs";
import {
  renderPrintStories,
  renderStoryMarkdown
} from "../templates/print-stories-html.mjs";

const validTextStory = {
  id: "a-family-story",
  date: "2026-09-08",
  original: {
    title: "Una historia familiar",
    content: "story-family-es-mx.md",
    language: "es-MX"
  },
  translations: {
    "en-us": {
      title: "A family story",
      content: "story-family-en-us.md"
    }
  }
};

const validMediaStory = {
  ...validTextStory,
  id: "a-story-with-media",
  audio: {
    file: "story-family.ogg"
  },
  images: [
    {
      file: "story-family-1.jpg",
      alt: "Dos familiares compartiendo una historia",
      caption: "Una reunión familiar.",
      translations: {
        "en-us": {
          alt: "Two relatives sharing a story",
          caption: "A family gathering."
        }
      }
    }
  ]
};

test("accepts localized text and media stories", () => {
  assert.doesNotThrow(() =>
    validatePersonStories(
      {
        stories: [
          validTextStory,
          {
            ...validMediaStory,
            date: "1998"
          }
        ]
      },
      "people/example/person.json"
    )
  );
});

test("rejects invalid IDs and unsupported story fields", () => {
  assert.throws(
    () =>
      validatePersonStories(
        {
          stories: [{ ...validTextStory, id: "Not Safe" }]
        },
        "people/example/person.json"
      ),
    /lowercase ASCII/
  );
  assert.throws(
    () =>
      validatePersonStories(
        {
          stories: [
            {
              ...validTextStory,
              attribution: "Must be implied by the containing person"
            }
          ]
        },
        "people/example/person.json"
      ),
    /unsupported story field "attribution"/
  );
  assert.throws(
    () =>
      validatePersonStories(
        { stories: [validTextStory, validTextStory] },
        "people/example/person.json"
      ),
    /duplicate story ID/
  );
});

test("rejects invalid story dates and media", () => {
  assert.throws(
    () =>
      validatePersonStories(
        {
          stories: [{ ...validTextStory, date: "2026-02-30" }]
        },
        "people/example/person.json"
      ),
    /"date"/
  );
  assert.throws(
    () =>
      validatePersonStories(
        {
          stories: [
            {
              ...validTextStory,
              audio: { file: "story-family.exe" }
            }
          ]
        },
        "people/example/person.json"
      ),
    /unsupported audio extension/
  );
  assert.throws(
    () =>
      validatePersonStories(
        {
          stories: [
            {
              ...validTextStory,
              images: [{ file: "photo.svg", alt: "Unsafe image type" }]
            }
          ]
        },
        "people/example/person.json"
      ),
    /unsupported image extension/
  );
});

test("rejects incomplete or duplicate-language translations", () => {
  assert.throws(
    () =>
      validatePersonStories(
        {
          stories: [
            {
              ...validTextStory,
              translations: {
                "en-US": {
                  title: "A family story",
                  content: validTextStory.original.content
                }
              }
            }
          ]
        },
        "people/example/person.json"
      ),
    /content file .* duplicates another story language/
  );
  assert.throws(
    () =>
      validatePersonStories(
        {
          stories: [
            {
              ...validTextStory,
              translations: {
                "ES-mx": {
                  title: "Idioma original duplicado",
                  content: "story-family-duplicate-es-mx.md"
                }
              }
            }
          ]
        },
        "people/example/person.json"
      ),
    /duplicates the original story language/
  );
  assert.throws(
    () =>
      validatePersonStories(
        {
          stories: [
            {
              ...validMediaStory,
              images: [
                {
                  ...validMediaStory.images[0],
                  translations: {
                    "en-US": {
                      alt: "Missing translated caption"
                    }
                  }
                }
              ]
            }
          ]
        },
        "people/example/person.json"
      ),
    /translated caption must match/
  );
});

test("classifies optional story audio at policy boundaries", () => {
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

test("selects localized content and image metadata", async (context) => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "family-stories-"));
  context.after(() => rm(projectRoot, { recursive: true, force: true }));
  const personDirectory = path.join(projectRoot, "people", "example");
  await mkdir(personDirectory, { recursive: true });
  await writeFile(
    path.join(personDirectory, "story-family-en-us.md"),
    "A preserved family story.\n"
  );
  const warnings = [];

  const [story] = await resolvePersonStories(
    { stories: [validMediaStory] },
    personDirectory,
    projectRoot,
    "en-US",
    (warning) => warnings.push(warning)
  );

  assert.equal(story.title, "A family story");
  assert.equal(story.contentLanguage, "en-US");
  assert.equal(story.content, "A preserved family story.\n");
  assert.equal(story.audio.available, false);
  assert.equal(story.images[0].alt, "Two relatives sharing a story");
  assert.equal(story.images[0].caption, "A family gathering.");
  assert.equal(story.images[0].available, false);
  assert.equal(warnings.length, 2);
});

test("falls back to the original content when no translation exists", async (context) => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "family-stories-"));
  context.after(() => rm(projectRoot, { recursive: true, force: true }));
  const personDirectory = path.join(projectRoot, "people", "example");
  await mkdir(personDirectory, { recursive: true });
  await writeFile(
    path.join(personDirectory, validTextStory.original.content),
    "Historia original.\n"
  );
  const storyWithoutTranslations = {
    ...validTextStory,
    translations: undefined
  };

  const [story] = await resolvePersonStories(
    { stories: [storyWithoutTranslations] },
    personDirectory,
    projectRoot,
    "fr-FR",
    () => {}
  );

  assert.equal(story.title, "Una historia familiar");
  assert.equal(story.contentLanguage, "es-MX");
  assert.equal(story.content, "Historia original.\n");
});

test("rejects an empty story content file", async (context) => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "family-stories-"));
  context.after(() => rm(projectRoot, { recursive: true, force: true }));
  const personDirectory = path.join(projectRoot, "people", "example");
  await mkdir(personDirectory, { recursive: true });
  await writeFile(
    path.join(personDirectory, validTextStory.original.content),
    " \n"
  );

  await assert.rejects(
    resolvePersonStories(
      {
        stories: [{ ...validTextStory, translations: undefined }]
      },
      personDirectory,
      projectRoot,
      "es-MX",
      () => {}
    ),
    /story content must not be empty/
  );
});

test("renders localized content and optional story media", () => {
  const localeData = {
    strings: {
      printStories: "Stories",
      printStoryDate: "Date",
      printStoryOriginalLanguage: "Original language",
      printStoryImage: "Story image",
      printStoryAudio: "Story audio",
      printStoryText: "Story text",
      printFileUnavailable: "File unavailable:"
    }
  };
  const html = renderPrintStories(
    {
      id: "example",
      stories: [
        {
          id: "media-story",
          date: "2026-09-08",
          title: "A family story",
          contentFile: "story-family-en-us.md",
          contentLanguage: "en-US",
          originalLanguage: "es-MX",
          contentAvailable: true,
          content: "First paragraph.\n\nSecond paragraph.",
          audio: {
            file: "story-family.ogg",
            available: true
          },
          images: [
            {
              file: "story-family-1.jpg",
              alt: "Two relatives sharing a story",
              caption: "A family gathering.",
              available: true
            }
          ]
        },
        {
          id: "text-only",
          title: "Text-only story",
          contentFile: "story-text-en-us.md",
          contentLanguage: "en-US",
          originalLanguage: "en-US",
          contentAvailable: false
        }
      ]
    },
    localeData,
    (value) => value
  );

  assert.match(html, /<h5>Stories<\/h5>/);
  assert.match(html, /lang="en-US"/);
  assert.match(html, /First paragraph\./);
  assert.match(html, /href="people\/example\/story-family\.ogg"/);
  assert.match(html, /src="people\/example\/story-family-1\.jpg"/);
  assert.match(html, /File unavailable:/);
  assert.doesNotMatch(html, /Story audio:<\/strong>/);
  assert.match(
    html,
    /<a href="people\/example\/story-family\.ogg">Story audio<\/a>/
  );
});

test("renders a safe printable subset of Markdown", () => {
  const html = renderStoryMarkdown(
    "# A heading\n\n- **Bold item**\n- [Safe link](https://example.com)\n\n<script>alert('no')</script>\n\n[Unsafe](javascript:alert(1))"
  );

  assert.match(html, /<h6>A heading<\/h6>/);
  assert.match(html, /<ul>/);
  assert.match(html, /<strong>Bold item<\/strong>/);
  assert.match(html, /href="https:\/\/example\.com"/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /href="javascript:/);
});
