const MONTHS = new Map([
  ["JAN", "01"],
  ["JANUARY", "01"],
  ["FEB", "02"],
  ["FEBRUARY", "02"],
  ["MAR", "03"],
  ["MARCH", "03"],
  ["APR", "04"],
  ["APRIL", "04"],
  ["MAY", "05"],
  ["JUN", "06"],
  ["JUNE", "06"],
  ["JUL", "07"],
  ["JULY", "07"],
  ["AUG", "08"],
  ["AUGUST", "08"],
  ["SEP", "09"],
  ["SEPT", "09"],
  ["SEPTEMBER", "09"],
  ["OCT", "10"],
  ["OCTOBER", "10"],
  ["NOV", "11"],
  ["NOVEMBER", "11"],
  ["DEC", "12"],
  ["DECEMBER", "12"]
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
    converted = dateText.padStart(4, "0");
  } else {
    const fullDate = /^(\d{1,2}) ([A-Z]+) (\d{3,4})$/.exec(dateText);
    if (fullDate && MONTHS.has(fullDate[2])) {
      const day = fullDate[1].padStart(2, "0");
      const month = MONTHS.get(fullDate[2]);
      const year = fullDate[3].padStart(4, "0");
      const candidate = `${year}-${month}-${day}`;
      if (isValidIsoDate(candidate)) {
        converted = candidate;
      }
    } else {
      const monthYear = /^([A-Z]+) (\d{3,4})$/.exec(dateText);
      if (monthYear && MONTHS.has(monthYear[1])) {
        converted = `${monthYear[2].padStart(4, "0")}-${MONTHS.get(monthYear[1])}`;
      }
    }
  }

  if (!converted) {
    return {
      value: null,
      estimated: false,
      loss: `GEDCOM date "${value}" cannot be represented by PlainRoots' current YYYY, YYYY-MM, or YYYY-MM-DD fields`
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
