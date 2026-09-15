# Add data to your family archive

Use this guide only in the private working copy created through
[Start your private family archive](START-YOUR-FAMILY-ARCHIVE.md). Configure
the family's languages in `supported-locales.json` before adding records.

GitHub Copilot CLI can read supplied sources, organize facts, create and update
records, translate content, validate locations, identify conflicts, prepare
photos, and draft correspondence. It must not invent missing facts or silently
resolve ambiguity. You remain responsible for reviewing the source, proposed
interpretation, file changes, translations, and privacy implications.

## Before every data-entry session

Start Copilot CLI in the private repository and enter:

```text
Before handling family data, verify that this is my private family archive.
Show the current folder, GitHub repository visibility, branch, working-tree
status, and every remote fetch and push URL. Confirm that origin is private and
that the public PlainRoots upstream has push URL DISABLED. Do not change
anything until these checks pass.
```

Do not continue if the repository is public, the folder is unexpected, or a
remote could push to the public PlainRoots repository.

For every source:

- Confirm that you have permission to preserve its information and media.
- Minimize information about living people.
- Never provide passwords, access tokens, financial information, private
  addresses, or unrelated sensitive material.
- Ask Copilot to show the proposed facts and provenance before changing files.
- Review `/diff` after changes and before committing.

## Import facts from a document or image

Copilot CLI can accept PDF, PNG, JPEG/JPG, GIF, WebP, HEIC, and HEIF
attachments. Reference a file by typing `@` followed by its path, or drag it
into the interactive session.

TIFF files are not a native Copilot CLI attachment format. Ask Copilot to
preserve the original TIFF and create a temporary PNG or JPEG copy for reading.
Review and approve the conversion command. Do not replace, recompress, or
delete the original.

Use a prompt like:

```text
Read @C:\FamilySources\birth-certificate.pdf as genealogical evidence.

1. Identify the document type, issuing organization, jurisdiction, date,
   page, language, and legible names or reference numbers needed for
   provenance. Do not copy private addresses, credentials, or unrelated
   identifiers into the repository.
2. Transcribe the relevant text exactly in its original language. Mark
   uncertain characters and unreadable sections; do not guess.
3. Translate the relevant text into canonical en-US and explain any
   translation uncertainty. Add translations needed by every active locale in
   supported-locales.json.
4. Separate explicit statements from inference. List each proposed fact, the
   person it concerns, and the exact source passage supporting it.
5. Compare each proposed name, date, place, occupation, status, and
   relationship with existing records. Report every conflict or ambiguity and
   ask me which interpretation is correct. Do not overwrite a conflicting fact
   silently.
6. Validate every location against authoritative government, civil-registry,
   national-statistics, municipal, or other official geographic sources.
   Preserve the document's wording in provenance when it differs from the
   normalized place. If more than one location is plausible, ask me to
   disambiguate it.
7. Show the proposed record updates and provenance notes. After I approve
   them, update only confirmed facts and add concise source provenance,
   conflicts, uncertainty, and rationale to researchNotes. Do not copy the
   source document into the repository.
8. Run all relevant validation, translation, generation, and test commands.
   Summarize the changed source files and give me the generated outputs to
   review.
```

On macOS, use a path such as
`@/Users/me/FamilySources/birth-certificate.pdf`.

OCR and handwriting recognition can make mistakes. Compare the transcription
with the original image, especially names, accents, dates, ages, handwritten
notes, stamps, and marginal annotations. An official record is evidence, not
an automatic guarantee that every incidental fact is correct.

Keep sensitive source documents outside Git by default and preserve them in an
encrypted backup. Add a source file to the private repository only after
reviewing its complete contents, confirming that everyone with repository
access may see it, checking Git LFS requirements, and explicitly approving the
addition. A later deletion does not remove a file from Git history.

### Provenance to preserve

Provenance should be useful without exposing unnecessary private data. Record,
when known:

