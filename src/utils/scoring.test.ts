import { describe, expect, it } from 'vitest';
import { computeMarks, formatMarks, getRankedTeams, getTeamTotal } from './scoring';
import type { Question, Quiz } from '@/types';

const question: Question = { id: 'q1', number: 1, maxMarks: 5, active: true };

function quizFixture(): Quiz {
  return {
    id: 'quiz',
    name: 'Test Quiz',
    subtitle: '',
    institution: '',
    status: 'live',
    teams: [
      { id: 'a', name: 'Alpha', color: '#111111', members: [] },
      { id: 'b', name: 'Beta', color: '#222222', members: [] },
      { id: 'c', name: 'Gamma', color: '#333333', members: [] },
    ],
    questions: [question],
    scores: [
      { teamId: 'a', questionId: 'q1', state: 'correct', marks: 5, updatedAt: 1, updatedBy: 'test' },
      { teamId: 'b', questionId: 'q1', state: 'half', marks: 2.5, updatedAt: 1, updatedBy: 'test' },
      { teamId: 'c', questionId: 'q1', state: 'half', marks: 2.5, updatedAt: 1, updatedBy: 'test' },
    ],
    invigilatorAccess: [],
    auditLogs: [],
    negativeMarkingEnabled: false,
    negativeMarkingPercentage: 25,
    invigilatorLoginEnabled: true,
    createdAt: 1,
    projector: {
      title: 'Test Quiz', subtitle: '', institution: '', prominentTeamCount: 2,
      animationSpeed: 'normal', showRanks: true, showScores: true,
      autoScrollOverflow: true, theme: 'midnight',
    },
  };
}

describe('computeMarks', () => {
  it('supports standard scoring states', () => {
    expect(computeMarks(question, 'correct')).toBe(5);
    expect(computeMarks(question, 'incorrect')).toBe(0);
    expect(computeMarks(question, 'half')).toBe(2.5);
    expect(computeMarks(question, 'unanswered')).toBeNull();
  });

  it('applies the configured percentage only when negative marking is enabled', () => {
    expect(computeMarks(question, 'incorrect', undefined, { enabled: false, percentage: 25 })).toBe(0);
    expect(computeMarks(question, 'incorrect', undefined, { enabled: true, percentage: 25 })).toBe(-1.25);
    expect(computeMarks({ ...question, maxMarks: 3 }, 'incorrect', undefined, { enabled: true, percentage: 33 })).toBe(-0.99);
  });

  it('rounds and bounds custom marks', () => {
    expect(computeMarks(question, 'custom', 3.126)).toBe(3.13);
    expect(computeMarks(question, 'custom', -2)).toBe(0);
    expect(computeMarks(question, 'custom', 8)).toBe(5);
  });
});

describe('leaderboard calculations', () => {
  it('totals scores and produces deterministic tied ranks', () => {
    const quiz = quizFixture();
    expect(getTeamTotal(quiz, 'a')).toBe(5);
    expect(getRankedTeams(quiz).map((item) => [item.team.id, item.rank])).toEqual([
      ['a', 1], ['b', 2], ['c', 2],
    ]);
  });

  it('formats whole and decimal marks', () => {
    expect(formatMarks(5)).toBe('5');
    expect(formatMarks(2.5)).toBe('2.5');
    expect(formatMarks(null)).toBe('—');
  });
});
