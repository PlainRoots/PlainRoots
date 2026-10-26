import assert from "node:assert/strict";
import test from "node:test";
import {
  formatRelationshipEvents,
  formatRelationshipSummary
} from "../scripts/relationship-events.mjs";
import { validateTree } from "../scripts/tree-data.mjs";
import { loadLocale } from "../scripts/locales.mjs";

const localeData = {
  languageTag: "en-US",
  strings: {
    married: "Married",
    divorced: "Divorced",
    partnered: "Partners",
    relationshipUnknown: "Relationship unknown",
    relationshipEventFormat: "{relationship}: {date}",
    relationshipEventSeparator: "; ",
    lifeEventFormat: "{date} in {place}",
    unknownDate: "Unknown date",
    estimated: "est."
  },
  familyRelationships: {
    married: "Married",
    divorced: "Divorced",
    partnered: "Partnered"
  },
  places: {
    "Mexico City, Mexico": "Mexico City, Mexico"
  }
};

test("validates dated relationship event histories", () => {
  const tree = {
    title: "Example",
    people: ["one", "two"],
    families: [
      {
        id: "example",
        partners: ["one", "two"],
        relationship: "divorced",
        relationshipEvents: [
          {
            type: "married",
            date: "1980-05-10",
            place: "Mexico City, Mexico"
          },
          { type: "divorced", date: "1992", dateEstimated: true }
        ],
        children: []
      }
    ]
  };

  assert.doesNotThrow(() => validateTree(tree));
  tree.families[0].relationshipEvents[1].date = "1992-13";
  assert.throws(() => validateTree(tree), /relationshipEvents\[1\]/);
  tree.families[0].relationshipEvents[1].date = "1992";
  for (const place of ["", " ", null, 42, {}, []]) {
    tree.families[0].relationshipEvents[1].place = place;
    assert.throws(() => validateTree(tree), /non-empty "place"/);
  }
});

test("requires relationship events to belong to two-partner families", () => {
  assert.throws(
    () =>
      validateTree({
        title: "Example",
        people: ["one"],
        families: [
          {
            id: "example",
            partners: ["one"],
            relationshipEvents: [{ type: "partnered", date: "1980" }],
            children: []
          }
        ]
      }),
    /two-partner family/
  );
});

test("supports confirmed relationship events with unknown dates", () => {
  const tree = {
    title: "Example",
    people: ["one", "two"],
    families: [
      {
        id: "example",
        partners: ["one", "two"],
        relationship: "divorced",
        relationshipEvents: [
          { type: "married", date: "1980" },
          { type: "divorced", date: "Unknown" }
        ],
        children: []
      }
    ]
  };

  assert.doesNotThrow(() => validateTree(tree));
  assert.equal(
    formatRelationshipEvents(tree.families[0].relationshipEvents, localeData),
    "Married: 1980; Divorced: Unknown date"
  );
  tree.families[0].relationshipEvents[1].dateEstimated = true;
  assert.throws(() => validateTree(tree), /known dates/);
});

test("formats localized relationship dates and current status", () => {
  const events = [
    {
      type: "married",
      date: "1980-05-10",
      place: "Mexico City, Mexico"
    },
    { type: "divorced", date: "1992", dateEstimated: true }
  ];

  assert.equal(
    formatRelationshipEvents(events, localeData),
    "Married: May 10, 1980; Divorced: 1992 (est.)"
  );
  assert.equal(
    formatRelationshipEvents(events, localeData, {
      includePlaces: true
    }),
    "Married: May 10, 1980 in Mexico City, Mexico; Divorced: 1992 (est.)"
  );
  assert.equal(
    formatRelationshipSummary(
      {
        relationship: "divorced",
        relationshipEvents: events
      },
      localeData
    ),
    "Married: May 10, 1980; Divorced: 1992 (est.)"
  );
  assert.equal(
    formatRelationshipSummary(
      {
        relationship: "divorced",
        relationshipEvents: events
      },
      localeData,
      { includePlaces: true }
    ),
    "Married: May 10, 1980 in Mexico City, Mexico; Divorced: 1992 (est.)"
  );
});

test("localizes event places in English and Mexican Spanish reports", async () => {
  for (const localeId of ["en-US", "es-MX"]) {
    const locale = await loadLocale(process.cwd(), localeId);
    const place = "Example city";
    const translatedPlace =
      localeId === "es-MX" ? "Ciudad de ejemplo" : place;
    const localized = {
      ...locale,
      places: { [place]: translatedPlace }
    };
    const events = [
      { type: "married", date: "1980", place },
      { type: "divorced", date: "Unknown", place }
    ];
    assert.equal(
      formatRelationshipEvents(events, localized, { includePlaces: true }),
      localeId === "es-MX"
        ? "Casado/a: 1980 en Ciudad de ejemplo; Divorciado/a: Fecha desconocida en Ciudad de ejemplo"
        : "Married: 1980 in Example city; Divorced: Unknown date in Example city"
    );
    assert.doesNotMatch(
      formatRelationshipEvents(events, localized),
      /Example city|Ciudad de ejemplo/
    );
    assert.match(
      formatRelationshipEvents(
        [{ type: "married", date: "1980", place: "Untranslated city" }],
        localized,
        { includePlaces: true }
      ),
      /Untranslated city/
    );
  }
});
