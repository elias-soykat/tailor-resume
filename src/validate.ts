import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Resume } from "./types.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function validateResumeStructure(resume: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!resume || typeof resume !== "object") {
    return { valid: false, errors: ["Resume must be a JSON object."], warnings };
  }

  const data = resume as Partial<Resume>;

  if (!data.personal_info || typeof data.personal_info !== "object") {
    errors.push("Missing personal_info.");
  } else {
    const requiredFields: Array<keyof Resume["personal_info"]> = [
      "full_name",
      "title",
      "email",
      "location",
    ];
    for (const field of requiredFields) {
      if (!isNonEmptyString(data.personal_info[field])) {
        errors.push(`personal_info.${field} is required.`);
      }
    }
  }

  if (!isNonEmptyString(data.professional_summary)) {
    errors.push("professional_summary is required.");
  }

  if (!data.skills || typeof data.skills !== "object") {
    errors.push("skills is required.");
  } else {
    const hasSkillGroup = Object.values(data.skills).some(
      (value) => Array.isArray(value) && value.length > 0
    );
    if (!hasSkillGroup) {
      errors.push("skills must include at least one non-empty group.");
    }
  }

  if (!Array.isArray(data.experience) || data.experience.length === 0) {
    errors.push("experience must include at least one role.");
  } else {
    data.experience.forEach((job, index) => {
      if (!isNonEmptyString(job.company)) {
        errors.push(`experience[${index}].company is required.`);
      }
      if (!isNonEmptyString(job.position)) {
        errors.push(`experience[${index}].position is required.`);
      }
      if (!Array.isArray(job.achievements) || job.achievements.length === 0) {
        errors.push(`experience[${index}] must include at least one achievement.`);
      }
    });
  }

  if (!Array.isArray(data.education) || data.education.length === 0) {
    errors.push("education must include at least one entry.");
  }

  if (data.keywords && !isStringArray(data.keywords)) {
    warnings.push("keywords should be an array of strings.");
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateAgainstMaster(
  tailored: Resume,
  masterPath: string
): ValidationResult {
  const structure = validateResumeStructure(tailored);
  const errors = [...structure.errors];
  const warnings = [...structure.warnings];

  let master: Resume;
  try {
    master = JSON.parse(readFileSync(resolve(masterPath), "utf-8")) as Resume;
  } catch {
    warnings.push(`Could not read master resume at ${masterPath}; skipped fact-check.`);
    return { valid: structure.valid, errors, warnings };
  }

  const masterCompanies = new Set(
    master.experience.map((job) => job.company.trim().toLowerCase())
  );

  for (const job of tailored.experience) {
    const company = job.company.trim().toLowerCase();
    if (!masterCompanies.has(company)) {
      warnings.push(
        `Company "${job.company}" is not present in master_resume.json. Verify this is not fabricated.`
      );
    }
  }

  const masterInstitutions = new Set(
    master.education.map((item) => item.institution.trim().toLowerCase())
  );

  for (const item of tailored.education) {
    const institution = item.institution.trim().toLowerCase();
    if (!masterInstitutions.has(institution)) {
      warnings.push(
        `Institution "${item.institution}" is not present in master_resume.json. Verify this is not fabricated.`
      );
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function printValidationResult(result: ValidationResult): void {
  for (const error of result.errors) {
    console.error(`ERROR: ${error}`);
  }
  for (const warning of result.warnings) {
    console.warn(`WARN: ${warning}`);
  }
}
