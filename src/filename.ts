const OUTPUT_PREFIX = "Elias";

export function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

export function buildResumeBasename(roleTitle: string): string {
  const role = sanitizeFilenamePart(roleTitle);
  return `${OUTPUT_PREFIX}_${role}_resume`;
}

export function buildResumeOutputPaths(roleTitle: string, outputDir = "output"): {
  json: string;
  pdf: string;
  html: string;
} {
  const basename = buildResumeBasename(roleTitle);
  const dir = outputDir.replace(/[/\\]+$/, "");

  return {
    json: `${dir}/${basename}.json`,
    pdf: `${dir}/${basename}.pdf`,
    html: `${dir}/${basename}.html`,
  };
}

export { OUTPUT_PREFIX };
