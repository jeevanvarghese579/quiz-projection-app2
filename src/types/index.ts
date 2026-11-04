export type QuizStatus = 'draft' | 'live' | 'paused' | 'completed' | 'archived';

export type ScoreState = 'correct' | 'incorrect' | 'half' | 'unanswered' | 'custom';

export interface Student {
  id: string;
  name: string;
  studentId?: string;
  className?: string;
  institution?: string;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  institution?: string;
  members: Student[];
}

export interface Question {
  id: string;
  number: number;
  maxMarks: number;
  active: boolean;
}

export interface ScoreEntry {
  teamId: string;
  questionId: string;
  state: ScoreState;
  marks: number | null;
  updatedAt: number;
  updatedBy: string;
}

export interface InvigilatorAccess {
  id: string;
  code: string;
  label: string;
  teamIds: string[] | 'all';
  readOnly: boolean;
  createdAt: number;
  expiresAt: number | null;
  revoked: boolean;
  lastUsedAt: number | null;
}

export interface AuditLogEntry {
  id: string;
  quizId: string;
  teamId: string;
  questionId: string;
  previousMarks: number | null;
  newMarks: number | null;
  previousState: ScoreState;
  newState: ScoreState;
  actorRole: 'admin' | 'invigilator';
  actorId: string;
  timestamp: number;
}

export interface ProjectorSettings {
  title: string;
  subtitle: string;
  institution: string;
  prominentTeamCount: number;
  animationSpeed: 'instant' | 'fast' | 'normal' | 'slow';
  showRanks: boolean;
  showScores: boolean;
  autoScrollOverflow: boolean;
  theme: 'midnight' | 'royal' | 'emerald' | 'sunset';
}

export interface Quiz {
  id: string;
  name: string;
  subtitle: string;
  institution: string;
  eventDate?: string;
  status: QuizStatus;
  teams: Team[];
  questions: Question[];
  scores: ScoreEntry[];
  invigilatorAccess: InvigilatorAccess[];
  auditLogs: AuditLogEntry[];
  projector: ProjectorSettings;
  negativeMarkingEnabled: boolean;
  negativeMarkingPercentage: number;
  invigilatorLoginEnabled: boolean;
  createdAt: number;
}
