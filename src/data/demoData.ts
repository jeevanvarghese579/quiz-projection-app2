import type { Quiz, Team, Question, ScoreEntry } from '@/types';

const TEAM_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
  '#06B6D4', '#E11D48', '#A855F7', '#22C55E', '#F43F5E',
  '#0EA5E9', '#D946EF', '#EAB308', '#0891B2', '#65A30D',
];

const TEAM_NAMES = [
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta',
  'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi',
  'Rho', 'Sigma', 'Tau', 'Upsilon',
];

const INSTITUTIONS = [
  'St. Gemma\'s HSS', 'Govt. HSS Malappuram', 'St. Mary\'s HSS', 'PMSM College',
  'EMS HSS Kuttippuram', 'M.E.S College', 'Pookkottur HSS', 'Karinkallathani HSS',
];

function makeMembers(teamName: string): { id: string; name: string; studentId?: string; className?: string; institution?: string }[] {
  const firstNames = ['Aisha', 'Fatima', 'Hana', 'Mariam', 'Sara', 'Layla', 'Noor', 'Yasmin', 'Zara', 'Amina', 'Hiba', 'Riya'];
  const lastNames = ['Khan', 'Nair', 'Menon', 'Varghese', 'Das', 'Pillai', 'Nambiar', 'Kurup', 'Suresh', 'Rajan'];
  const count = 2 + Math.floor(Math.random() * 2);
  return Array.from({ length: count }, (_, i) => {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    return {
      id: `${teamName}-m${i + 1}`,
      name: `${fn} ${ln}`,
      studentId: `S${1000 + Math.floor(Math.random() * 9000)}`,
      className: '12A',
      institution: INSTITUTIONS[Math.floor(Math.random() * INSTITUTIONS.length)],
    };
  });
}

export function createDemoQuiz(): Quiz {
  const teams: Team[] = TEAM_NAMES.map((name, i) => ({
    id: `team-${i + 1}`,
    name: `Team ${name}`,
    color: TEAM_COLORS[i % TEAM_COLORS.length],
    institution: INSTITUTIONS[i % INSTITUTIONS.length],
    members: makeMembers(name),
  }));

  const questions: Question[] = Array.from({ length: 10 }, (_, i) => {
    const marks = [1, 2, 5, 2.5, 3, 4, 5, 10, 3, 2][i] ?? (i + 1);
    return {
      id: `q-${i + 1}`,
      number: i + 1,
      maxMarks: marks,
      active: true,
    };
  });

  const scores: ScoreEntry[] = [];
  teams.forEach((team, ti) => {
    questions.forEach((q, qi) => {
      // Give varied initial scores so leaderboard has ranks
      const seed = (ti * 7 + qi * 3) % 10;
      let state: ScoreEntry['state'] = 'unanswered';
      let marks: number | null = null;
      if (seed < 4) {
        state = 'correct';
        marks = q.maxMarks;
      } else if (seed < 6) {
        state = 'half';
        marks = q.maxMarks / 2;
      } else if (seed < 8) {
        state = 'incorrect';
        marks = 0;
      } else {
        state = 'unanswered';
        marks = null;
      }
      scores.push({
        teamId: team.id,
        questionId: q.id,
        state,
        marks,
        updatedAt: Date.now() - Math.floor(Math.random() * 3600_000),
        updatedBy: 'demo-invigilator',
      });
    });
  });

  return {
    id: 'demo-quiz-1',
    name: 'INTER-SCHOOL SCIENCE QUIZ 2026',
    subtitle: 'LIVE CHAMPIONSHIP LEADERBOARD',
    institution: 'St. Gemma\'s Girls\' HSS, Malappuram',
    eventDate: '2026-11-15',
    status: 'live',
    teams,
    questions,
    scores,
    invigilatorAccess: [
      {
        id: 'inv-1',
        code: 'SCIENCE-4827',
        label: 'Invigilator A (Teams Alpha–Delta)',
        teamIds: ['team-1', 'team-2', 'team-3', 'team-4'],
        readOnly: false,
        createdAt: Date.now() - 86_400_000,
        expiresAt: Date.now() + 86_400_000,
        revoked: false,
        lastUsedAt: Date.now() - 1800_000,
      },
      {
        id: 'inv-2',
        code: 'SCIENCE-7193',
        label: 'Invigilator B (Teams Epsilon–Theta)',
        teamIds: ['team-5', 'team-6', 'team-7', 'team-8'],
        readOnly: false,
        createdAt: Date.now() - 86_400_000,
        expiresAt: null,
        revoked: false,
        lastUsedAt: null,
      },
      {
        id: 'inv-3',
        code: 'SCIENCE-3051',
        label: 'Read-Only All Teams',
        teamIds: 'all',
        readOnly: true,
        createdAt: Date.now() - 43_200_000,
        expiresAt: Date.now() + 43_200_000,
        revoked: false,
        lastUsedAt: null,
      },
    ],
    auditLogs: [],
    negativeMarkingEnabled: false,
    negativeMarkingPercentage: 25,
    projector: {
      title: 'INTER-SCHOOL SCIENCE QUIZ 2026',
      subtitle: 'LIVE CHAMPIONSHIP LEADERBOARD',
      institution: 'St. Gemma\'s Girls\' HSS, Malappuram',
      prominentTeamCount: 5,
      animationSpeed: 'normal',
      showRanks: true,
      showScores: true,
      autoScrollOverflow: true,
      theme: 'midnight',
    },
    invigilatorLoginEnabled: true,
    createdAt: Date.now() - 86_400_000,
  };
}

export const DEMO_QUIZ = createDemoQuiz();
