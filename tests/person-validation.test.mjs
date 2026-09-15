import assert from "node:assert/strict";
import test from "node:test";
import { validatePerson } from "../templates/person-card-html.mjs";

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
            type: "original-script",
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
            type: "likely-equivalent-in-native-language",
            evidence: "An unconfirmed reconstruction supported by name research."
          }
        ]
      }),
      "person.json"
    )
  );
});

test("rejects removed ambiguous alternate name types", () => {
  for (const type of [
    "translated-equivalent",
    "linguistic-hypothesis",
    "likely-arabic-equivalent"
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

function createPerson(overrides = {}) {
  return {
    id: "example-person",
    name: "Example Person",
    givenNames: "Example",
    surnames: "Person",
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
