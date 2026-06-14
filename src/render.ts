import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { escapeHtml, renderDocumentHeader } from "./shared.js";
import {
  Resume,
  SKILL_DISPLAY_ORDER,
  SKILL_GROUP_LABELS,
} from "./types.js";

function formatAchievement(achievement: {
  description: string;
  impact?: string;
}): string {
  const text = achievement.impact
    ? `${achievement.description} ${achievement.impact}`
    : achievement.description;
  return escapeHtml(text);
}

function formatResumeDate(value: string): string {
  if (value.toLowerCase() === "present") {
    return "Present";
  }

  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    return `${match[2]}/${match[1]}`;
  }

  return escapeHtml(value);
}

function formatDateRange(start: string, end: string, location: string): string {
  return `${formatResumeDate(start)} – ${formatResumeDate(end)} · ${escapeHtml(location)}`;
}

function renderSkills(skills: Resume["skills"]): string {
  const seenLabels = new Set<string>();

  const items = SKILL_DISPLAY_ORDER.map((key) => {
    const values = skills[key];
    if (!Array.isArray(values) || values.length === 0) {
      return "";
    }

    const label = SKILL_GROUP_LABELS[key] ?? key.replace(/_/g, " ");
    if (seenLabels.has(label)) {
      return "";
    }
    seenLabels.add(label);

    return `<div class="skill-group"><strong>${escapeHtml(label)}</strong> — ${escapeHtml(values.join(", "))}</div>`;
  })
    .filter(Boolean)
    .join("");

  if (!items) {
    return "";
  }

  return `<section><h2>Skills</h2>${items}</section>`;
}

function renderExperience(experience: Resume["experience"]): string {
  const jobs = experience
    .map((job) => {
      const bullets = job.achievements
        .map((achievement) => `<li>${formatAchievement(achievement)}</li>`)
        .join("");

      return `
        <div class="job">
          <div class="job-header">
            <div class="job-title-line">
              ${escapeHtml(job.position)}<span class="job-company"> · ${escapeHtml(job.company)}</span>
            </div>
            <div class="job-meta">${formatDateRange(job.start_date, job.end_date, job.location)}</div>
          </div>
          <ul>${bullets}</ul>
        </div>
      `;
    })
    .join("");

  return `<section><h2>Professional Experience</h2>${jobs}</section>`;
}

function renderEducation(education: Resume["education"]): string {
  const items = education
    .map((item) => {
      const location = item.location ? ` · ${escapeHtml(item.location)}` : "";
      return `
        <div class="education-item">
          <div class="education-line">
            <div>
              <span class="education-degree">${escapeHtml(item.degree)}</span><span class="education-institution">, ${escapeHtml(item.institution)}</span>
            </div>
            <div class="job-meta">${item.start_year} – ${item.end_year}${location}</div>
          </div>
        </div>
      `;
    })
    .join("");

  return `<section><h2>Education</h2>${items}</section>`;
}

function renderContent(resume: Resume): string {
  const { professional_summary } = resume;

  return `
    ${renderDocumentHeader(resume.personal_info)}
    <section>
      <h2>Professional Profile</h2>
      <p class="summary">${escapeHtml(professional_summary)}</p>
    </section>
    ${renderSkills(resume.skills)}
    ${renderExperience(resume.experience)}
    ${renderEducation(resume.education)}
  `;
}

export function renderResumeHtml(resume: Resume): string {
  const templatePath = join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "templates",
    "resume.html"
  );
  const template = readFileSync(templatePath, "utf-8");
  const content = renderContent(resume);

  return template
    .replace("{{FULL_NAME}}", escapeHtml(resume.personal_info.full_name))
    .replace("{{CONTENT}}", content);
}
