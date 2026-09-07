export const RESEARCH_NOTE_STATUSES = new Set([
  "confirmed-guidance",
  "working-hypothesis",
  "open-question"
]);

export function validateResearchNotes(value, source = "research-notes.json") {
  if (!value || typeof value !== "object" || !Array.isArray(value.notes)) {
    throw new Error(`${source}: "notes" must be an array`);
  }

  const ids = new Set();
  for (const [index, note] of value.notes.entries()) {
    const location = `${source}: notes[${index}]`;
    if (!note || typeof note !== "object") {
      throw new Error(`${location} must be an object`);
    }
    for (const field of ["id", "title", "note", "provenance"]) {
      if (typeof note[field] !== "string" || note[field].trim() === "") {
        throw new Error(`${location}: "${field}" must be a non-empty string`);
      }
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(note.id)) {
      throw new Error(`${location}: "id" must be lowercase kebab-case`);
    }
    if (ids.has(note.id)) {
      throw new Error(`${source}: duplicate note id "${note.id}"`);
    }
    if (!RESEARCH_NOTE_STATUSES.has(note.status)) {
      throw new Error(
        `${location}: "status" must be confirmed-guidance, working-hypothesis, or open-question`
      );
    }
    if (
      !Array.isArray(note.implications) ||
      note.implications.length === 0 ||
      note.implications.some(
        (implication) =>
          typeof implication !== "string" || implication.trim() === ""
      )
    ) {
      throw new Error(
        `${location}: "implications" must contain non-empty strings`
      );
    }
    ids.add(note.id);
  }
}

export function formatResearchNotes(value) {
  return value.notes
    .map((note) => {
      const implications = note.implications
        .map((implication) => `  - ${implication}`)
        .join("\n");
      return `${note.title} [${note.status}]\n${note.note}\nImplications:\n${implications}\nProvenance: ${note.provenance}`;
    })
    .join("\n\n");
}
