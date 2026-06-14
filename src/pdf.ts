import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

export function resolveChromeExecutable(): string | undefined {
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

export async function generatePdf(
  html: string,
  outputPath: string
): Promise<void> {
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
        top: "11mm",
        right: "14mm",
        bottom: "14mm",
        left: "14mm",
      },
    });
  } finally {
    await browser.close();
  }
}
