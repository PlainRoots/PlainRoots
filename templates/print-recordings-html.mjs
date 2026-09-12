import { escapeAttribute, escapeHtml } from "./person-card-html.mjs";

export function renderPrintRecordings(person, localeData, formatDate) {
  if (!person.recordings?.length) {
    return "";
  }

  const strings = localeData.strings;
  const entries = person.recordings
    .map((recording) => {
      const details = [
        recording.recordedDate
          ? `${strings.printRecorded}: ${formatDate(recording.recordedDate, localeData)}`
          : "",
        `${strings.printSpokenLanguage}: ${recording.language}`
      ]
        .filter(Boolean)
        .join(" · ");
      return `              <li>
                <strong>${escapeHtml(recording.title)}</strong>
                <span class="recording-details">${escapeHtml(details)}</span>
${renderFileLink(person.id, recording.audio, recording.audioAvailable, strings.printAudioRecording, strings)}
${renderFileLink(person.id, recording.transcript, recording.transcriptAvailable, strings.printTranscript, strings)}
              </li>`;
    })
    .join("\n");

  return `          <section class="recordings">
            <h5>${escapeHtml(strings.printFamilyRecordings)}</h5>
            <ul>
${entries}
            </ul>
          </section>`;
}

function renderFileLink(personId, fileName, available, label, strings) {
  const relativePath = `people/${personId}/${fileName}`;
  if (!available) {
    return `                <span class="recording-file"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(strings.printFileUnavailable)} <code>${escapeHtml(relativePath)}</code></span>`;
  }
  return `                <span class="recording-file"><strong>${escapeHtml(label)}:</strong> <a href="${escapeAttribute(relativePath)}">${escapeHtml(label)}</a> <code>${escapeHtml(relativePath)}</code></span>`;
}
