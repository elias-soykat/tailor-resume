export function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

export function getNamePrefix(fullName: string): string {
  const firstName = fullName.trim().split(/\s+/)[0] ?? "Candidate";
  return sanitizeFilenamePart(firstName);
}

export function buildApplicationBasename(
  roleTitle: string,
  namePrefix = "Candidate"
): string {
  return `${namePrefix}_${sanitizeFilenamePart(roleTitle)}`;
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
  namePrefix = "Candidate",
  outputDir = "output"
) {
  const folder = buildApplicationFolder(companyName, outputDir);
  const base = buildApplicationBasename(roleTitle, namePrefix);

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
