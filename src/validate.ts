import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Experience, Resume } from "./types.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const SYNTHETIC_ISSUER_PATTERN =
  /\b(?:verified coursework|specialization certificate|engineering best practices|self-study)\b/i;

const SKILL_ALIASES: Record<string, string> = {
  react: "reactjs",
  reactjs: "reactjs",
  next: "nextjs",
  nextjs: "nextjs",
  node: "nodejs",
  nodejs: "nodejs",
  express: "expressjs",
  expressjs: "expressjs",
  postgres: "postgresql",
  postgresql: "postgresql",
  "rest api": "rest apis",
  "rest apis": "rest apis",
  i18next: "i18next",
  i18n: "i18next",
  "apache kafka": "kafka",
  kafka: "kafka",
  websockets: "websocket",
  websocket: "websocket",
  microservices: "microservice",
  microservice: "microservice",
};

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "using",
  "across",
  "into",
  "from",
  "that",
  "this",
  "while",
  "via",
  "over",
  "built",
  "high",
  "real",
  "time",
  "system",
  "systems",
  "platform",
]);

const HIGH_RISK_CLAIMS = [
  "latency",
  "zero-downtime",
  "zero downtime",
  "sub-second",
  "subsecond",
  "ci/cd",
  "kubernetes",
  "terraform",
  "github actions",
  "jenkins",
  "tdd",
  "code review",
  "mentored",
  "mentoring",
  "ai workflow",
  "agentic",
  "microservices",
];

const UNVERIFIED_TECH_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "Python", pattern: /\bpython\b/i },
  { label: "React Native", pattern: /\breact\s+native\b/i },
  { label: "Vite", pattern: /\bvite\b/i },
  { label: "TanStack Query", pattern: /\btanstack\b/i },
  { label: "Apollo GraphQL", pattern: /\bapollo\b/i },
  { label: "pgvector", pattern: /\bpgvector\b/i },
  { label: "Prisma", pattern: /\bprisma\b/i },
  { label: "Drizzle ORM", pattern: /\bdrizzle\b/i },
  { label: "LangGraph", pattern: /\blanggraph\b/i },
  { label: "CrewAI", pattern: /\bcrewai\b/i },
  { label: "MCP", pattern: /\bmcp\b/i },
  { label: "Deepgram", pattern: /\bdeepgram\b/i },
  { label: "ElevenLabs", pattern: /\belevenlabs\b/i },
  { label: "LiveKit", pattern: /\blivekit\b/i },
  { label: "WebRTC", pattern: /\bwebrtc\b/i },
  { label: "FFmpeg", pattern: /\bffmpeg\b/i },
  { label: "AWS Lambda", pattern: /\blambda\b/i },
  { label: "DynamoDB", pattern: /\bdynamodb\b/i },
  { label: "Turborepo", pattern: /\bturborepo\b/i },
  { label: "Kubernetes", pattern: /\bkubernetes|k8s\b/i },
  { label: "Terraform", pattern: /\bterraform\b/i },
];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizeToken(value: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/\.js\b/g, "js")
    .replace(/[^a-z0-9+#/&\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return SKILL_ALIASES[cleaned] ?? cleaned;
}

function splitCompoundSkill(skill: string): {
  full: string;
  base: string;
  subTokens: string[];
} {
  const match = skill.match(/^([^(]+)\(([^)]+)\)$/);
  if (!match) {
    return { full: skill, base: skill, subTokens: [] };
  }

  const base = match[1].trim();
  const inner = match[2].trim();
  const subTokens = inner.includes(",")
    ? inner.split(",").map((part) => part.trim()).filter(Boolean)
    : [];

  return { full: skill, base, subTokens };
}

function collectExperienceText(experience: Experience[] = []): string {
  return experience
    .map((job) => {
      const techs = (job.technologies ?? []).join(" ");
      const ach = (job.achievements ?? [])
        .map((a) => `${a.description} ${a.impact ?? ""}`)
        .join(" ");
      return `${job.position} ${job.company} ${techs} ${ach}`;
    })
    .join(" ");
}

function buildTextCorpus(resume: Resume): {
  declaredSkills: Set<string>;
  declaredText: string;
  evidenceText: string;
} {
  const declaredSkills = new Set<string>();

  for (const group of Object.values(resume.skills ?? {})) {
    if (!Array.isArray(group)) continue;
    for (const item of group) {
      declaredSkills.add(normalizeToken(item));
      const { base, subTokens } = splitCompoundSkill(item);
      declaredSkills.add(normalizeToken(base));
      for (const sub of subTokens) {
        declaredSkills.add(normalizeToken(sub));
        declaredSkills.add(normalizeToken(`${base} ${sub}`));
      }
    }
  }

  for (const kw of resume.keywords ?? []) {
    declaredSkills.add(normalizeToken(kw));
  }

  for (const job of resume.experience ?? []) {
    for (const tech of job.technologies ?? []) {
      declaredSkills.add(normalizeToken(tech));
    }
  }

  const expText = collectExperienceText(resume.experience);
  const projText = (resume.projects ?? [])
    .map(
      (p) =>
        `${p.name} ${p.description} ${(p.highlights ?? []).join(" ")} ${(p.technologies ?? []).join(" ")}`
    )
    .join(" ");

  const evidenceText = normalizeText(`${expText} ${projText}`);
  const declaredText = normalizeText(
    `${resume.professional_summary ?? ""} ${expText} ${projText} ${Array.from(declaredSkills).join(" ")}`
  );

  return { declaredSkills, declaredText, evidenceText };
}

function hasEvidenceInText(skill: string, corpusText: string): boolean {
  const candidates = new Set<string>([
    normalizeText(skill),
    normalizeToken(skill),
  ]);

  const stripped = normalizeText(skill.replace(/\([^)]*\)/g, ""));
  if (stripped) candidates.add(stripped);

  const normalizedAlias = SKILL_ALIASES[stripped] ?? stripped;
  candidates.add(normalizedAlias);

  // Common plain-text variants inside prose/bullets
  if (normalizedAlias === "reactjs") candidates.add("react");
  if (normalizedAlias === "nextjs") candidates.add("next.js");
  if (normalizedAlias === "nodejs") candidates.add("node.js");
  if (normalizedAlias === "postgresql" || normalizedAlias === "sql") {
    candidates.add("postgresql");
  }
  if (normalizedAlias === "rest apis") candidates.add("rest api");
  if (normalizedAlias === "websocket") candidates.add("websocket");
  if (normalizedAlias === "microservice") candidates.add("microservices");
  if (stripped === "event-driven architecture") candidates.add("event-driven");
  if (normalizedAlias === "javascript es2022+" || stripped === "javascript") {
    candidates.add("javascript");
    candidates.add("react.js");
    candidates.add("node.js");
    candidates.add("typescript");
  }
  if (normalizedAlias === "observability & monitoring" || stripped === "monitoring & logging") {
    candidates.add("observability");
    candidates.add("datadog");
  }
  if (stripped === "system design" || stripped === "clean architecture") {
    if (stripped === "system design") {
      candidates.add("architecture");
      candidates.add("schema design");
      candidates.add("service boundaries");
    }
  }

  for (const cand of candidates) {
    if (!cand) continue;
    if (corpusText.includes(cand)) return true;
  }

  return false;
}

