import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { renderResumeHtml } from "./render.js";
import { Resume } from "./types.js";
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
}

function parseArgs(argv: string[]): CliOptions {
  let input = "";
  let output = "";
  let master = defaultMasterPath;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--input" && next) {
      input = next;
      i += 1;
    } else if (arg === "--output" && next) {
      output = next;
      i += 1;
    } else if (arg === "--master" && next) {
      master = resolve(next);
      i += 1;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  if (!input || !output) {
    printHelp();
    process.exit(1);
  }

  return {
    input: resolve(input),
    output: resolve(output),
    master,
  };
}

function printHelp(): void {
  console.log(`Usage:
  npm run generate -- --input <tailored.json> --output <resume.pdf> [--master master_resume.json]

Example:
  npm run generate -- --input output/Acme_Senior_Engineer_resume.json --output output/Acme_Senior_Engineer_resume.pdf
`);
}

function loadResume(path: string): Resume {
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw) as Resume;
}

function resolveChromeExecutable(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ];

  return candidates.find((path) => existsSync(path));
}

async function generatePdf(html: string, outputPath: string): Promise<void> {
  mkdirSync(dirname(outputPath), { recursive: true });

  const executablePath = resolveChromeExecutable();
  if (!executablePath) {
    throw new Error(
      "Chrome or Edge not found. Install Google Chrome or set PUPPETEER_EXECUTABLE_PATH."
    );
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "18mm",
        bottom: "20mm",
        left: "18mm",
      },
    });
  } finally {
    await browser.close();
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const resume = loadResume(options.input);
  const validation = validateAgainstMaster(resume, options.master);
  printValidationResult(validation);

  if (!validation.valid) {
    process.exit(1);
  }

  const html = renderResumeHtml(resume);
  const htmlPath = options.output.replace(/\.pdf$/i, ".html");
  writeFileSync(htmlPath, html, "utf-8");
  await generatePdf(html, options.output);

  console.log(`Generated PDF: ${options.output}`);
  console.log(`Preview HTML: ${htmlPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
