export function parsePlainRootsDate(value) {
  if (typeof value !== "string") {
    return null;
  }

  const yearMatch = /^(\d{4})$/.exec(value);
  if (yearMatch) {
    return {
      precision: "year",
      year: Number(yearMatch[1]),
      month: null,
      day: null
    };
  }

  const monthMatch = /^(\d{4})-(\d{2})$/.exec(value);
  if (monthMatch) {
    const month = Number(monthMatch[2]);
    if (month < 1 || month > 12) {
      return null;
    }
    return {
      precision: "month",
      year: Number(monthMatch[1]),
      month,
      day: null
    };
  }

  const dayMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!dayMatch) {
    return null;
  }
  const year = Number(dayMatch[1]);
  const month = Number(dayMatch[2]);
  const day = Number(dayMatch[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return { precision: "day", year, month, day };
}

export function isValidPlainRootsDate(value) {
  return parsePlainRootsDate(value) !== null;
}

export function formatLocalizedPlainRootsDate(value, languageTag) {
  const parsed = parsePlainRootsDate(value);
  if (!parsed) {
    return value;
  }
  if (parsed.precision === "year") {
    return value;
  }
  if (parsed.precision === "month") {
    return new Intl.DateTimeFormat(languageTag, {
      month: "long",
      year: "numeric",
      timeZone: "UTC"
    }).format(new Date(Date.UTC(parsed.year, parsed.month - 1, 1)));
  }
  return new Intl.DateTimeFormat(languageTag, {
    dateStyle: "long",
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00Z`));
}
