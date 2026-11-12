import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { escapeHtml, renderDocumentHeader } from "./shared.js";
import { CoverLetter } from "./types.js";

function renderRecipient(letter: CoverLetter): string {
  const lines: string[] = [];
  const recipient = letter.recipient;
  const company = recipient?.company ?? letter.target_job?.company;

  if (recipient?.name) {
    lines.push(`<div>${escapeHtml(recipient.name)}</div>`);
  }

  if (recipient?.title) {
    lines.push(`<div>${escapeHtml(recipient.title)}</div>`);
  }

  if (company) {
    lines.push(`<div class="company">${escapeHtml(company)}</div>`);
  }

  if (lines.length === 0) {
    return "";
  }

  return `<div class="recipient">${lines.join("")}</div>`;
}

function renderSubject(letter: CoverLetter): string {
  const role = letter.target_job?.title ?? letter.personal_info.title;
  const company = letter.target_job?.company ?? letter.recipient?.company;

  if (!role && !company) {
    return "";
  }

  const subject = company
    ? `Re: Application for ${role} — ${company}`
    : `Re: Application for ${role}`;

  return `<div class="subject">${escapeHtml(subject)}</div>`;
}

function renderContent(letter: CoverLetter): string {
  const paragraphs = letter.paragraphs
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");

  return `
    ${renderDocumentHeader(letter.personal_info)}
    <div class="letter-date">${escapeHtml(letter.date)}</div>
    ${renderRecipient(letter)}
    ${renderSubject(letter)}
    <div class="salutation">${escapeHtml(letter.salutation)}</div>
    <div class="body">${paragraphs}</div>
    <div class="closing">${escapeHtml(letter.closing)}</div>
    <div class="signature">${escapeHtml(letter.signature_name)}</div>
  `;
}

export function renderCoverLetterHtml(letter: CoverLetter): string {
  const templatePath = join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "templates",
    "cover-letter.html"
  );
  const template = readFileSync(templatePath, "utf-8");
  const content = renderContent(letter);

  return template
    .replace("{{FULL_NAME}}", escapeHtml(letter.personal_info.full_name))
    .replace("{{CONTENT}}", content);
}
