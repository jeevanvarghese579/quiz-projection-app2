import type { Quiz, ScoreEntry, Question, Team } from '@/types';

export function getScoreEntry(quiz: Quiz, teamId: string, questionId: string): ScoreEntry | undefined {
  return quiz.scores.find((s) => s.teamId === teamId && s.questionId === questionId);
}

export function getTeamTotal(quiz: Quiz, teamId: string): number {
  return quiz.scores
    .filter((s) => s.teamId === teamId && s.marks !== null)
    .reduce((sum, s) => sum + (s.marks ?? 0), 0);
}

export interface RankedTeam {
  team: Team;
  total: number;
  rank: number;
  correctCount: number;
  incorrectCount: number;
  halfCount: number;
  unansweredCount: number;
}

export function getRankedTeams(quiz: Quiz): RankedTeam[] {
  const totals = quiz.teams.map((team) => {
    const total = getTeamTotal(quiz, team.id);
    let correctCount = 0, incorrectCount = 0, halfCount = 0, unansweredCount = 0;
    quiz.questions.forEach((q) => {
      const entry = getScoreEntry(quiz, team.id, q.id);
      if (!entry || entry.state === 'unanswered') unansweredCount++;
      else if (entry.state === 'correct') correctCount++;
      else if (entry.state === 'incorrect') incorrectCount++;
      else if (entry.state === 'half') halfCount++;
    });
    return { team, total, correctCount, incorrectCount, halfCount, unansweredCount };
  });

  totals.sort((a, b) => b.total - a.total);

  let rank = 0;
  let prevTotal = Infinity;
  return totals.map((t) => {
    if (t.total !== prevTotal) {
      rank++;
      prevTotal = t.total;
    }
    return { ...t, rank };
  });
}

export function computeMarks(question: Question, state: ScoreEntry['state'], customValue?: number): number | null {
  switch (state) {
    case 'correct': return question.maxMarks;
    case 'incorrect': return 0;
    case 'half': return question.maxMarks / 2;
    case 'unanswered': return null;
    case 'custom': {
      if (customValue === undefined || customValue === null) return null;
      if (customValue < 0) return 0;
      if (customValue > question.maxMarks) return question.maxMarks;
      return Math.round(customValue * 100) / 100;
    }
    default: return null;
  }
}

export function formatMarks(marks: number | null): string {
  if (marks === null || marks === undefined) return '—';
  if (marks === Math.floor(marks)) return String(marks);
  return marks.toFixed(1).replace(/\.0$/, '');
}

export function uid(prefix: string = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function randomCode(prefix: string = 'QUIZ'): string {
  const chars = '0123456789';
  const num = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${prefix.toUpperCase()}-${num}`;
}
