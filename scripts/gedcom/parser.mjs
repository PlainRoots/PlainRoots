const SUPPORTED_VERSIONS = new Set(["5.5", "5.5.1", "5.5.5"]);
const SUPPORTED_CHARACTER_ENCODINGS = new Set(["ASCII", "UTF-8", "UNICODE"]);

export function parseGedcomBuffer(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("GEDCOM input must be a Buffer");
  }

  const decoded = decodeGedcomBuffer(buffer);
  const parsed = parseGedcomText(decoded.text);
  const version = childValue(child(parsed.header, "GEDC"), "VERS");
  const declaredEncoding = childValue(parsed.header, "CHAR");

  if (!version) {
    throw new Error("GEDCOM header is missing HEAD.GEDC.VERS");
  }
  if (!SUPPORTED_VERSIONS.has(version)) {
    throw new Error(
      `Unsupported GEDCOM version "${version}". PlainRoots imports 5.5, 5.5.1, and 5.5.5.`
    );
  }
  if (!declaredEncoding) {
    throw new Error("GEDCOM header is missing HEAD.CHAR");
  }
  if (declaredEncoding.toUpperCase() === "ANSEL") {
    throw new Error(
      "GEDCOM ANSEL encoding is not supported yet. Convert the file to UTF-8 without changing its records, then retry."
    );
  }
  if (!SUPPORTED_CHARACTER_ENCODINGS.has(declaredEncoding.toUpperCase())) {
    throw new Error(
      `Unsupported GEDCOM character encoding "${declaredEncoding}".`
    );
  }
  if (
    declaredEncoding.toUpperCase() === "UNICODE" &&
    !decoded.encoding.startsWith("UTF-16")
  ) {
    throw new Error(
      `HEAD.CHAR declares UNICODE, but the file was detected as ${decoded.encoding}.`
    );
  }

  const pointers = indexPointers(parsed.records);
  const diagnostics = validatePointers(parsed.records, pointers);

  return {
    ...parsed,
    version,
    declaredEncoding,
    detectedEncoding: decoded.encoding,
    pointers,
    diagnostics
  };
}

export function parseGedcomText(text) {
  if (typeof text !== "string") {
    throw new Error("GEDCOM text must be a string");
  }

  const physicalLines = text
    .replace(/^\uFEFF/, "")
    .split(/\r\n|\n|\r/)
    .filter((value, index, values) => {
      return !(index === values.length - 1 && value === "");
    });
  if (physicalLines.length === 0) {
    throw new Error("GEDCOM file is empty");
  }

  const records = [];
  const stack = [];
  for (let index = 0; index < physicalLines.length; index += 1) {
    const node = parseLine(physicalLines[index], index + 1);
    if (node.level > stack.length) {
      throw new Error(
        `GEDCOM line ${node.line}: level ${node.level} skips a parent level`
      );
    }
    stack.length = node.level;
    if (node.level === 0) {
      records.push(node);
    } else {
      const parent = stack[node.level - 1];
      if (!parent) {
        throw new Error(
          `GEDCOM line ${node.line}: level ${node.level} has no parent`
        );
      }
      parent.children.push(node);
    }
    stack[node.level] = node;
  }

  const header = records.find((record) => record.tag === "HEAD");
  if (!header || records[0] !== header) {
    throw new Error("GEDCOM file must begin with a level-0 HEAD record");
  }
  if (records.at(-1)?.tag !== "TRLR") {
    throw new Error("GEDCOM file must end with a level-0 TRLR record");
  }

  return { records, header, physicalLineCount: physicalLines.length };
}

export function child(node, tag) {
  return node?.children.find((candidate) => candidate.tag === tag) ?? null;
}

export function children(node, tag) {
  return node?.children.filter((candidate) => candidate.tag === tag) ?? [];
}

export function childValue(node, tag) {
  const matchingChild = child(node, tag);
  return matchingChild ? recordText(matchingChild) : null;
}

export function recordText(node) {
  let result = node.value ?? "";
  for (const continuation of node.children) {
    if (continuation.tag === "CONC") {
      result += continuation.value ?? "";
    } else if (continuation.tag === "CONT") {
      result += `\n${continuation.value ?? ""}`;
    }
  }
  return result;
}

function parseLine(source, lineNumber) {
  const match = /^(\d+)(?: (@[^@\s]+@))? ([A-Za-z0-9_]+)(?: (.*))?$/.exec(
    source
  );
  if (!match) {
    throw new Error(`GEDCOM line ${lineNumber} has invalid syntax`);
  }

  const [, levelText, xref = null, tag, rawValue = null] = match;
  const level = Number(levelText);
  if (!Number.isSafeInteger(level)) {
    throw new Error(`GEDCOM line ${lineNumber} has an invalid level`);
  }

  return {
    level,
    xref,
    tag: tag.toUpperCase(),
    value: rawValue === null ? null : rawValue.replaceAll("@@", "@"),
    rawValue,
    line: lineNumber,
    children: []
  };
}

function decodeGedcomBuffer(buffer) {
  if (buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))) {
    return {
      text: buffer.subarray(3).toString("utf8"),
      encoding: "UTF-8"
    };
  }
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return {
      text: buffer.subarray(2).toString("utf16le"),
      encoding: "UTF-16LE"
    };
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    const content = Buffer.from(buffer.subarray(2));
    content.swap16();
    return { text: content.toString("utf16le"), encoding: "UTF-16BE" };
  }

  const sample = buffer.subarray(0, Math.min(buffer.length, 200));
  const evenNulls = countNulls(sample, 0);
  const oddNulls = countNulls(sample, 1);
  if (oddNulls > sample.length / 8 && evenNulls === 0) {
    return { text: buffer.toString("utf16le"), encoding: "UTF-16LE" };
  }
  if (evenNulls > sample.length / 8 && oddNulls === 0) {
    const content = Buffer.from(buffer);
    content.swap16();
    return { text: content.toString("utf16le"), encoding: "UTF-16BE" };
  }

  return { text: buffer.toString("utf8"), encoding: "UTF-8" };
}

function countNulls(buffer, parity) {
  let count = 0;
  for (let index = parity; index < buffer.length; index += 2) {
    if (buffer[index] === 0) {
      count += 1;
    }
  }
  return count;
}

function indexPointers(records) {
  const pointers = new Map();
  for (const record of records) {
    if (!record.xref) {
      continue;
    }
    if (pointers.has(record.xref)) {
      throw new Error(
        `GEDCOM line ${record.line}: duplicate cross-reference ${record.xref}`
      );
    }
    pointers.set(record.xref, record);
  }
  return pointers;
}

function validatePointers(records, pointers) {
  const diagnostics = [];
  visit(records, (node) => {
    if (
      node.rawValue &&
      /^@[^@\s]+@$/.test(node.rawValue) &&
      !pointers.has(node.rawValue)
    ) {
      diagnostics.push({
        severity: "error",
        code: "broken-pointer",
        line: node.line,
        pointer: node.rawValue,
        message: `${node.tag} references missing record ${node.rawValue}`
      });
    }
  });
  return diagnostics;
}

function visit(nodes, callback) {
  for (const node of nodes) {
    callback(node);
    visit(node.children, callback);
  }
}