- Document type and issuing organization.
- Archive, parish, civil registry, collection, or repository.
- Jurisdiction, volume, book, page, image, entry, or certificate number.
- Document and event dates.
- Original language.
- Who supplied the copy and when, when appropriate.
- Which facts the source supports.
- Transcription or translation uncertainty.
- Conflicts with other evidence and the reason for any working conclusion.

## Analyze a source without changing records

You may want to understand a source before deciding whether it belongs in the
archive. State explicitly that the task is research-only:

```text
Analyze @C:\FamilySources\older-family-tree.pdf in research-only mode.
Do not modify, create, move, or delete repository files.

1. Summarize the document's structure, language, apparent author, date, and
   limitations.
2. Find people who may match existing records. For every possible match, give
   the page, source wording, existing person ID, matching evidence, and reasons
   for uncertainty.
3. List people and relationships that do not appear in the archive.
4. Identify contradictions, unreadable text, and facts that require
   disambiguation.
5. Clearly separate exact matches, possible matches, new people, and conflicts.
6. Recommend the next questions or sources that would resolve the uncertainty.

Return findings only. Do not update the family archive unless I start a
separate task and approve specific changes.
```

This approach is useful for a large family tree, an unfamiliar document, a
relative's notes, or a source whose reliability is unknown. An apparent name
match is not sufficient to merge two people.

## Reconcile a legacy tree or recovered notes

Copilot can compare an old family-tree export, indented text outline,
spreadsheet, or recovered notes with the current archive. Begin with a dry run
so duplicate people and incorrect relationships are not imported.

```text
Compare @C:\FamilySources\recovered-family-tree.txt with this archive. Do not
change files yet.

1. Parse people, names, partners, parents, children, siblings, guardianships,
   dates, places, occupations, and notes. Mark text whose hierarchy or meaning
   is unclear.
2. Classify each person as an exact existing match, probable match, possible
   match, apparently new person, or unresolved duplicate.
3. For each match, compare every supplied fact and relationship with the
   existing record. Show conflicts and source provenance.
4. List people who would remain unconnected and explain why.
5. Propose small import batches, starting with the highest-confidence people
   and relationships. Never merge records based only on similar names.
6. Ask me to confirm identities, conflicts, and the first batch. Apply only
   that approved batch, validate it, and stop for review.
```

When importing from another genealogy program, preserve a copy of the original
export outside Git. Do not imply that PlainRoots supports a source format
unless the repository contains an importer for it; Copilot may instead help
convert reviewed information into the PlainRoots model.

## Add a family story from text or a recording

Stories belong to their author, even when they discuss other relatives.
Copilot stores each story under `people/<author-id>/`, preserves the original
language, and renders stories in printable reports.

You can paste text directly, attach a text file, or reference an approved audio
recording. Supported story-audio formats are AAC, FLAC, M4A, MP3, OGG, WAV,
and WebM.

Use a prompt like:

```text
Add @C:\FamilySources\grandmother-interview.m4a as a family story.

The speaker and story author is María García. Confirm her existing person ID
before changing files. Ask me if the author or any person mentioned is
ambiguous.

1. Confirm that I have permission to preserve the recording and transcript.
2. Detect and report the original language. Transcribe the recording verbatim;
   mark inaudible words instead of inventing them.
3. Ask me for the story date if it is known. Do not infer an unknown date.
4. Preserve the original audio and create a non-empty Markdown transcript.
5. Translate the title and complete transcript into every other active locale
   in supported-locales.json. Keep each language in a separate Markdown file
   and identify wording that needs review by a fluent speaker.
6. Register the story under its author's person record. Do not turn it into
   remarks or attribute it to a person merely mentioned in the story.
7. Report the audio format and size. Apply the repository's Git LFS rules and
   size limits without changing the original recording.
8. Run story, locale, LFS, generation, and printable-report checks. Give me
   links to every localized printable report for review.
```

For a story supplied as text, replace the recording path with the text:

```text
Add the following story in its original Mexican Spanish. My uncle Rafael is
the author. Preserve my wording, ask about any unclear attribution or date,
and translate it into every other active locale:

<paste the story here>
```

