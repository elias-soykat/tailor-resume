export interface PersonalInfo {
  full_name: string;
  title: string;
  email: string;
  location: string;
  linkedin?: string;
  github?: string;
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
}

export interface Skills {
  languages?: string[];
  frontend?: string[];
  backend?: string[];
  tools_ops?: string[];
  cloud_devops?: string[];
  architecture?: string[];
  security?: string[];
  [key: string]: string[] | undefined;
}

export interface TargetJob {
  company?: string;
  title?: string;
  tailored_at?: string;
}

export interface Resume {
  personal_info: PersonalInfo;
  professional_summary: string;
  years_of_experience?: number;
  skills: Skills;
  experience: Experience[];
  education: Education[];
  domains?: string[];
  keywords?: string[];
  target_job?: TargetJob;
}

export const SKILL_GROUP_LABELS: Record<string, string> = {
  languages: "Languages",
  frontend: "Frontend",
  backend: "Backend",
  tools_ops: "Tools & Ops",
  cloud_devops: "Tools & Ops",
};

export const SKILL_DISPLAY_ORDER = [
  "languages",
  "frontend",
  "backend",
  "tools_ops",
  "cloud_devops",
] as const;