function extractMetrics(text: string): string[] {
  const cleaned = text.replace(/\bES\d+\+/gi, "");
  const patterns = [
    /\$\d+(?:,\d{3})*(?:\.\d+)?[kKmMbB]?\+?/g,
    /\b\d+(?:\.\d+)?%/g,
    /\b\d+(?:\.\d+)?[kKmMbB]?\+/g,
    /\b\d+(?:\.\d+)?\s*(?:ms|sec|secs|seconds|min|mins|minutes|hrs?|days?)\b/gi,
    /\b(?:sub-second|subsecond|zero-downtime|zero\s+downtime)\b/gi,
  ];

  const found = new Set<string>();
  for (const pattern of patterns) {
    const matches = cleaned.match(pattern) ?? [];
    for (const m of matches) {
      found.add(m.toLowerCase().replace(/\s+/g, " ").trim());
    }
  }
  return Array.from(found);
}

function significantWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
}

function validateCertifications(
  tailored: Resume,
  master: Resume,
  warnings: string[]
): void {
  const masterCertNames = new Set(
    (master.certifications ?? []).map((c) => normalizeText(c.name))
  );

  for (const cert of tailored.certifications ?? []) {
    if (!masterCertNames.has(normalizeText(cert.name))) {
      warnings.push(
        `Certification "${cert.name}" is not present in master_resume.json.`
      );
    }
    if (!isNonEmptyString(cert.issuer) || SYNTHETIC_ISSUER_PATTERN.test(cert.issuer)) {
      warnings.push(
        `Certification "${cert.name}" has a missing or generic issuer ("${cert.issuer ?? ""}").`
      );
    }
  }
}