Copilot will create a draft transcription and translations, but you should have
the speaker or fluent family members review them. Do not publish private
conversations or statements that the author did not approve for archive
collaborators.

## Ask relatives questions and process their replies

The fastest way to close research gaps is often to ask the right relative a
small number of specific questions. Copilot can inspect the archive and draft
questions in the relative's language and from their point of view.

```text
Review the records related to Elena Morales Fernández and identify the three
highest-value questions for her oldest living child.

Prioritize questions that could resolve uncertain identity, parentage, dates,
places, photographs, or source provenance. Phrase them from the child's point
of view, such as "What was your mother's birthplace?" rather than "What was
Elena's birthplace?" Explain to me why each answer would help. Draft a warm
Mexican Spanish message and an English translation. Include only information
needed for the questions, and do not send it.
```

Relatives may reply conversationally, use shorthand, mix languages, or correct
several generations at once. Process their reply as proposed evidence:

```text
The following is a reply from Elena's child, received on 14 September 2026.
Parse it, but do not update files yet:

<paste the reply>

1. Preserve the original wording and language.
2. List each proposed person, fact, relationship, correction, story, and
   uncertainty separately.
3. Attribute the information to the respondent and reception date.
4. Compare it with the archive and identify ambiguous names, dates, places,
   nicknames, and conflicts.
5. Ask focused follow-up questions where needed.
6. Show the exact proposed updates and provenance. Wait for my approval before
   changing files, then apply only the approved items.
```

A relative's account can be valuable first-hand or family evidence, but it
does not automatically override a contemporary record. Record who supplied
each claim rather than citing the person who typed it into the archive.

## Add people and relationships in natural language

You do not need to write JSON. Describe confirmed facts naturally, identify
which facts are unknown, and tell Copilot whether the information comes from a
document, a family account, or your direct knowledge.

### Add one person

```text
Add my confirmed relative María García López. She was born on 14 February 2012
in Guadalajara, Jalisco, Mexico. She is living and is a student. This
information was confirmed by her mother on 10 September 2026. Ask me about
privacy and consent before adding a living child, validate the location against
official sources, show the proposed record and provenance, and wait for my
approval before changing files.
```

### Add a sibling

```text
Diego García has one confirmed biological sibling, María García López. They
share the same mother, Marta García López; María's other parent is unknown.
Do not invent the unknown parent or a partnership. Check the existing family
model, explain whether to reuse a family or create a sibling group, and ask for
confirmation before updating tree.json.
```

### Add parents and a marriage

```text
Add Lucía Fernández Ruiz, born in Puebla, Puebla, Mexico in 1968, occupation
Homemaker, and Antonio Morales Vega, born in 1965 with birthplace unknown,
occupation Carpenter. They married in 1990 and are the confirmed parents of
Elena Morales Fernández. Validate Puebla against official sources. Preserve
year-only dates as years, keep Antonio's birthplace unknown, check for
conflicts with Elena's current relationships, and show the modeled family
before changing files.
```

### Add a guardianship without changing parentage

```text
Record that Rosa Martínez raised Samuel Torres from age eight, based on a
family account from Samuel. Rosa is his guardian, not his biological parent.
Keep biological parentage unchanged, model this as a raised-by guardianship,
record the evidence and provenance, and show me any conflict before applying
it.
```

### Correct a fact

```text
A civil birth record says Elena Morales Fernández was born on 3 May 1991, but
her existing record says 5 March 1991. Do not select either date automatically.
Compare the evidence and provenance, explain the conflict, ask me for the
source details needed to assess reliability, and preserve both claims in
researchNotes until a working value is justified.
```

### Correct a relationship or identity

Corrections can affect multiple people and generated views. Ask Copilot to
trace the consequences before changing the tree:

```text
Camila Santos is currently modeled as Irene Santos's daughter, but a family
record shows that they are sisters and share the same confirmed parents.
Analyze the current people, families, and relationships for both women. Show
which links, sibling groups, and generated views would change. Check whether
any similarly named person could be involved. Preserve the old claim and its
source as conflicting evidence, propose the corrected model, and wait for my
approval.
```

