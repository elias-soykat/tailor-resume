import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { escapeHtml, renderDocumentHeader } from "./shared.js";
import {
  Resume,
  SKILL_DISPLAY_ORDER,
  SKILL_GROUP_LABELS,
} from "./types.js";

function formatInlineMarkdown(text: string): string {
  return escapeHtml(text).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}

function renderBulletItem(htmlContent: string): string {
  return `<li>${htmlContent}</li>`;
}

function formatAchievement(achievement: {
  description: string;
  impact?: string;
}): string {
  const text = achievement.impact
    ? `${achievement.description} ${achievement.impact}`
    : achievement.description;
  return formatInlineMarkdown(text);
}

function formatResumeDate(value: string): string {
  if (value.toLowerCase() === "present") {
    return "Present";
  }

  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const monthIndex = parseInt(match[2], 10) - 1;
    const monthName = months[monthIndex] ?? match[2];
    return `${monthName} ${match[1]}`;
  }

  return escapeHtml(value);
}

function formatDateRange(start: string, end: string, location: string): string {
  return `${escapeHtml(location)} | ${formatResumeDate(start)} – ${formatResumeDate(end)}`;
}

function renderSkills(skills: Resume["skills"]): string {
  const seenLabels = new Set<string>();
  const orderedKeys = [
    ...SKILL_DISPLAY_ORDER,
    ...Object.keys(skills).filter(
      (key) => !(SKILL_DISPLAY_ORDER as readonly string[]).includes(key)
    ),
  ];

  const items = orderedKeys
    .map((key) => {
      const values = skills[key];
      if (!Array.isArray(values) || values.length === 0) {
        return "";
      }

      const label = SKILL_GROUP_LABELS[key] ?? key.replace(/_/g, " ");
      if (seenLabels.has(label)) {
        return "";
      }
      seenLabels.add(label);

      return `<div class="skill-group"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(values.join(", "))}</div>`;
    })
    .filter(Boolean)
    .join("");

  if (!items) {
    return "";
  }

  return `<section><h2>TECHNICAL SKILLS</h2>${items}</section>`;
}

function renderJobBlock(job: Resume["experience"][number]): string {
  const bullets = job.achievements
    .map((achievement) => renderBulletItem(formatAchievement(achievement)))
    .join("");

  return `
    <div class="job">
      <div class="job-header">
        <div class="job-title-line">
          ${escapeHtml(job.position)}<span class="job-company"> | ${escapeHtml(job.company)}</span>
        </div>
        <div class="job-meta">${formatDateRange(job.start_date, job.end_date, job.location)}</div>
      </div>
      <ul class="bullet-list">${bullets}</ul>
    </div>
  `;
}

function renderExperience(experience: Resume["experience"]): string {
  const jobs = experience.map(renderJobBlock).join("");
  return `<section><h2>PROFESSIONAL EXPERIENCE</h2>${jobs}</section>`;
}

function renderProjects(projects?: Resume["projects"]): string {
  if (!projects || projects.length === 0) {
    return "";
  }

  const items = projects
    .map((project) => {
      const desc = formatInlineMarkdown(project.description);
      const link = project.link
        ? ` <span class="project-link">[<a href="${escapeHtml(project.link)}" target="_blank">${escapeHtml(project.link.replace(/^https?:\/\//, ""))}</a>]</span>`
        : "";
      return renderBulletItem(`<strong>${escapeHtml(project.name)}</strong> — ${desc}${link}`);
    })
    .join("");

  return `<section><h2>KEY PROJECTS</h2><ul class="bullet-list">${items}</ul></section>`;
}

function renderCertifications(certifications?: Resume["certifications"]): string {
  if (!certifications || certifications.length === 0) {
    return "";
  }

  const items = certifications
    .map((cert) => {
      const issuer = cert.issuer ? ` — ${escapeHtml(cert.issuer)}` : "";
      const year = cert.year ? ` (${escapeHtml(String(cert.year))})` : "";
      const desc = cert.description
        ? ` — ${formatInlineMarkdown(cert.description)}`
        : "";
      return renderBulletItem(`<strong>${escapeHtml(cert.name)}</strong>${issuer}${year}${desc}`);
    })
    .join("");

  return `<section><h2>CERTIFICATIONS</h2><ul class="bullet-list">${items}</ul></section>`;
}

function renderEducation(education: Resume["education"]): string {
  const items = education
    .map((item) => {
      const location = item.location ? ` | ${escapeHtml(item.location)}` : "";
      return `
        <div class="education-item">
          <div class="education-line">
            <div>
              <span class="education-degree">${escapeHtml(item.degree)}</span><span class="education-institution"> | ${escapeHtml(item.institution)}</span>
            </div>
            <div class="job-meta">${location ? escapeHtml(item.location ?? "") + " | " : ""}${item.start_year} – ${item.end_year}</div>
          </div>
        </div>
      `;
    })
    .join("");

  return `<section><h2>EDUCATION</h2>${items}</section>`;
}

function renderContent(resume: Resume): string {
  const { professional_summary } = resume;

  return `
    ${renderDocumentHeader(resume.personal_info)}
    <section>
      <h2>PROFESSIONAL SUMMARY</h2>
      <p class="summary">${escapeHtml(professional_summary)}</p>
    </section>
    ${renderSkills(resume.skills)}
    ${renderExperience(resume.experience)}
    ${renderProjects(resume.projects)}
    ${renderEducation(resume.education)}
    ${renderCertifications(resume.certifications)}
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
