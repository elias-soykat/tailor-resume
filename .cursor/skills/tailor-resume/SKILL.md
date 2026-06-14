---
name: tailor-resume
description: >-
  Tailor master_resume.json to a pasted job description and generate an
  ATS-friendly PDF resume. Use when the user shares a job description, asks
  for a tailored resume, wants to apply for a job, or requests resume PDF
  generation from this project.
---

# Tailor Resume

Generate a job-specific resume PDF from `master_resume.json` and a pasted job description.

## Prerequisites

Ensure dependencies are installed once:

```bash
npm install
```

## Workflow

When the user provides a job description:

1. Read [master_resume.json](../../master_resume.json) — this is the **only** source of truth for facts.
2. Analyze the job description for:
   - Role title and seniority
   - Company name (if mentioned)
   - Required and preferred skills
   - Domain keywords (fintech, SaaS, microservices, etc.)
   - Responsibilities that map to existing experience
3. Create a tailored resume JSON using the same schema as `master_resume.json`, plus optional metadata:

```json
{
  "target_job": {
    "company": "Acme Corp",
    "title": "Senior Full Stack Engineer",
    "tailored_at": "2026-06-14"
  }
}
```

4. Save the tailored JSON using this **required filename pattern**:

   `output/Elias_{RoleTitle}_resume.json`

   - Always start with `Elias_` (first name from master resume)
   - Use the target job title for `{RoleTitle}`, not the company name
   - Sanitize: alphanumeric and underscores only
   - Examples:
     - `output/Elias_Senior_Software_Engineer_resume.json`
     - `output/Elias_Frontend_Developer_resume.json`
     - `output/Elias_Senior_Full_Stack_Engineer_resume.json`

5. Generate the PDF:

```bash
npm run generate -- --input output/Elias_{RoleTitle}_resume.json --output output/Elias_{RoleTitle}_resume.pdf
```

6. Tell the user:
   - Full path to the PDF
   - What was emphasized (skills, domains, achievements)
   - Any validation warnings from the generator

## Tailoring rules

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

## Achievement rephrasing

When rephrasing bullets:

- Start with strong action verbs (Built, Architected, Delivered, Optimized)
- Weave in JD keywords only where they truthfully apply to the original achievement
- Preserve original metrics exactly (e.g., "80%", "100K+", "99.9%")

## Skill tailoring examples

**JD emphasizes:** React, Next.js, TypeScript, real-time systems

→ Lead frontend skills with React, Next.js, TypeScript; prioritize NEXT Ventures achievements about WebSockets and trading dashboards.

**JD emphasizes:** Kafka, microservices, NestJS, PostgreSQL

→ Lead backend skills; prioritize TechnoNext achievements about Kafka, gRPC, BullMQ, and order lifecycle systems.

## Validation

The generator validates structure and warns if companies or institutions are not in `master_resume.json`. If warnings appear, fix the tailored JSON before telling the user the resume is ready.

## Example user prompt

> Generate my tailored resume PDF for this job:
>
> [job description pasted here]

## Output checklist

Before finishing, confirm:

- [ ] Tailored JSON saved under `output/` as `Elias_{RoleTitle}_resume.json`
- [ ] PDF generated as `Elias_{RoleTitle}_resume.pdf`
- [ ] No fabricated facts
- [ ] Summary and top bullets align with JD priorities
- [ ] User has the PDF path for immediate application