Do not delete a person merely because one relationship was wrong. A correction
may reveal two people with the same name, an incorrect merge, or an unresolved
identity.

### Add approximate, ranged, or derived facts

Keep the precision supplied by the evidence. A year is not a complete date,
`before 1956` is not 1955, and a value calculated from an age is not exact.

```text
A document dated 12 October 1974 says Camila was 28 and her spouse was 31. It
also states that Camila's mother was already deceased. Calculate the possible
birth years and record the calculations as estimates, including the
possibility that their birthdays had not yet occurred that year. Record the
mother's death only as before 12 October 1974. Show the proposed values and
researchNotes; do not turn them into exact dates.
```

Use explicit wording such as `estimated`, `about`, `before`, `after`, or a date
range. Keep the source date, arithmetic, assumptions, and uncertainty in
provenance so another researcher can reproduce the conclusion.

### Add alternate, maiden, married, and multilingual names

Names can vary across a lifetime, language, script, country, and document.
Record the role and evidence for each name instead of replacing one spelling
with another without explanation.

```text
Add "Lola" as a confirmed nickname for Dolores Martínez Vega and "Dolores
Martínez de Ruiz" as a married-name form found on her child's birth
certificate. Preserve her established display name and maiden surnames. Record
which source supports each form and check for an existing person before making
changes.
```

For transliteration or historical spelling research:

```text
Research possible original-script forms of this ancestor's recorded name.
Consider the person's documented languages, location, community, and
historical period without inferring ethnicity or religion. Use authoritative
linguistic, archival, or community sources where possible. Separate direct
transliterations, translated equivalents, phonetic spellings, and speculative
possibilities. Do not add any form as an alternate name until a family source
or document confirms it; store useful hypotheses only in researchNotes after
my approval.
```

Copilot should preserve accents and original script. Similar meanings do not
prove that two names are equivalent, and a spelling used by immigration or
civil authorities may be phonetic rather than the person's original surname.

### Model other family relationships

PlainRoots can distinguish biological parentage from guardianship. Before
modeling adoption, stepchildren, half-siblings, multiple partnerships, or
someone who was raised as a sibling, ask Copilot to read the current schema and
relationship skill and explain what can be represented faithfully.

```text
Samuel's mother later married David, who raised Samuel but did not adopt him.
Samuel has a half-sister from that marriage. Preserve Samuel's biological
parentage, model only relationships supported by the current schema, and
record the raised-by account with its source. Do not label David as a
biological or adoptive parent. Show the proposed family and guardianship links
before changing tree.json.
```

If the archive knows only that someone married, divorced, or had children, add
that family-status summary without inventing a partner or child. Approximate
counts such as "at least three children" or "three or four children" must
remain approximate.

### Add other life details

Natural-language updates can also include death places, burial or cemetery
information, migration, naturalization, last-known locations, languages
spoken, education, military service, religion, and institutional affiliations.
These details need the same privacy, provenance, translation, and location
validation as births and occupations.

```text
The death certificate states that Camila died in Rosario, Santa Fe, Argentina,
and was buried at a named cemetery. Her niece recalls that she spoke Italian
and Spanish. Separate the certificate facts from the family account, exclude
the private street address printed on the certificate, validate the historical
place name and cemetery, and show where each approved detail belongs in the
current schema. Do not add unsupported fields merely to retain every detail;
preserve useful source information in researchNotes.
```

Copilot checks proposed relationships against existing parents, partners,
children, siblings, guardianships, surnames, and generations. It should not
average conflicting dates, silently prefer the newest source, or create a
person or relationship merely to make a chart look complete.

## Preserve family lore and research hypotheses

Family lore can guide research without being presented as established history.
Use a Story for a substantial attributed narrative, `remarks` for concise
biographical context suitable for family reports, and `researchNotes` for
provenance, competing claims, hypotheses, and investigation details.

