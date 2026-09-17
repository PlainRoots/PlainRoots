import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  renderPersonCard,
  validatePerson
} from "../templates/person-card-html.mjs";
import { ALTERNATE_NAME_TYPES } from "../scripts/alternate-names.mjs";

test("accepts language-neutral alternate name types", () => {
  assert.doesNotThrow(() =>
    validatePerson(
      createPerson({
        alternateNames: [
          {
            name: "Lola",
            language: "es",
            type: "nickname",
            evidence: "Confirmed by a family source."
          },
          {
            name: "別名",
            language: "ja",
            transliteration: "Betsumei",
            type: "confirmed-original-spelling",
            evidence: "Recorded in a contemporary document."
          },
          {
            name: "John",
            language: "en",
            type: "translated-name-equivalent",
            evidence: "A recognized English equivalent; actual use is unknown."
          },
          {
            name: "Native-language candidate",
            language: "und",
            type: "likely-original-spelling",
            evidence: "An unconfirmed reconstruction supported by name research."
          }
        ]
      }),
      "person.json"
    )
  );
});

test("rejects removed alternate name types", () => {
  for (const type of [
    "translated-equivalent",
    "linguistic-hypothesis",
    "likely-arabic-equivalent",
    "documented-spelling-variant",
    "original-script",
    "phonetic-administrative-spelling",
    "likely-equivalent-in-native-language"
  ]) {
    assert.throws(
      () =>
        validatePerson(
          createPerson({
            alternateNames: [
              {
                name: "Example",
                language: "en",
                type,
                evidence: "Removed classification."
              }
            ]
          }),
          "person.json"
        ),
      /supported type/
    );
  }
});

test("rejects unsupported alternate name types", () => {
  assert.throws(
    () =>
      validatePerson(
        createPerson({
          alternateNames: [
            {
              name: "Example",
              language: "en",
              type: "guess",
              evidence: "Unsupported classification."
            }
          ]
        }),
        "person.json"
      ),
    /supported type/
  );
});

test("rejects unsupported sex values", () => {
  assert.throws(
    () => validatePerson(createPerson({ sex: "unspecified" }), "person.json"),
    /"sex" must be/
  );
});

test("renders the localized label for every alternate name type", async () => {
  const locale = JSON.parse(
    await readFile(new URL("../locales/en-US.json", import.meta.url), "utf8")
  );
  const person = createPerson({
    alternateNames: ALTERNATE_NAME_TYPES.map((type) => ({
      name: `Example ${type}`,
      language: "en",
      type,
      evidence: "Test evidence."
    }))
  });

  const html = renderPersonCard(person, { locale });

  for (const type of ALTERNATE_NAME_TYPES) {
    assert.match(
      html,
      new RegExp(`<dt>${locale.alternateNameTypes[type]}</dt>`)
    );
  }
  assert.doesNotMatch(html, /<dt>Alternate name<\/dt>/);
});

function createPerson(overrides = {}) {
  return {
    id: "example-person",
    name: "Example Person",
    givenNames: "Example",
    surnames: "Person",
    sex: "unknown",
    maidenName: null,
    initials: "EP",
    occupation: "Unknown",
    birthDate: "Unknown",
    birthPlace: "Unknown",
    deathDate: null,
    photo: null,
    ...overrides
  };
}
