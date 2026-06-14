# Tailor Resume

Generate ATS-friendly PDF resumes tailored to job descriptions from your master resume data.

## One-time setup

```bash
npm install
```

PDF generation uses your locally installed **Google Chrome** or **Microsoft Edge** (no bundled browser download). If needed, set:

```bash
set PUPPETEER_EXECUTABLE_PATH=C:\Path\To\chrome.exe
```

## Usage (recommended)

Open a chat in this workspace and paste a job description:

> Generate my tailored resume PDF for this job: [paste job description]

The agent will tailor [master_resume.json](master_resume.json), save a JSON file under `output/`, and generate a PDF you can apply with immediately.

## Manual PDF generation

If you already have a tailored JSON file:

```bash
npm run generate -- --input output/Elias_Senior_Software_Engineer_resume.json --output output/Elias_Senior_Software_Engineer_resume.pdf
```

Generated files always use the `Elias_{RoleTitle}_resume` naming pattern.

## Project structure

| Path | Purpose |
|------|---------|
| `master_resume.json` | Source of truth for all resume facts |
| `output/` | Generated tailored JSON + PDF files |
| `src/` | PDF generation CLI |
| `templates/` | ATS-friendly HTML resume template |
| `.cursor/skills/tailor-resume/` | Agent workflow for JD → PDF |
