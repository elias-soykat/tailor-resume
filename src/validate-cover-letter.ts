import { CoverLetter } from "./types.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateCoverLetterStructure(letter: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!letter || typeof letter !== "object") {
    return { valid: false, errors: ["Cover letter must be a JSON object."], warnings };
  }

  const data = letter as Partial<CoverLetter>;

  if (!data.personal_info || typeof data.personal_info !== "object") {
    errors.push("Missing personal_info.");
  } else if (!isNonEmptyString(data.personal_info.full_name)) {
    errors.push("personal_info.full_name is required.");
  }

  if (!isNonEmptyString(data.date)) {
    errors.push("date is required.");
  }

  if (!isNonEmptyString(data.salutation)) {
    errors.push("salutation is required.");
  }

  if (!Array.isArray(data.paragraphs) || data.paragraphs.length === 0) {
    errors.push("paragraphs must include at least one paragraph.");
  } else if (data.paragraphs.some((paragraph) => !isNonEmptyString(paragraph))) {
    errors.push("Each paragraph must be a non-empty string.");
  }

  if (!isNonEmptyString(data.closing)) {
    errors.push("closing is required.");
  }

  if (!isNonEmptyString(data.signature_name)) {
    errors.push("signature_name is required.");
  }

  if (!data.target_job?.company && !data.recipient?.company) {
    warnings.push("No target company specified in target_job or recipient.");
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