```text
Record this family account without treating it as confirmed fact:

<paste the account>

Identify the narrator and when the account was received. Separate the
narrator's direct memory from events they heard from someone else. Identify
testable claims, contradictions, sensitive statements, and possible research
paths. Recommend whether the material belongs in a Story, remarks, or
researchNotes. Improve wording only with my approval, preserve attribution,
and do not turn a hypothesis into a person, date, place, title, or
relationship.
```

When the same account concerns multiple people, keep one authoritative
attributed narrative and reference it appropriately rather than copying
slightly different versions into several records.

## Location and fact validation

Every new or corrected location should be checked automatically against
authoritative sources. Depending on the country and period, these may include
national statistical agencies, official locality catalogs, civil registries,
municipal or provincial records, postal authorities, and historical
jurisdiction records.

Copilot should:

1. Confirm spelling, accents, country, and administrative hierarchy.
2. Distinguish a locality from a municipality, county, state, province, or
   similarly named region.
3. Identify historical names or jurisdictions.
4. Preserve the source's original wording in provenance notes.
5. Present multiple plausible matches and ask you to disambiguate them.

Copilot also compares incoming facts with the archive. It should call attention
to inconsistent names, dates, places, ages, life status, parentage,
partnerships, and generation order. A conflict is not an instruction to
overwrite a record. Preserve competing evidence and resolve it according to
source reliability.

Official online sources may be unavailable or incomplete. When validation
cannot be completed, keep the location unconfirmed or least-specific rather
than treating a search failure as proof.

## Add or improve a person's photo

Attach a JPG, JPEG, PNG, GIF, WebP, HEIC, or HEIF image and identify the person.
For TIFF, ask Copilot to preserve the original and create a working PNG or JPEG
copy before processing.

Use a prompt like:

```text
Add @C:\FamilySources\maria-portrait.jpg as María García López's card photo.
Confirm her person ID and that I have permission to include the image.
Preserve the supplied original; never overwrite or delete an existing photo.
Report the source image's pixel dimensions and file size. Create the next
available numbered portrait, crop about 6 percent from the top unless that
would clip important details, center the horizontal crop, resize it to the
recommended 400 by 708 pixels, and keep it under the repository's photo size
limits. Report the final dimensions and size and give me a clickable link to
review the exact imported image before updating generated outputs.
```

Copilot should preserve existing portraits, add replacements with numbered
filenames, and make cards use the latest version. Cropping is assisted, not
infallible: inspect faces, hair, hats, clothing, and historical details before
approving the final image. Prefer non-AI-edited photographs, ideally showing
the person in their 20s or 30s when such a photo is available.

### Extract portraits from a group photograph

Preserve the complete group photograph before creating individual working
crops. Supply identities only when known; visual resemblance alone is not
proof.

```text
Create card-portrait candidates from
@C:\FamilySources\family-reunion-1968.jpg.

Preserve and report the original file's dimensions and size. The people are,
from left to right: Elena Morales, an unidentified person, Rafael Morales, and
Lucía Fernández. Do not guess the unidentified person. Skip Rafael because his
current preferred portrait should remain unchanged.

For Elena and Lucía, create the next numbered portrait without overwriting
existing files. Crop each person separately using the repository's 400 by 708
pixel guidance and report the source crop and final dimensions and sizes.
Provide links to the original and every candidate. Do not update person records
until I confirm both identities and crops.
```

If an identification is later corrected, remove the incorrect association
without deleting the preserved source or concealing the correction. Do not use
facial recognition to infer identities that the user has not supplied.

## Audit the archive and plan research

Copilot can turn missing data into a focused research plan instead of filling
gaps with assumptions.

```text
Audit the archive for research gaps without changing files.

1. Find missing or uncertain names, birth and death information, places,
   occupations, life status, relationships, photos, story translations, and
   provenance.
2. Identify unconnected people, possible duplicates, unresolved conflicts,
   stale generated files, and source references whose files cannot be located.
3. Group findings by family branch and rank them by value, confidence, privacy
   risk, and likely effort.
4. Recommend the next five actions. For questions a relative may answer, name
   the best type of respondent and draft one concise question.
5. Suggest an appropriate chart or printable report with missing-information
   highlighting for review. Do not change source records.
```