function validateSkills(
  tailored: Resume,
  master: Resume,
  warnings: string[]
): void {
  const masterCorpus = buildTextCorpus(master);
  const tailoredExpText = normalizeText(collectExperienceText(tailored.experience));
  const combinedEvidenceText = `${masterCorpus.evidenceText} ${tailoredExpText}`;
  const seenSkills = new Set<string>();

  for (const group of Object.values(tailored.skills ?? {})) {
    if (!Array.isArray(group)) continue;
    for (const skill of group) {
      const normSkill = normalizeToken(skill);
      if (seenSkills.has(normSkill)) {
        warnings.push(`Duplicate skill "${skill}" appears in skills.`);
      }
      seenSkills.add(normSkill);

      const { base, subTokens } = splitCompoundSkill(skill);

      if (subTokens.length > 0 && !masterCorpus.declaredSkills.has(normSkill)) {
        const missingSubs = subTokens.filter(
          (sub) =>
            !masterCorpus.declaredSkills.has(normalizeToken(sub)) &&
            !masterCorpus.declaredSkills.has(normalizeToken(`${base} ${sub}`)) &&
            !hasEvidenceInText(sub, combinedEvidenceText)
        );
        if (missingSubs.length > 0) {
          warnings.push(
            `Skill "${skill}" includes unverified items (${missingSubs.join(", ")}) not in master_resume.json.`
          );
          continue;
        }
      }

      const inMaster =
        masterCorpus.declaredSkills.has(normSkill) ||
        masterCorpus.declaredSkills.has(normalizeToken(base)) ||
        hasEvidenceInText(skill, masterCorpus.declaredText);

      if (!inMaster) {
        warnings.push(
          `Skill "${skill}" is not present in master_resume.json.`
        );
      }
    }
  }
}

function validateMetrics(
  tailored: Resume,
  master: Resume,
  warnings: string[]
): void {
  const masterMetricSource = [
    master.professional_summary ?? "",
    master.years_of_experience ? `${master.years_of_experience}+` : "",
    collectExperienceText(master.experience),
    (master.projects ?? []).map((p) => p.description).join(" "),
    (master.certifications ?? []).map((c) => c.description ?? "").join(" "),
  ].join(" ");
  const masterMetrics = new Set(extractMetrics(masterMetricSource));

  const targets: Array<{ location: string; text: string }> = [
    { location: "professional_summary", text: tailored.professional_summary },
  ];

  for (const job of tailored.experience ?? []) {
    job.achievements.forEach((ach, idx) => {
      targets.push({
        location: `experience[${job.company}].achievements[${idx}]`,
        text: `${ach.description} ${ach.impact ?? ""}`,
      });
    });
  }

  for (const proj of tailored.projects ?? []) {
    targets.push({
      location: `projects[${proj.name}]`,
      text: `${proj.description} ${(proj.highlights ?? []).join(" ")}`,
    });
  }

  for (const cert of tailored.certifications ?? []) {
    if (cert.description) {
      targets.push({
        location: `certifications[${cert.name}]`,
        text: cert.description,
      });
    }
  }

  for (const target of targets) {
    for (const metric of extractMetrics(target.text)) {
      if (!masterMetrics.has(metric)) {
        warnings.push(
          `Unsupported metric or quantitative claim "${metric}" in ${target.location} is not present in master_resume.json.`
        );
      }
    }
  }
}

function validateProjects(
  tailored: Resume,
  master: Resume,
  warnings: string[]
): void {
  const masterProjectsByName = new Map(
    (master.projects ?? []).map((p) => [normalizeText(p.name), p])
  );
  const expWordSets = (master.experience ?? []).map((job) => ({
    company: job.company,
    words: significantWords(
      job.achievements.map((a) => `${a.description} ${a.impact ?? ""}`).join(" ")
    ),
  }));

  for (const project of tailored.projects ?? []) {
    const masterProject = masterProjectsByName.get(normalizeText(project.name));
    if (!masterProject) {
      warnings.push(
        `Project "${project.name}" is not present in master_resume.json.`
      );
    } else if (
      normalizeText(project.status ?? "") !== normalizeText(masterProject.status ?? "")
    ) {
      warnings.push(
        `Project "${project.name}" status ("${project.status ?? ""}") differs from master_resume.json ("${masterProject.status ?? ""}").`
      );
    }

    if (!isNonEmptyString(project.link)) {
      const projWords = significantWords(
        `${project.name} ${project.description} ${(project.highlights ?? []).join(" ")}`
      );
      for (const exp of expWordSets) {
        if (projWords.size === 0) continue;
        let overlap = 0;
        for (const w of projWords) {
          if (exp.words.has(w)) overlap += 1;
        }
        const ratio = overlap / projWords.size;
        if (ratio >= 0.45) {
          warnings.push(
            `Project "${project.name}" duplicates "${exp.company}" work experience without an independent link.`
          );
          break;
        }
      }
    }
  }
}

