# Tailor Resume

Tailor your **resume (CV)** and **cover letter** to any job description, then export professional PDFs — built for developers who apply to many roles and want consistent, ATS-friendly documents without starting from scratch each time.

Works great with **Cursor**, **Claude Code**: paste a job description in chat and let the agent tailor your content from a single master resume file.

## Features

- One **master resume** JSON file as the source of truth
- Agent-driven tailoring to job descriptions (no external LLM API key required in Cursor, Claude)
- Matching **resume + cover letter** PDFs with the same modern European layout
- Output organized by **company name** under `output/`
- Validation to reduce fabricated experience in tailored content
- A4 PDFs via local Chrome/Edge (Puppeteer)

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/elias-soykat/tailor-resume
cd tailor-resume
npm install
```

### 2. Create your master resume

Copy the example file and replace it with your real career data:

```bash
cp master_resume.example.json master_resume.json
```

Edit `master_resume.json` with your details. **Do not commit this file** — it is gitignored so your personal data stays local.

### 3. Generate PDFs (manual test)

After you (or the agent) create tailored JSON files in an application folder:

```bash
npm run generate -- --dir output/Acme_Corp
```

Requires **Google Chrome** or **Microsoft Edge** installed locally.

Optional on Windows if the browser is not detected:

```bash
set PUPPETEER_EXECUTABLE_PATH=C:\Path\To\chrome.exe
```

## Usage with Cursor, Claude Code

1. Open this project in Cursor or Claude Code.
2. Ensure `npm install` has been run once.
3. Paste a job description in chat, for example:

   > Generate my tailored resume and cover letter for this job: [paste job description]

4. The agent reads `.cursor/skills/tailor-resume/SKILL.md`, tailors from `master_resume.json`, saves files under `output/{CompanyName}/`, and runs the PDF generator.

## Updating `master_resume.json`

This file is your **only source of truth**. The agent must not invent facts beyond what you store here.

| Section | What to include |
|---------|-----------------|
| `personal_info` | Name, title, email, location, LinkedIn, GitHub |
| `professional_summary` | Default summary (rewritten per job when tailoring) |
| `skills` | Grouped skills: `languages`, `frontend`, `backend`, `tools_ops` |
| `experience` | Jobs with dates, company, location, and `achievements` bullets |
| `education` | Degrees and institutions |
| `keywords` | Optional ATS keywords for tailoring |

See [master_resume.example.json](master_resume.example.json) for the full schema with sample (fictional) data.

**Tips:**

- Keep achievements factual and metric-backed where possible.
- Add new roles here first, then tailor — do not edit PDFs directly.
- File names in output use your **first name** from `personal_info.full_name` (e.g. `Alex_Senior_Engineer_resume.pdf`).

## Output structure

Each job application gets its own folder named after the **company**:

```text
output/
  Acme_Corp/
    Alex_Senior_Full_Stack_Engineer_resume.json
    Alex_Senior_Full_Stack_Engineer_resume.pdf
    Alex_Senior_Full_Stack_Engineer_cover_letter.json
    Alex_Senior_Full_Stack_Engineer_cover_letter.pdf
```

The `output/` directory is gitignored. Only your local machine keeps generated applications.

## Manual commands

Generate both resume and cover letter PDFs from a folder:

```bash
npm run generate -- --dir output/Acme_Corp
```

Generate a single file:

```bash
npm run generate -- --input output/Acme_Corp/Alex_Senior_Engineer_resume.json --output output/Acme_Corp/Alex_Senior_Engineer_resume.pdf
```

Cover letter only:

```bash
npm run generate -- --input output/Acme_Corp/Alex_Senior_Engineer_cover_letter.json --output output/Acme_Corp/Alex_Senior_Engineer_cover_letter.pdf --type cover-letter
```

## Project structure

| Path | Purpose |
|------|---------|
| `master_resume.example.json` | Sample schema + fictional data (safe to commit) |
| `master_resume.json` | Your real resume data (**gitignored**) |
| `output/` | Generated applications per company (**gitignored**) |
| `src/` | PDF generation CLI and renderers |
| `templates/` | HTML templates for resume and cover letter |
| `.cursor/skills/tailor-resume/` | Cursor agent workflow for JD → PDF |
| `.claude/skills/tailor-resume/` | Claude Code agent workflow for JD → PDF |

## Privacy

- Commit **`master_resume.example.json`**, not your real `master_resume.json`.
- Generated files under `output/` are never committed.
- Before publishing, search the repo for your email, phone, and employer names if you added custom content elsewhere.
