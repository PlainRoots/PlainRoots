---
name: draft-family-outreach
description: Draft privacy-conscious multilingual messages to relatives, potential relatives, communities, archives, churches, and record custodians without sending them.
---

# Draft family research outreach

Use this skill to prepare questions or correspondence for relatives, potential
relatives, community groups, civil registries, churches, archives, cemeteries,
libraries, historical societies, and other record custodians.

This skill produces drafts only. Never send an email or message, post to a
group, submit a form, initiate a call, upload an attachment, create an account,
make a payment, or accept terms on the user's behalf.

For real family data, require `protect-family-archive` to pass before reading
private records, contact lists, correspondence, or sensitive attachments.

## Select the recipient type

Choose the appropriate workflow:

- **Known relative:** Ask focused questions or request review of information
  the family already shares.
- **Potential relative:** Explore a possible connection without asserting that
  it is established.
- **Community or researcher:** Request research guidance, language help, or
  referrals without soliciting unnecessary personal data.
- **Official or institutional custodian:** Request a record, search,
  procedure, fee schedule, or archival guidance.

Confirm the recipient, relationship or institutional role, desired channel,
tone, language, and purpose. Do not infer a recipient's language from their
name, ethnicity, religion, or location; ask the user or verify an
organization's published language guidance.

## Define the research request

Before drafting:

1. Identify the single primary question or record sought.
2. List the facts that are confirmed and necessary to identify the person or
   event.
3. Mark approximate, conflicting, and unknown details explicitly.
4. Identify what must not be disclosed.
5. Ask whether the user wants to mention attachments; do not attach or upload
   them.
6. Determine whether the recipient should be asked about the source of their
   knowledge.
7. Use `plan-genealogy-research` when the question or best respondent is not
   yet clear.

Do not invent dates, places, relationships, religious affiliation, record
numbers, or family connections to make a request appear more complete.

## Minimum necessary disclosure

Include only information needed for the recipient to understand or locate the
requested information.

Normally appropriate:

- The subject's name and documented variants relevant to the search.
- An approximate date or range.
- A locality and jurisdiction.
- Parents, spouse, or child names when needed to distinguish the person.
- The specific record or question sought.
- The requester's preferred reply method, supplied by the user.

Normally exclude:

- Credentials, access tokens, financial details, and security information.
- Government identity numbers unless an official procedure explicitly
  requires them and the user decides to provide them outside the draft.
- Private street addresses unrelated to the search.
- Information about unrelated living people.
- The complete family tree when a few identifying facts are sufficient.
- Sensitive allegations, medical details, or private family disputes.

Do not place a private email address, phone number, mailing address, signature,
or account identifier into a saved repository template unless the user
explicitly approves that exact content.

## Write to a relative

Keep the request warm, limited, and easy to answer:

1. Explain the family-history purpose briefly.
2. Ask no more questions than the user approved.
3. Phrase questions from the relative's point of view, such as "Where was your
   mother born?"
4. Invite uncertainty: "It is completely fine if you do not know."
5. Ask how they know the answer or whether they have a document, photograph,
   or first-hand memory.
6. Ask permission before requesting a copy of private media or correspondence.
7. Avoid pressuring the person to identify others, discuss living relatives,
   or disclose sensitive events.
8. Thank them without implying that participation is expected.

When asking someone to review a chart or report, explain what is included,
identify missing or disputed items to inspect, and state how to return
corrections. Do not send the generated file.

## Write to a potential relative or community

Do not state that a relationship exists unless it is confirmed.

- Say that the user is researching a possible connection.
- Include only the minimum deceased-ancestor details needed to recognize a
  documented branch.
- Distinguish documented names from translated equivalents and
  native-language hypotheses.
- Ask for documented family history, sources, or research direction rather
  than private information about living people.
- Do not contact large groups with information that could expose living
  relatives.
- Avoid claiming membership in a cultural, religious, ethnic, or national
  community based only on an unconfirmed genealogical hypothesis.

## Write to a record custodian

Before drafting to an institution, research and cite its current official
instructions:

1. Verify the organization's official name and website.
2. Confirm that it is the current custodian for the place, record type, and
   period.
3. Find the preferred request channel and recipient title.
4. Check collection coverage, access restrictions, privacy periods, required
   identification, forms, fees, accepted payment methods, and expected
   response times.
5. Determine whether the record moved to a civil, diocesan, regional,
   national, or successor archive.
6. Distinguish official instructions from third-party advice.
7. Record the page title, organization, URL, and access date for every
   procedural claim.

If the current custodian or procedure cannot be verified, say so and draft a
request for guidance rather than pretending the recipient holds the record.
Do not bypass access controls or advise the user to misrepresent eligibility.

An institutional request should include:

- A respectful salutation using the verified office or title.
- The exact record type requested.
- Confirmed identifying facts and honest ranges.
- Known volume, parish, registry, or reference details.
- A request for the current procedure, availability, format, and cost.
- A statement that the user can provide required identification through the
  institution's official secure process.
- Thanks and a concise closing.

Do not include payment-card information, identification scans, or credentials
in the draft.

## Language and translation

Draft in the recipient's confirmed or requested language. Also provide a
canonical English review translation unless the user declines it.

- Preserve names, original-script forms, dates, reference numbers, and archive
  identifiers exactly.
- Use region-appropriate forms of address and institutional terminology.
- Do not literally translate military ranks, legal offices, church roles,
  kinship terms, or record names when the systems differ; research the
  appropriate recipient-language wording.
- Mark wording that needs review by a fluent speaker.
- Keep the translation semantically aligned with the sendable draft.
- Do not add claims to one language version that are absent from the other.

Correspondence translations are user drafts. Do not add their wording to
locale resource files.

## Draft output

Provide:

1. **Recipient and purpose**
2. **Verified contact procedure and citations**, for organizations
3. **Sendable draft in the recipient's language**
4. **English review translation**, when applicable
5. **Facts included and deliberately omitted**
6. **Items the user must verify or add**
7. **Suggested subject line**, for email
8. **No-send reminder**

Clearly distinguish verified contact information from a suggested draft.
Never fabricate an email address, postal address, recipient name, website, or
fee.

## Saving a reusable template

Do not create a template file automatically. When requested:

1. Propose a neutral lowercase ASCII filename and repository location.
2. Replace personal contact information and family-specific facts with clear
   placeholders.
3. Explain whether the template is suitable for a public or private
   repository.
4. Show the complete proposed template.
5. Ask for approval before creating or updating the file.

A saved template must not contain credentials, payment details, private
addresses, or unnecessary information about living people.

## Handling replies

A reply is new evidence, not an automatic record update.

1. Preserve the original language and wording during analysis.
2. Identify the respondent and reception date when appropriate and safe.
3. Separate direct knowledge, retold information, documents, and speculation.
4. Use `ingest-genealogy-source` for attached records or substantial source
   material.
5. Use `verify-genealogy-data` to compare claims and conflicts.
6. Show proposed facts and provenance and request approval before changing
   records.
7. Draft a follow-up only when the user requests one.

## Final boundary

The user must review and send all correspondence through their own account.
Completing a draft does not authorize sending, posting, uploading,
registration, payment, source acquisition, repository changes, commits, or
pushes.