function validateExperienceAndClaims(
  tailored: Resume,
  master: Resume,
  warnings: string[]
): void {
  const masterCorpus = buildTextCorpus(master);
  const masterJobsByCompany = new Map(
    (master.experience ?? []).map((job) => [normalizeText(job.company), job])
  );

  for (const job of tailored.experience ?? []) {
    const masterJob = masterJobsByCompany.get(normalizeText(job.company));
    if (!masterJob) {
      warnings.push(
        `Company "${job.company}" is not present in master_resume.json. Verify this is not fabricated.`
      );
      continue;
    }

    if (normalizeText(job.position) !== normalizeText(masterJob.position)) {
      warnings.push(
        `Position "${job.position}" at ${job.company} differs from master_resume.json ("${masterJob.position}").`
      );
    }
    if (
      normalizeText(job.start_date) !== normalizeText(masterJob.start_date) ||
      normalizeText(job.end_date) !== normalizeText(masterJob.end_date)
    ) {
      warnings.push(
        `Employment dates "${job.start_date} – ${job.end_date}" at ${job.company} differ from master_resume.json ("${masterJob.start_date} – ${masterJob.end_date}").`
      );
    }
    if (normalizeText(job.location) !== normalizeText(masterJob.location)) {
      warnings.push(
        `Location "${job.location}" at ${job.company} differs from master_resume.json ("${masterJob.location}").`
      );
    }

    for (const tech of job.technologies ?? []) {
      const inMaster =
        masterCorpus.declaredSkills.has(normalizeToken(tech)) ||
        hasEvidenceInText(tech, masterCorpus.declaredText);
      if (!inMaster) {
        warnings.push(
          `Technology "${tech}" in ${job.company} is not present in master_resume.json.`
        );
      }
    }
  }

  // Check summary + achievements for unsupported high-risk claims or unverified tech terms
  const masterExpOnlyLower = normalizeText(collectExperienceText(master.experience));
  const masterEvidenceLower = masterCorpus.evidenceText;
  const masterFullLower = normalizeText(
    `${master.professional_summary ?? ""} ${masterEvidenceLower}`
  );
  const tailoredExpText = normalizeText(collectExperienceText(tailored.experience));

  const sectionsToCheck: Array<{ label: string; text: string; requireExpEvidence: boolean }> = [
    {
      label: "professional_summary",
      text: tailored.professional_summary ?? "",
      requireExpEvidence: true,
    },
    ...(tailored.experience ?? []).map((job) => ({
      label: `experience[${job.company}]`,
      text: job.achievements.map((a) => `${a.description} ${a.impact ?? ""}`).join(" "),
      requireExpEvidence: false,
    })),
    ...(tailored.projects ?? []).map((proj) => ({
      label: `projects[${proj.name}]`,
      text: `${proj.name} ${proj.description} ${(proj.highlights ?? []).join(" ")}`,
      requireExpEvidence: false,
    })),
  ];

  for (const section of sectionsToCheck) {
    const lower = normalizeText(section.text);

    for (const claim of HIGH_RISK_CLAIMS) {
      if (!lower.includes(claim)) continue;
      if (section.requireExpEvidence) {
        if (!masterExpOnlyLower.includes(claim) && !tailoredExpText.includes(claim)) {
          warnings.push(
            `Summary claim "${claim}" is not evidenced in professional experience.`
          );
        }
      } else if (!masterEvidenceLower.includes(claim)) {
        warnings.push(
          `Experience claim "${claim}" in ${section.label} is not supported by master_resume.json.`
        );
      }
    }

    for (const { label, pattern } of UNVERIFIED_TECH_PATTERNS) {
      if (pattern.test(section.text) && !pattern.test(masterFullLower)) {
        warnings.push(
          `Unverified technology mention "${label}" in ${section.label} is not present in master_resume.json.`
        );
      }
    }
  }
}

