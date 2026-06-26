# Tailor Resume

Generate ATS-friendly PDF resumes and cover letters tailored to job descriptions from your master resume data.

## One-time setup

```bash
npm install
```

PDF generation uses your locally installed **Google Chrome** or **Microsoft Edge**. If needed, set:

```bash
set PUPPETEER_EXECUTABLE_PATH=C:\Path\To\chrome.exe
```

## Usage (recommended)

Open a chat in this workspace and paste a job description:

> Generate my tailored resume and cover letter for this job and resume will be 100% fit with this below job position :

The agent will tailor [master_resume.json](master_resume.json), save files under a company folder in `output/`, and generate PDFs you can apply with immediately.

## Output structure

Each application gets a folder named after the **company**:

```text
output/
  Scytale/
    Elias_Senior_Full_Stack_Developer_resume.json
    Elias_Senior_Full_Stack_Developer_resume.pdf
    Elias_Senior_Full_Stack_Developer_cover_letter.json
    Elias_Senior_Full_Stack_Developer_cover_letter.pdf

  weDevs/
    Elias_Senior_Software_Engineer_resume.json
    Elias_Senior_Software_Engineer_resume.pdf
    Elias_Senior_Software_Engineer_cover_letter.json
    Elias_Senior_Software_Engineer_cover_letter.pdf
```

## Manual PDF generation

Generate both documents from an application folder:

```bash
npm run generate -- --dir output/Scytale
```

## Project structure

| Path | Purpose |
|------|---------|
| `master_resume.json` | Source of truth for all resume facts |
| `output/{CompanyName}/` | Tailored resume + cover letter per job |
| `src/` | PDF generation CLI |
| `templates/` | Resume and cover letter HTML templates |
| `.cursor/skills/tailor-resume/` | Agent workflow for JD → PDF |
