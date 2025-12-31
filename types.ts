
export interface Candidate {
  name: string;
  role: string;
  experience: string;
}

export interface ResumeData {
  extractedName?: string;
  extractedRole?: string;
  skills: string[];
  summary: string;
}

export interface InterviewStats {
  clarity: number;
  confidence: number;
  technical: number;
  softSkills: number;
}

export interface Feedback {
  overallScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  stats: InterviewStats;
}

export enum AppState {
  LANDING = 'LANDING',
  SETUP = 'SETUP',
  INTERVIEWING = 'INTERVIEWING',
  RESULTS = 'RESULTS'
}
