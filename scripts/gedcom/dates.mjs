const MONTHS = new Map([
  ["JAN", "01"],
  ["FEB", "02"],
  ["MAR", "03"],
  ["APR", "04"],
  ["MAY", "05"],
  ["JUN", "06"],
  ["JUL", "07"],
  ["AUG", "08"],
  ["SEP", "09"],
  ["OCT", "10"],
  ["NOV", "11"],
  ["DEC", "12"]
]);

export function convertGedcomDate(value) {
  if (!value) {
    return { value: null, estimated: false, loss: null };
  }

  const normalized = value.trim().replace(/\s+/g, " ").toUpperCase();
  const approximate = /^(ABT|EST|CAL) (.+)$/.exec(normalized);
  const dateText = approximate ? approximate[2] : normalized;

  let converted = null;
  if (/^\d{3,4}$/.test(dateText)) {
    converted = dateText;
  } else {
    const fullDate = /^(\d{1,2}) ([A-Z]{3}) (\d{3,4})$/.exec(dateText);
    if (fullDate && MONTHS.has(fullDate[2])) {
      const day = fullDate[1].padStart(2, "0");
      const month = MONTHS.get(fullDate[2]);
      const year = fullDate[3];
      const candidate = `${year}-${month}-${day}`;
      if (isValidIsoDate(candidate)) {
        converted = candidate;
      }
    }
  }

  if (!converted) {
    return {
      value: null,
      estimated: false,
      loss: `GEDCOM date "${value}" cannot be represented by PlainRoots' current YYYY or YYYY-MM-DD fields`
    };
  }

  return {
    value: converted,
    estimated: Boolean(approximate),
    loss:
      approximate && approximate[1] !== "ABT"
        ? `GEDCOM date modifier ${approximate[1]} was reduced to PlainRoots birthDateEstimated`
        : null
  };
}

function isValidIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  );
  return (
    date.getUTCFullYear() === Number(match[1]) &&
    date.getUTCMonth() === Number(match[2]) - 1 &&
    date.getUTCDate() === Number(match[3])
  );
}
