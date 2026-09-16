export const ALTERNATE_NAME_TYPES = Object.freeze([
  "documented-variant",
  "married-name",
  "nickname",
  "confirmed-original-spelling",
  "likely-original-spelling",
  "translated-name-equivalent"
]);

const ALTERNATE_NAME_TYPE_SET = new Set(ALTERNATE_NAME_TYPES);

export function isAlternateNameType(type) {
  return ALTERNATE_NAME_TYPE_SET.has(type);
}

export function alternateNameTypeLabel(locale, type) {
  const label = locale.alternateNameTypes?.[type];
  if (typeof label !== "string" || label.trim() === "") {
    throw new Error(
      `locales/${locale.id}.json: missing non-empty alternate-name label for "${type}"`
    );
  }
  return label;
}
