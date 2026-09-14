import { escapeAttribute, escapeHtml } from "./person-card-html.mjs";

export function renderPrintStories(person, localeData, formatDate) {
  if (!person.stories?.length) {
    return "";
  }

  const strings = localeData.strings;
  const entries = person.stories
    .map((story) => {
      const details = [
        story.date
          ? `${strings.printStoryDate}: ${formatDate(story.date, localeData)}`
          : "",
        `${strings.printStoryOriginalLanguage}: ${story.originalLanguage}`
      ]
        .filter(Boolean)
        .join(" · ");
      return `              <li class="story">
                <h6>${escapeHtml(story.title)}</h6>
                <span class="story-details">${escapeHtml(details)}</span>
${renderContent(story)}
${renderImages(person.id, story.images, strings)}
${story.audio ? renderFileLink(person.id, story.audio.file, story.audio.available, strings.printStoryAudio, strings) : ""}
${renderFileLink(person.id, story.contentFile, story.contentAvailable, strings.printStoryText, strings)}
              </li>`;
    })
    .join("\n");

  return `          <section class="stories">
            <h5>${escapeHtml(strings.printStories)}</h5>
            <ul>
${entries}
            </ul>
          </section>`;
}

function renderContent(story) {
  if (!story.contentAvailable || !story.content) {
    return "";
  }
  return `                <div class="story-content" lang="${escapeAttribute(story.contentLanguage)}">
${renderStoryMarkdown(story.content)}
                </div>`;
}

export function renderStoryMarkdown(markdown) {
  return markdown
    .trim()
    .split(/\r?\n\s*\r?\n/)
    .map((block) => renderMarkdownBlock(block))
    .join("\n");
}

function renderMarkdownBlock(block) {
  const lines = block.split(/\r?\n/);
  const fencedCode = /^```[^\n]*\n([\s\S]*?)\n```$/.exec(block);
  if (fencedCode) {
    return `                  <pre><code>${escapeHtml(fencedCode[1])}</code></pre>`;
  }

  const heading = /^(#{1,6})\s+(.+)$/.exec(block);
  if (heading && lines.length === 1) {
    return `                  <h6>${renderInlineMarkdown(heading[2])}</h6>`;
  }

  if (lines.every((line) => /^[-*]\s+/.test(line))) {
    return `                  <ul>\n${lines
      .map(
        (line) =>
          `                    <li>${renderInlineMarkdown(line.replace(/^[-*]\s+/, ""))}</li>`
      )
      .join("\n")}\n                  </ul>`;
  }

  if (lines.every((line) => /^\d+\.\s+/.test(line))) {
    return `                  <ol>\n${lines
      .map(
        (line) =>
          `                    <li>${renderInlineMarkdown(line.replace(/^\d+\.\s+/, ""))}</li>`
      )
      .join("\n")}\n                  </ol>`;
  }

  if (lines.every((line) => /^>\s?/.test(line))) {
    return `                  <blockquote>${lines
      .map((line) => renderInlineMarkdown(line.replace(/^>\s?/, "")))
      .join("<br />")}</blockquote>`;
  }

  return `                  <p>${lines
    .map((line) => renderInlineMarkdown(line))
    .join("<br />")}</p>`;
}

function renderInlineMarkdown(value) {
  const tokens = [];
  const reserve = (html) => {
    const token = `\uE000${tokens.length}\uE001`;
    tokens.push(html);
    return token;
  };
  let tokenized = value.replace(/`([^`\r\n]+)`/g, (_, code) =>
    reserve(`<code>${escapeHtml(code)}</code>`)
  );
  tokenized = tokenized.replace(
    /\[([^\]\r\n]+)\]\(([^)\s]+)\)/g,
    (match, label, url) =>
      isSafeMarkdownUrl(url)
        ? reserve(
            `<a href="${escapeAttribute(url)}">${escapeHtml(label)}</a>`
          )
        : match
  );

  let html = escapeHtml(tokenized)
    .replace(/\*\*([^*\r\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_\r\n]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*\r\n]+)\*/g, "<em>$1</em>")
    .replace(/_([^_\r\n]+)_/g, "<em>$1</em>");
  html = html.replace(/\uE000(\d+)\uE001/g, (_, index) => tokens[Number(index)]);
  return html;
}

function isSafeMarkdownUrl(value) {
  return /^(?:https?:|mailto:|#|\/|\.\/|\.\.\/)/i.test(value);
}

function renderImages(personId, images, strings) {
  if (!images?.length) {
    return "";
  }
  return images
    .map((image) => {
      const relativePath = `people/${personId}/${image.file}`;
      if (!image.available) {
        return `                <span class="story-file"><strong>${escapeHtml(strings.printStoryImage)}:</strong> ${escapeHtml(strings.printFileUnavailable)} <code>${escapeHtml(relativePath)}</code></span>`;
      }
      return `                <figure>
                  <img src="${escapeAttribute(relativePath)}" alt="${escapeAttribute(image.alt)}" />
${image.caption ? `                  <figcaption>${escapeHtml(image.caption)}</figcaption>\n` : ""}                </figure>`;
    })
    .join("\n");
}

function renderFileLink(personId, fileName, available, label, strings) {
  const relativePath = `people/${personId}/${fileName}`;
  if (!available) {
    return `                <span class="story-file"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(strings.printFileUnavailable)} <code>${escapeHtml(relativePath)}</code></span>`;
  }
  return `                <span class="story-file"><strong>${escapeHtml(label)}:</strong> <a href="${escapeAttribute(relativePath)}">${escapeHtml(label)}</a> <code>${escapeHtml(relativePath)}</code></span>`;
}
