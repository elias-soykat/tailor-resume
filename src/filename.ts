const OUTPUT_PREFIX = "Elias";

export function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

export function buildApplicationBasename(roleTitle: string): string {
  return `${OUTPUT_PREFIX}_${sanitizeFilenamePart(roleTitle)}`;
}

export function buildApplicationFolder(
  companyName: string,
  outputDir = "output"
): string {
  const dir = outputDir.replace(/[/\\]+$/, "");
  return `${dir}/${sanitizeFilenamePart(companyName)}`;
}

export function buildApplicationPaths(
  companyName: string,
  roleTitle: string,
  outputDir = "output"
) {
  const folder = buildApplicationFolder(companyName, outputDir);
  const base = buildApplicationBasename(roleTitle);

  return {
    folder,
    resume: {
      json: `${folder}/${base}_resume.json`,
      pdf: `${folder}/${base}_resume.pdf`,
    },
    coverLetter: {
      json: `${folder}/${base}_cover_letter.json`,
      pdf: `${folder}/${base}_cover_letter.pdf`,
    },
  };
}

export { OUTPUT_PREFIX };