function validateEducation(
  tailored: Resume,
  master: Resume,
  warnings: string[]
): void {
  const masterByInstitution = new Map(
    (master.education ?? []).map((item) => [normalizeText(item.institution), item])
  );

  for (const item of tailored.education ?? []) {
    const masterItem = masterByInstitution.get(normalizeText(item.institution));
    if (!masterItem) {
      warnings.push(
        `Institution "${item.institution}" is not present in master_resume.json. Verify this is not fabricated.`
      );
      continue;
    }

    if (normalizeText(item.degree) !== normalizeText(masterItem.degree)) {
      warnings.push(
        `Degree "${item.degree}" at ${item.institution} differs from master_resume.json ("${masterItem.degree}").`
      );
    }
    if (normalizeText(item.status ?? "") !== normalizeText(masterItem.status ?? "")) {
      warnings.push(
        `Education status "${item.status ?? ""}" at ${item.institution} differs from master_resume.json ("${masterItem.status ?? ""}").`
      );
    }
    if (item.start_year !== masterItem.start_year || item.end_year !== masterItem.end_year) {
      warnings.push(
        `Education years "${item.start_year}–${item.end_year}" at ${item.institution} differ from master_resume.json ("${masterItem.start_year}–${masterItem.end_year}").`
      );
    }
  }
}

export function validateResumeStructure(resume: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!resume || typeof resume !== "object") {
    return { valid: false, errors: ["Resume must be a JSON object."], warnings };
  }

  const data = resume as Partial<Resume>;

  if (!data.personal_info || typeof data.personal_info !== "object") {
    errors.push("Missing personal_info.");
  } else {
    const requiredFields: Array<keyof Resume["personal_info"]> = [
      "full_name",
      "title",
      "email",
      "location",
    ];
    for (const field of requiredFields) {
      if (!isNonEmptyString(data.personal_info[field])) {
        errors.push(`personal_info.${field} is required.`);
      }
    }
  }

  if (!isNonEmptyString(data.professional_summary)) {
    errors.push("professional_summary is required.");
  }

  if (!data.skills || typeof data.skills !== "object") {
    errors.push("skills is required.");
  } else {
    const hasSkillGroup = Object.values(data.skills).some(
      (value) => Array.isArray(value) && value.length > 0
    );
    if (!hasSkillGroup) {
      errors.push("skills must include at least one non-empty group.");
    }
  }

  if (!Array.isArray(data.experience) || data.experience.length === 0) {
    errors.push("experience must include at least one role.");
  } else {
    data.experience.forEach((job, index) => {
      if (!isNonEmptyString(job.company)) {
        errors.push(`experience[${index}].company is required.`);
      }
      if (!isNonEmptyString(job.position)) {
        errors.push(`experience[${index}].position is required.`);
      }
      if (!Array.isArray(job.achievements) || job.achievements.length === 0) {
        errors.push(`experience[${index}] must include at least one achievement.`);
      }
    });
  }

  if (!Array.isArray(data.education) || data.education.length === 0) {
    errors.push("education must include at least one entry.");
  }

  if (data.keywords && !isStringArray(data.keywords)) {
    warnings.push("keywords should be an array of strings.");
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateAgainstMaster(
  tailored: Resume,
  masterPath: string
): ValidationResult {
  const structure = validateResumeStructure(tailored);
  const errors = [...structure.errors];
  const warnings = [...structure.warnings];

  let master: Resume;
  try {
    master = JSON.parse(readFileSync(resolve(masterPath), "utf-8")) as Resume;
  } catch {
    warnings.push(`Could not read master resume at ${masterPath}; skipped fact-check.`);
    return { valid: structure.valid, errors, warnings };
  }

  validateCertifications(tailored, master, warnings);
  validateSkills(tailored, master, warnings);
  validateMetrics(tailored, master, warnings);
  validateProjects(tailored, master, warnings);
  validateExperienceAndClaims(tailored, master, warnings);
  validateEducation(tailored, master, warnings);

  return { valid: errors.length === 0, errors, warnings };
}

export function printValidationResult(result: ValidationResult): void {
  for (const error of result.errors) {
    console.error(`ERROR: ${error}`);
  }
  for (const warning of result.warnings) {
    console.warn(`WARN: ${warning}`);
  }
}
