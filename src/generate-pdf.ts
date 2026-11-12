import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
} from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderCoverLetterHtml } from "./render-cover-letter.js";
import { renderResumeHtml } from "./render.js";
import { generatePdf } from "./pdf.js";
import { CoverLetter, Resume } from "./types.js";
import {
  printValidationResult as printCoverLetterValidation,
  validateCoverLetterStructure,
} from "./validate-cover-letter.js";
import {
  printValidationResult,
  validateAgainstMaster,
} from "./validate.js";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultMasterPath = resolve(projectRoot, "master_resume.json");

interface CliOptions {
  input: string;
  output: string;
  master: string;
  dir: string;
  type: "resume" | "cover-letter" | "auto";
  strict: boolean;
  validateOnly: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  let input = "";
  let output = "";
  let master = defaultMasterPath;
  let dir = "";
  let type: CliOptions["type"] = "auto";
  let strict = false;
  let validateOnly = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--input" && next) {
      input = next;
      i += 1;
    } else if (arg === "--output" && next) {
      output = next;
      i += 1;
    } else if (arg === "--dir" && next) {
      dir = next;
      i += 1;
    } else if (arg === "--master" && next) {
      master = resolve(next);
      i += 1;
    } else if (arg === "--type" && next) {
      if (next === "resume" || next === "cover-letter") {
        type = next;
      }
      i += 1;
    } else if (arg === "--strict") {
      strict = true;
    } else if (arg === "--validate-only") {
      validateOnly = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return {
    input: input ? resolve(input) : "",
    output: output ? resolve(output) : "",
    master,
    dir: dir ? resolve(dir) : "",
    type,
    strict,
    validateOnly,
  };
}

function printHelp(): void {
  console.log(`Usage:
  npm run generate -- --dir output/Scytale
  npm run generate -- --input <file.json> --output <file.pdf> [--type resume|cover-letter] [--strict] [--validate-only]

Examples:
  npm run generate -- --dir output/Scytale
  npm run validate -- --dir output/Elias_Soykat
  npm run generate -- --input output/Scytale/Elias_Senior_Software_Engineer_resume.json --output output/Scytale/Elias_Senior_Software_Engineer_resume.pdf
`);
}

function detectDocumentType(path: string, explicit: CliOptions["type"]): "resume" | "cover-letter" {
  if (explicit !== "auto") {
    return explicit;
  }

  const name = basename(path).toLowerCase();
  if (name.includes("cover_letter") || name.includes("cover-letter")) {
    return "cover-letter";
  }

  return "resume";
}

async function writePdfFromJson(
  inputPath: string,
  outputPath: string,
  masterPath: string,
  type: CliOptions["type"],
  options: Pick<CliOptions, "strict" | "validateOnly">
): Promise<void> {
  const documentType = detectDocumentType(inputPath, type);
  const raw = readFileSync(inputPath, "utf-8");

  if (documentType === "cover-letter") {
    const letter = JSON.parse(raw) as CoverLetter;
    const validation = validateCoverLetterStructure(letter);
    printCoverLetterValidation(validation);
    if (!validation.valid || (options.strict && validation.warnings.length > 0)) {
      throw new Error("Cover letter validation failed.");
    }

    if (options.validateOnly) {
      console.log(`Validated cover letter JSON: ${inputPath}`);
      return;
    }

    mkdirSync(dirname(outputPath), { recursive: true });
    const html = renderCoverLetterHtml(letter);
    await generatePdf(html, outputPath);
    console.log(`Generated cover letter PDF: ${outputPath}`);
    return;
  }

  const resume = JSON.parse(raw) as Resume;
  const validation = validateAgainstMaster(resume, masterPath);
  printValidationResult(validation);
  if (!validation.valid || (options.strict && validation.warnings.length > 0)) {
    throw new Error("Resume validation failed.");
  }

  if (options.validateOnly) {
    console.log(`Validated resume JSON: ${inputPath}`);
    return;
  }

  mkdirSync(dirname(outputPath), { recursive: true });
  const html = renderResumeHtml(resume);
  await generatePdf(html, outputPath);
  console.log(`Generated resume PDF: ${outputPath}`);
}

function findApplicationJsonFiles(dir: string): {
  resume?: string;
  coverLetter?: string;
} {
  const files = readdirSync(dir).filter((file) => file.endsWith(".json"));
  const resume = files.find((file) => file.includes("_resume.json"));
  const coverLetter = files.find((file) => file.includes("_cover_letter.json"));

  return {
    resume: resume ? resolve(dir, resume) : undefined,
    coverLetter: coverLetter ? resolve(dir, coverLetter) : undefined,
  };
}

async function generateApplicationFolder(
  dir: string,
  masterPath: string,
  options: Pick<CliOptions, "strict" | "validateOnly">
): Promise<void> {
  if (!existsSync(dir)) {
    throw new Error(`Application folder not found: ${dir}`);
  }

  const files = findApplicationJsonFiles(dir);

  if (!files.resume && !files.coverLetter) {
    throw new Error(
      `No *_resume.json or *_cover_letter.json files found in ${dir}`
    );
  }

  if (files.resume) {
    const pdfPath = files.resume.replace(/\.json$/i, ".pdf");
    await writePdfFromJson(files.resume, pdfPath, masterPath, "resume", options);
  }

  if (files.coverLetter) {
    const pdfPath = files.coverLetter.replace(/\.json$/i, ".pdf");
    await writePdfFromJson(
      files.coverLetter,
      pdfPath,
      masterPath,
      "cover-letter",
      options
    );
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const runOptions = { strict: options.strict, validateOnly: options.validateOnly };

  if (options.dir) {
    await generateApplicationFolder(options.dir, options.master, runOptions);
    if (!options.validateOnly) {
      console.log(`Application folder ready: ${options.dir}`);
    }
    return;
  }

  if (!options.input || (!options.output && !options.validateOnly)) {
    printHelp();
    process.exit(1);
  }

  await writePdfFromJson(
    options.input,
    options.output,
    options.master,
    options.type,
    runOptions
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
