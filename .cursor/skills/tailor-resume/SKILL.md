---
name: tailor-resume
description: >-
  Tailor master_resume.json to a pasted job description and generate an
  ATS-friendly PDF resume and matching cover letter. Use when the user shares
  a job description, asks for a tailored resume, cover letter, or wants to
  apply for a job from this project.
---

# Tailor Resume

Generate a job-specific resume PDF and cover letter PDF from `master_resume.json` and a pasted job description.

## Prerequisites

Ensure dependencies are installed once:

```bash
npm install
```

If `master_resume.json` does not exist, tell the user to copy the example first:

```bash
cp master_resume.example.json master_resume.json
```

## Workflow

When the user provides a job description:

1. Read [master_resume.json](../../master_resume.json) — this is the **only** source of truth for facts.
2. Derive the output name prefix from the user's first name in `personal_info.full_name` (e.g. `Alex` from `Alex Morgan`).
3. Analyze the job description for:
   - Role title and seniority
   - Company name (if mentioned)
   - Required and preferred skills
   - Domain keywords (fintech, SaaS, microservices, etc.)
   - Responsibilities that map to existing experience
4. Create a tailored resume JSON using the same schema as `master_resume.json`, plus optional metadata:

```json
{
  "target_job": {
    "company": "Acme Corp",
    "title": "Senior Full Stack Engineer",
    "tailored_at": "2026-06-14"
  }
}
```

5. Create a matching cover letter JSON in the **same application folder**. Use the user's real contact details from `master_resume.json`:

```json
{
  "target_job": {
    "company": "Acme Corp",
    "title": "Senior Full Stack Engineer",
    "tailored_at": "2026-06-14"
  },
  "personal_info": {
    "full_name": "Alex Morgan",
    "title": "Senior Full Stack Engineer",
    "email": "alex.morgan@example.com",
    "location": "Berlin, Germany",
    "linkedin": "alex-morgan-dev",
    "github": "alexmorgan"
  },
  "date": "14 June 2026",
  "recipient": {
    "company": "Acme Corp",
    "title": "Hiring Team"
  },
  "salutation": "Dear Hiring Manager,",
  "paragraphs": [
    "Opening paragraph: role interest and fit.",
    "Body paragraph: relevant experience mapped to JD.",
    "Body paragraph: technical strengths and collaboration.",
    "Closing paragraph: enthusiasm and availability."
  ],
  "closing": "Kind regards,",
  "signature_name": "Alex Morgan"
}
```

6. Save both files in an application folder named after the **company**:

   `output/{CompanyName}/`

   Files inside the folder:
   - `{FirstName}_{RoleTitle}_resume.json`
   - `{FirstName}_{RoleTitle}_cover_letter.json`

   Rules:
   - Folder name = sanitized company name from the job description
   - File prefix = user's first name from `master_resume.json`
   - Sanitize folder/file names: alphanumeric and underscores only
   - Examples:
     - `output/Acme_Corp/Alex_Senior_Full_Stack_Engineer_resume.json`
     - `output/Acme_Corp/Alex_Senior_Full_Stack_Engineer_cover_letter.json`

7. Generate both PDFs:

```bash
npm run generate -- --dir output/{CompanyName}
```

8. Tell the user:
   - Full path to the application folder
   - Paths to the resume PDF and cover letter PDF
   - What was emphasized (skills, domains, achievements)
   - Any validation warnings from the generator

## Cover letter rules

### Must do

- Keep tone professional, concise, and modern (European business English)
- 3–4 paragraphs, about one A4 page
- Reference the target company and role naturally
- Highlight 2–3 truthful achievements from `master_resume.json` that match the JD
- Mirror JD keywords where they truthfully apply
- Use the same header contact details as the resume

### Must not do

- **Never invent** employers, projects, degrees, or metrics
- **Never copy** the resume verbatim — complement it with narrative context
- **Never exceed** one page

## Resume tailoring rules

### Must do

- Rewrite `professional_summary` to mirror JD language and priorities
- Adjust `personal_info.title` to closely match the target role when reasonable
- Reorder skills within each group so JD-relevant items appear first
- Prioritize skill groups: Languages, Frontend, Backend, Tools & Ops (matching master resume format)
- Use European section labels in output: Professional Profile, Skills, Professional Experience, Education
- Select and reorder achievements per role; rephrase bullets to include JD keywords naturally
- Keep achievement text as full inline sentences (metrics included in the bullet, not separate fields)
- Keep recent roles detailed, older roles concise

### Must not do

- **Never invent** companies, job titles, dates, degrees, technologies, or metrics
- **Never add** experience, projects, or certifications not in `master_resume.json`
- **Never change** employment dates or company names
- **Never fabricate** impact numbers — only use metrics already present in master achievements

### Bullet limits (keep PDF to ~1–2 pages)

| Role recency | Max bullets |
|--------------|-------------|
| Most recent | 4–5 |
| Second role  | 3–4 |
| Third role   | 2–3 |
| Oldest role  | 2 |

## Validation

The generator validates resume structure against `master_resume.json` and validates cover letter structure separately. If warnings appear, fix the JSON before telling the user the application pack is ready.

## Example user prompt

> Generate my tailored resume and cover letter for this job:
>
> [job description pasted here]

## Output checklist

Before finishing, confirm:

- [ ] Application folder created under `output/{CompanyName}/`
- [ ] Resume JSON and cover letter JSON saved in the company folder
- [ ] Both PDFs generated via `npm run generate -- --dir output/{CompanyName}`
- [ ] No fabricated facts
- [ ] Summary, bullets, and cover letter align with JD priorities
- [ ] User has folder path for immediate application
