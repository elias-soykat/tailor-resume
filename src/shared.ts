import { PersonalInfo } from "./types.js";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderContactHeader(info: PersonalInfo): string {
  const items: string[] = [];

  if (info.email) {
    items.push(
      `<span class="contact-item"><a href="mailto:${escapeHtml(info.email)}" class="contact-link">${escapeHtml(info.email)}</a></span>`
    );
  }

  if (info.phone) {
    items.push(
      `<span class="contact-item"><a href="tel:${escapeHtml(info.phone.replace(/[\s()-]/g, ""))}" class="contact-link">${escapeHtml(info.phone)}</a></span>`
    );
  }

  if (info.website) {
    const href = /^https?:\/\//i.test(info.website)
      ? info.website
      : `https://${info.website}`;
    const display = info.website
      .replace(/^https?:\/\//i, "")
      .replace(/\/$/, "");
    items.push(
      `<span class="contact-item"><a href="${escapeHtml(href)}" class="contact-link">${escapeHtml(display)}</a></span>`
    );
  }

  if (info.linkedin) {
    const handle = info.linkedin
      .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\/?/, "")
      .replace(/\/$/, "");
    items.push(
      `<span class="contact-item"><a href="https://linkedin.com/in/${escapeHtml(handle)}" class="contact-link">linkedin.com/in/${escapeHtml(handle)}</a></span>`
    );
  }

  if (info.github) {
    const handle = info.github
      .replace(/^https?:\/\/(www\.)?github\.com\/?/, "")
      .replace(/\/$/, "");
    items.push(
      `<span class="contact-item"><a href="https://github.com/${escapeHtml(handle)}" class="contact-link">github.com/${escapeHtml(handle)}</a></span>`
    );
  }

  if (info.location) {
    items.push(`<span class="contact-item"><span>${escapeHtml(info.location)}</span></span>`);
  }

  const splitAt = items.length > 4 ? Math.ceil(items.length / 2) : items.length;
  const rows = [items.slice(0, splitAt), items.slice(splitAt)].filter(
    (row) => row.length > 0
  );

  return rows
    .map((row) => `<div class="contact-row">${row.join('<span class="sep">·</span>')}</div>`)
    .join("");
}

export function renderDocumentHeader(info: PersonalInfo): string {
  return `
    <header>
      <h1>${escapeHtml(info.full_name)}</h1>
      <div class="title">${escapeHtml(info.title)}</div>
      <div class="contact">${renderContactHeader(info)}</div>
    </header>
  `;
}
