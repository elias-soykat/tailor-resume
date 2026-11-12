export interface PersonalInfo {
  full_name: string;
  title: string;
  email: string;
  phone?: string;
  location: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface Achievement {
  description: string;
  impact?: string;
}

export interface Experience {
  company: string;
  position: string;
  start_date: string;
  end_date: string;
  location: string;
  industry?: string;
  technologies?: string[];
  achievements: Achievement[];
}

export interface Education {
  degree: string;
  institution: string;
  start_year: number;
  end_year: number;
  location?: string;
  status?: string;
  field_of_study?: string;
}

export interface Project {
  name: string;
  description: string;
  status?: string;
  highlights?: string[];
  technologies?: string[];
  link?: string;
  acceptance_criteria?: string[];
}

export interface Skills {
  languages?: string[];
  frontend?: string[];
  frontend_mobile?: string[];
  backend?: string[];
  backend_distributed_apis?: string[];
  data?: string[];
  databases?: string[];
  databases_vector_search?: string[];
  ai_media?: string[];
  ai_voice_agents?: string[];
  real_time_media_desktop?: string[];
  infrastructure?: string[];
  tools_ops?: string[];
  cloud_devops?: string[];
  cloud_devops_architecture?: string[];
  tools_practices?: string[];
  architecture?: string[];
  security?: string[];
  [key: string]: string[] | undefined;
}

export interface TargetJob {
  company?: string;
  title?: string;
  tailored_at?: string;
}

export interface Certification {
  name: string;
  issuer?: string;
  year?: string | number;
  description?: string;
}

export interface Resume {
  personal_info: PersonalInfo;
  professional_summary: string;
  years_of_experience?: number;
  skills: Skills;
  experience: Experience[];
  projects?: Project[];
  education: Education[];
  certifications?: Certification[];
  domains?: string[];
  keywords?: string[];
  target_job?: TargetJob;
}

export interface CoverLetterRecipient {
  company?: string;
  name?: string;
  title?: string;
}

export interface CoverLetter {
  personal_info: PersonalInfo;
  target_job?: TargetJob;
  date: string;
  recipient?: CoverLetterRecipient;
  salutation: string;
  paragraphs: string[];
  closing: string;
  signature_name: string;
}

export const SKILL_GROUP_LABELS: Record<string, string> = {
  languages: "Languages",
  frontend: "Frontend",
  frontend_mobile: "Frontend & Mobile",
  backend: "Backend",
  backend_distributed_apis: "Backend & Distributed APIs",
  data: "Databases",
  databases: "Databases",
  databases_vector_search: "Databases & Vector Search",
  ai_media: "AI & Media",
  ai_voice_agents: "AI, Voice & Agents",
  real_time_media_desktop: "Real-Time, Media & Desktop",
  infrastructure: "Infrastructure",
  cloud_devops: "Cloud & DevOps",
  cloud_devops_architecture: "Cloud, DevOps & Architecture",
  tools_ops: "Cloud & DevOps",
  tools_practices: "Tools & Practices",
};

export const SKILL_DISPLAY_ORDER = [
  "languages",
  "frontend",
  "frontend_mobile",
  "backend",
  "backend_distributed_apis",
  "data",
  "databases",
  "databases_vector_search",
  "ai_media",
  "ai_voice_agents",
  "real_time_media_desktop",
  "infrastructure",
  "cloud_devops",
  "cloud_devops_architecture",
  "tools_ops",
  "tools_practices",
] as const;
