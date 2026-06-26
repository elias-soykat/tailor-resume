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
  const items: string[] = [
    `<span>${escapeHtml(info.email)}</span>`,
    `<span>${escapeHtml(info.location)}</span>`,
  ];

  if (info.linkedin) {
    items.push(
      `<a href="https://linkedin.com/in/${escapeHtml(info.linkedin)}">LinkedIn</a>`
    );
  }

  if (info.github) {
    items.push(
      `<a href="https://github.com/${escapeHtml(info.github)}">GitHub</a>`
    );
  }

  return items.join('<span class="sep">|</span>');
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