Save a research backlog only when requested. It should distinguish open
questions, people to contact, sources to request, hypotheses to test, and
completed work so an old hypothesis is not mistaken for a fact.

### Inventory sources for a person or fact

Use a source inventory to prevent facts from becoming disconnected from their
evidence:

```text
Inventory the evidence for Elena Morales Fernández without changing files.
For every date, place, name, occupation, relationship, and life-status claim,
list its provenance and any referenced local source file. Report missing,
ambiguous, or inaccessible files and competing evidence. Do not display
private addresses or unrelated identifiers from the sources. Recommend which
source gaps should be resolved first.
```

An inventory can report that a source is unavailable without treating the fact
as false. Do not search outside the approved archive and source folders.

### Research historical context

Historical research can help interpret evidence, including former
jurisdictions, migration routes, military ranks, occupations, naming customs,
religious records, and archive custody. Keep contextual findings separate from
person-level facts:

```text
Research the historical jurisdiction and likely record custodian for this
place and period. Use authoritative sources, cite them, distinguish current
from historical geography, and explain what records might exist. Do not add
the contextual research to a person's record or infer that an event occurred
there. Propose any useful researchNotes and wait for my approval.
```

## Generate reports for family review

Focused reports make it easier for relatives to identify errors and missing
people. Ask for only the views needed by the reviewer and generate every active
locale unless the reviewer requests one language.

```text
Prepare a review package for Elena's oldest living child. Generate the most
useful focused ancestry or descendants view, a printable report, and a text
report with missing information highlighted where supported. Include only the
relatives and private details needed for this review. Generate every active
locale, give me clickable links, and draft a short message explaining how to
report corrections. Do not publish, email, commit, or push anything.
```

Treat returned annotations as new attributed evidence. Parse them, compare them
with the archive, surface conflicts, and request approval exactly as you would
for any other family response.

## Draft letters to relatives and record custodians

Copilot can draft respectful correspondence to relatives, churches, civil
registries, archives, historical societies, and other record custodians in
your language or the recipient's language. It can help research official
contact details and local conventions, but it should not send a message,
submit a form, or disclose family data without your explicit approval.

Use a prompt like:

```text
Draft a concise, respectful email in Spanish to a Catholic parish in Spain
requesting help locating a baptism record for Elena Morales Fernández, believed
to have been baptized between 1890 and 1893.

1. Ask me for the parish, municipality, province, parents' names, approximate
   date, religion, and any archive reference that is actually known. Do not
   invent missing details.
2. Find and verify the parish or diocesan archive's official website, preferred
   contact method, current record-request instructions, fees, identification
   requirements, and whether the records have moved to another custodian.
3. Draft the letter in the recipient's native language and provide an English
   translation for my review.
4. Include only the minimum personal information needed for the search. Do not
   include credentials, financial details, private addresses, or information
   about unrelated living people.
5. Cite the official pages used for contact details and procedures.
6. Do not send the email or submit any form. Wait for my approval and let me
   send it through my own account.
```

For a relative, specify the desired tone and relationship:

```text
Draft a warm WhatsApp message in Mexican Spanish to my aunt asking whether she
recognizes the people in an old photograph. Explain that it is fine not to
know, ask who supplied each identification, and include an English translation
for my review. Do not send it.
```

Before contacting anyone abroad, verify the current organization, language,
time zone, fees, privacy rules, and accepted request method through official
sources. Use the same approach for organizations within your own country.
Treat any response as new evidence to review, not as an automatic record
update.

## Finish each change safely

After any approved update, ask Copilot:

```text
Review the complete change for unsupported facts, unresolved conflicts,
privacy issues, missing provenance, incomplete translations, and accidental
changes to generated files. Run the smallest complete set of repository tests
and checks, regenerate every configured locale, and give me the source diff and
localized outputs to review. Do not commit or push until I explicitly ask.
```

Commit small, related changes so their provenance is understandable later.
Generated outputs never replace review of the source records.
