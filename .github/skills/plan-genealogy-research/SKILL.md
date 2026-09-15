---
name: plan-genealogy-research
description: Audit genealogy gaps, inventory evidence, research historical context, prioritize next steps, and draft focused questions without changing family records.
---

# Plan genealogy research

Use this skill when the user asks what is missing, what to research next, which
sources support a claim, which relatives to ask, or how historical context may
help interpret evidence.

This skill is read-only by default. Do not modify person records,
relationships, translations, media, generated outputs, or Git history. Create
or update a research-backlog file only when the user explicitly asks for a
persistent backlog and approves its proposed location and content.

For real family data, require `protect-family-archive` to pass before reading
private records, source inventories, or family correspondence.

## Select the research scope

Establish:

- The person, branch, relationship, source, or question being researched.
- Whether the user wants a complete audit or a focused review.
- Which repository and approved external source folders may be inspected.
- Whether online historical research is requested.
- Which living relatives or organizations could potentially answer questions.
- The desired language or active locales for questions and review materials.

Do not broaden from one branch to the entire archive without a clear reason.
Do not search outside the repository and user-approved source folders.

## Audit research gaps

Inspect source records and relationships for:

- Missing or uncertain names, dates, places, occupations, and life status.
- Missing or ambiguous parents, partners, children, siblings, and raised-by
  caregiving.
- Unconnected people and branches.
- Possible duplicate people or mistaken merges.
- Conflicting facts or relationships.
- Approximate or derived facts whose calculations or precision are missing.
- Facts without useful provenance.
- Source references whose files cannot be located in approved folders.
- Missing portraits or unreviewed portrait candidates.
- Missing Story transcripts, translations, audio, or images.
- Missing active-locale translations for narratives and localized values.
- Generated files that appear stale relative to source data.

Do not treat an intentionally unknown fact as an error. Distinguish:

- **Unknown:** No supported value is available.
- **Uncertain:** One or more candidate values exist.
- **Conflicting:** Sources support incompatible values.
- **Unverified:** A value exists but lacks adequate provenance or validation.
- **Not applicable:** The field or relationship does not apply.
- **Deliberately omitted:** The archive excludes it for privacy or scope.

## Inventory evidence

For a person, relationship, or disputed fact, produce a claim-level inventory:

| Claim | Current value | Source and locator | Informant | Evidence level | Conflict or gap |
| --- | --- | --- | --- | --- | --- |

For each source reference:

1. Identify its repository-relative or approved external location without
   exposing unnecessary private path details.
2. Report whether the file exists and is accessible.
3. Use `ingest-genealogy-source` when content must be transcribed or compared.
4. Apply `verify-genealogy-data` to reliability, conflicts, calculations, and
   location validation.
5. Report a missing or inaccessible source as an archive gap, not proof that
   the claim is false.

Do not reproduce private addresses, identity numbers, credentials, or
unrelated source content in an inventory.

## Prioritize next actions

Rank possible actions using:

- **Research value:** How many people, relationships, or conflicts could the
  answer resolve?
- **Confidence impact:** Could it move a claim from candidate or unresolved to
  confirmed or rejected?
- **Availability:** Is the source or informed respondent likely accessible?
- **Preservation urgency:** Is a living witness, fragile original, expiring
  access opportunity, or at-risk media involved?
- **Privacy risk:** Would the action expose information about living people?
- **Effort and cost:** Can a free, local, or already-held source answer the
  question before a paid or distant search?
- **Dependency:** Does another identity, date, or place need resolution first?

Prefer high-value questions that can resolve an entire branch or distinguish
between competing identities. Do not prioritize filling visually obvious chart
gaps over resolving consequential identity or parentage conflicts.

Present a short ordered list. For each action include:

1. The question to resolve.
2. Why it matters.
3. The best source or type of respondent.
4. The expected evidence strength.
5. Privacy, cost, or access considerations.
6. The next action after a successful or unsuccessful result.

## Draft questions for relatives

Questions should be small, specific, and written from the respondent's point
of view.

Prefer:

```text
What was your mother's place of birth?
Do you know whether this photograph was taken before or after your wedding?
Who told you that Rafael was raised by his aunt?
```

Avoid:

```text
What was Elena's place of birth?
Tell me everything you know about this side of the family.
Can you confirm the tree?
```

For each proposed question:

1. Name the type of respondent most likely to know the answer.
2. Explain privately to the user which gap the answer could resolve.
3. Ask only for information needed for that gap.
4. Request the source of the respondent's knowledge.
5. Make it acceptable to answer "I do not know."
6. Draft in the respondent's language and provide a review translation when
   needed.
7. Do not send the question.

Use `draft-family-outreach` for a complete message or correspondence workflow
when that skill is available.

## Research historical context

Historical context can help interpret a source but does not establish that a
person participated in an event or belonged to a group.

Appropriate topics include:

- Historical and current geographic jurisdictions.
- Civil, church, military, immigration, property, school, and cemetery record
  custody.
- Historical occupations, ranks, institutions, and administrative terms.
- Migration routes and legal processes for a documented place and period.
- Calendars, date conventions, scripts, transliteration systems, and naming
  customs.
- Wars, boundary changes, disasters, and other events directly relevant to a
  documented claim.

For online research:

1. Prefer official archives, government agencies, libraries, universities,
   record custodians, and scholarly sources.
2. Record the page title, organization, URL, access date, and claim supported.
3. Distinguish current procedures from historical context.
4. State when a source is secondary, crowdsourced, inaccessible, or uncertain.
5. Cross-check consequential claims.
6. Do not infer ethnicity, religion, citizenship, migration, military service,
   or family relationship from general historical context.

Historical findings remain research context until direct evidence connects
them to a person. Propose concise `researchNotes` only when useful and ask for
approval before adding them.

## Research backlog

Do not create a backlog automatically. When requested, first propose:

- The filename and repository location.
- Whether the file may reveal private family information.
- The fields and entries to be saved.
- Which active questions should be excluded from a public repository.

A backlog should distinguish:

- Open questions.
- People to contact.
- Sources to locate or request.
- Conflicts to resolve.
- Hypotheses to test.
- Deferred privacy decisions.
- Completed work and its outcome.
- Rejected leads and why they were rejected.

Each item should have a stable ID, scope, status, priority rationale, next
action, provenance, and dependencies. Never copy a hypothesis into a fact
field merely because the backlog item is later marked complete.

## Output format

Return the smallest useful report:

1. **Scope and limitations**
2. **Most consequential gaps**
3. **Evidence inventory or conflicts**, when requested
4. **Prioritized next actions**
5. **Focused questions**
6. **Historical or archival leads**, when requested
7. **Items deliberately not investigated**

Clearly label facts, inferences, hypotheses, and recommendations. Cite
repository files by relative path and authoritative online sources by URL.
Avoid displaying sensitive source contents when a locator and summary are
sufficient.

## Handoff

- Use `ingest-genealogy-source` to transcribe or compare a source.
- Use `verify-genealogy-data` to assess claims, conflicts, calculations,
  identities, and locations.
- Use `draft-family-outreach` for complete correspondence, when available.
- Use `generate-family-tree` for focused missing-information review outputs.
- Use `add-family-member` or `manage-family-relationships` only after the user
  separately approves proposed record changes.

Completing a research plan does not authorize file changes, outreach, source
requests, purchases, commits, or pushes.
