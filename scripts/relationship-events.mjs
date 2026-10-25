import { formatLocalizedPlainRootsDate } from "./date-values.mjs";

export const RELATIONSHIP_EVENT_TYPES = Object.freeze([
  "married",
  "divorced",
  "partnered"
]);

export function formatRelationshipEvents(
  events,
  localeData,
  { includePlaces = false } = {}
) {
  return (events ?? [])
    .map((event) => {
      const relationship = localeData.familyRelationships[event.type];
      const date =
        event.date === "Unknown"
          ? localeData.strings.unknownDate
          : formatLocalizedPlainRootsDate(
              event.date,
              localeData.languageTag
            );
      const formattedDate = event.dateEstimated
        ? `${date} (${localeData.strings.estimated})`
        : date;
      const details =
        includePlaces && event.place
          ? localeData.strings.lifeEventFormat
              .replace("{date}", formattedDate)
              .replace(
                "{place}",
                localeData.places[event.place] ?? event.place
              )
          : formattedDate;
      return localeData.strings.relationshipEventFormat
        .replace("{relationship}", relationship)
        .replace("{date}", details);
    })
    .join(localeData.strings.relationshipEventSeparator);
}

export function formatRelationshipSummary(family, localeData, options) {
  const relationship =
    family.relationship === "unknown" || family.relationship === undefined
      ? localeData.strings.relationshipUnknown
      : localeData.strings[family.relationship];
  const events = formatRelationshipEvents(
    family.relationshipEvents,
    localeData,
    options
  );
  return events || relationship;
}
