import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Quiz, ScoreEntry, AuditLogEntry, ProjectorSettings, Team, Question, InvigilatorAccess } from '@/types';
import { DEMO_QUIZ } from '@/data/demoData';
import { computeMarks, getTeamTotal, getRankedTeams, uid } from '@/utils/scoring';

interface QuizContextValue {
  quizzes: Quiz[];
  activeQuizId: string | null;
  activeQuiz: Quiz | null;
  setActiveQuizId: (id: string | null) => void;
  createQuiz: (data: Partial<Quiz>) => string;
  updateQuiz: (id: string, patch: Partial<Quiz>) => void;
  deleteQuiz: (id: string) => void;
  duplicateQuiz: (id: string) => void;
  setQuizStatus: (id: string, status: Quiz['status']) => void;
  // Teams
  addTeam: (quizId: string, team: Partial<Team>) => void;
  updateTeam: (quizId: string, teamId: string, patch: Partial<Team>) => void;
  deleteTeam: (quizId: string, teamId: string) => void;
  addMember: (quizId: string, teamId: string, member: { name: string; studentId?: string; className?: string; institution?: string }) => void;
  updateMember: (quizId: string, teamId: string, memberId: string, patch: Partial<{ name: string; studentId?: string; className?: string; institution?: string }>) => void;
  deleteMember: (quizId: string, teamId: string, memberId: string) => void;
  // Questions
  addQuestion: (quizId: string, maxMarks: number) => void;
  updateQuestion: (quizId: string, questionId: string, patch: Partial<Question>) => void;
  deleteQuestion: (quizId: string, questionId: string) => void;
  bulkAddQuestions: (quizId: string, marksList: number[]) => void;
  // Scoring
  setScore: (quizId: string, teamId: string, questionId: string, state: ScoreEntry['state'], customValue?: number, actorId?: string, actorRole?: 'admin' | 'invigilator') => void;
  resetTeamScores: (quizId: string, teamId: string) => void;
  // Invigilators
  addInvigilator: (quizId: string, access: Partial<InvigilatorAccess>) => void;
  updateInvigilator: (quizId: string, accessId: string, patch: Partial<InvigilatorAccess>) => void;
  revokeInvigilator: (quizId: string, accessId: string) => void;
  // Projector
  updateProjectorSettings: (quizId: string, settings: Partial<ProjectorSettings>) => void;
  // Derived
  getRankedTeams: (quiz: Quiz) => ReturnType<typeof getRankedTeams>;
  getTeamTotal: (quiz: Quiz, teamId: string) => number;
}

const QuizContext = createContext<QuizContextValue | null>(null);

const QUIZZES_STORAGE_KEY = 'quizProjectionApp2.demo.quizzes.v1';
const ACTIVE_QUIZ_STORAGE_KEY = 'quizProjectionApp2.demo.activeQuiz.v1';

function loadStoredQuizzes(): Quiz[] {
  if (typeof window === 'undefined') return [DEMO_QUIZ];
  try {
    const stored = window.localStorage.getItem(QUIZZES_STORAGE_KEY);
    if (!stored) return [DEMO_QUIZ];
    const value = JSON.parse(stored) as unknown;
    return Array.isArray(value) ? value as Quiz[] : [DEMO_QUIZ];
  } catch {
    return [DEMO_QUIZ];
  }
}

export function QuizProvider({ children }: { children: ReactNode }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>(loadStoredQuizzes);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return DEMO_QUIZ.id;
    return window.localStorage.getItem(ACTIVE_QUIZ_STORAGE_KEY) ?? DEMO_QUIZ.id;
  });

  useEffect(() => {
    window.localStorage.setItem(QUIZZES_STORAGE_KEY, JSON.stringify(quizzes));
  }, [quizzes]);

  useEffect(() => {
    if (activeQuizId) window.localStorage.setItem(ACTIVE_QUIZ_STORAGE_KEY, activeQuizId);
    else window.localStorage.removeItem(ACTIVE_QUIZ_STORAGE_KEY);
  }, [activeQuizId]);

  useEffect(() => {
    const syncDemoData = (event: StorageEvent) => {
      if (event.key === QUIZZES_STORAGE_KEY && event.newValue) {
        try {
          const next = JSON.parse(event.newValue) as unknown;
          if (Array.isArray(next)) setQuizzes(next as Quiz[]);
        } catch {
          // Ignore malformed storage written by another tab.
        }
      }
      if (event.key === ACTIVE_QUIZ_STORAGE_KEY) setActiveQuizId(event.newValue);
    };
    window.addEventListener('storage', syncDemoData);
    return () => window.removeEventListener('storage', syncDemoData);
  }, []);

  const activeQuiz = quizzes.find((q) => q.id === activeQuizId) ?? null;

  const updateQuizInState = useCallback((id: string, updater: (q: Quiz) => Quiz) => {
    setQuizzes((prev) => prev.map((q) => (q.id === id ? updater({ ...q }) : q)));
  }, []);

  const createQuiz = useCallback((data: Partial<Quiz>): string => {
    const id = uid('quiz');
    const newQuiz: Quiz = {
      id,
      name: data.name ?? 'New Quiz',
      subtitle: data.subtitle ?? 'LIVE CHAMPIONSHIP LEADERBOARD',
      institution: data.institution ?? '',
      eventDate: data.eventDate,
      status: 'draft',
      teams: [],
      questions: [],
      scores: [],
      invigilatorAccess: [],
      auditLogs: [],
      invigilatorLoginEnabled: false,
      createdAt: Date.now(),
      projector: {
        title: data.name ?? 'New Quiz',
        subtitle: 'LIVE CHAMPIONSHIP LEADERBOARD',
        institution: data.institution ?? '',
        prominentTeamCount: 5,
        animationSpeed: 'normal',
        showRanks: true,
        showScores: true,
        autoScrollOverflow: true,
        theme: 'midnight',
      },
    };
    setQuizzes((prev) => [...prev, newQuiz]);
    setActiveQuizId(id);
    return id;
  }, []);

  const updateQuiz = useCallback((id: string, patch: Partial<Quiz>) => {
    updateQuizInState(id, (q) => ({ ...q, ...patch }));
  }, [updateQuizInState]);

  const deleteQuiz = useCallback((id: string) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
    setActiveQuizId((prev) => (prev === id ? null : prev));
  }, []);

  const duplicateQuiz = useCallback((id: string) => {
    const orig = quizzes.find((q) => q.id === id);
    if (!orig) return;
    const newId = uid('quiz');
    const copy: Quiz = {
      ...orig,
      id: newId,
      name: `${orig.name} (Copy)`,
      status: 'draft',
      scores: [],
      auditLogs: [],
      invigilatorAccess: [],
      createdAt: Date.now(),
      teams: orig.teams.map((t) => ({ ...t, id: uid('team'), members: t.members.map((m) => ({ ...m, id: uid('mem') })) })),
      questions: orig.questions.map((q) => ({ ...q, id: uid('q') })),
      projector: { ...orig.projector },
    };
    setQuizzes((prev) => [...prev, copy]);
  }, [quizzes]);

  const setQuizStatus = useCallback((id: string, status: Quiz['status']) => {
    updateQuizInState(id, (q) => ({ ...q, status }));
  }, [updateQuizInState]);

  const addTeam = useCallback((quizId: string, team: Partial<Team>) => {
    updateQuizInState(quizId, (q) => ({
      ...q,
      teams: [...q.teams, {
        id: uid('team'),
        name: team.name ?? 'New Team',
        color: team.color ?? '#3B82F6',
        institution: team.institution,
        members: team.members ?? [],
      }],
    }));
  }, [updateQuizInState]);

  const updateTeam = useCallback((quizId: string, teamId: string, patch: Partial<Team>) => {
    updateQuizInState(quizId, (q) => ({
      ...q,
      teams: q.teams.map((t) => (t.id === teamId ? { ...t, ...patch } : t)),
    }));
  }, [updateQuizInState]);

  const deleteTeam = useCallback((quizId: string, teamId: string) => {
    updateQuizInState(quizId, (q) => ({
      ...q,
      teams: q.teams.filter((t) => t.id !== teamId),
      scores: q.scores.filter((s) => s.teamId !== teamId),
    }));
  }, [updateQuizInState]);

  const addMember = useCallback((quizId: string, teamId: string, member: { name: string; studentId?: string; className?: string; institution?: string }) => {
    updateQuizInState(quizId, (q) => ({
      ...q,
      teams: q.teams.map((t) => (t.id === teamId ? { ...t, members: [...t.members, { id: uid('mem'), ...member }] } : t)),
    }));
  }, [updateQuizInState]);

  const updateMember = useCallback((quizId: string, teamId: string, memberId: string, patch: Partial<{ name: string; studentId?: string; className?: string; institution?: string }>) => {
    updateQuizInState(quizId, (q) => ({
      ...q,
      teams: q.teams.map((t) => (t.id === teamId ? { ...t, members: t.members.map((m) => (m.id === memberId ? { ...m, ...patch } : m)) } : t)),
    }));
  }, [updateQuizInState]);

  const deleteMember = useCallback((quizId: string, teamId: string, memberId: string) => {
    updateQuizInState(quizId, (q) => ({
      ...q,
      teams: q.teams.map((t) => (t.id === teamId ? { ...t, members: t.members.filter((m) => m.id !== memberId) } : t)),
    }));
  }, [updateQuizInState]);

  const addQuestion = useCallback((quizId: string, maxMarks: number) => {
    updateQuizInState(quizId, (q) => {
      const nextNumber = q.questions.length + 1;
      return {
        ...q,
        questions: [...q.questions, { id: uid('q'), number: nextNumber, maxMarks, active: true }],
      };
    });
  }, [updateQuizInState]);

  const updateQuestion = useCallback((quizId: string, questionId: string, patch: Partial<Question>) => {
    updateQuizInState(quizId, (q) => ({
      ...q,
      questions: q.questions.map((qu) => (qu.id === questionId ? { ...qu, ...patch } : qu)),
    }));
  }, [updateQuizInState]);

  const deleteQuestion = useCallback((quizId: string, questionId: string) => {
    updateQuizInState(quizId, (q) => {
      const remaining = q.questions.filter((qu) => qu.id !== questionId).map((qu, i) => ({ ...qu, number: i + 1 }));
      return {
        ...q,
        questions: remaining,
        scores: q.scores.filter((s) => s.questionId !== questionId),
      };
    });
  }, [updateQuizInState]);

  const bulkAddQuestions = useCallback((quizId: string, marksList: number[]) => {
    updateQuizInState(quizId, (q) => {
      let startNum = q.questions.length;
      const newQs = marksList.map((m) => { startNum++; return { id: uid('q'), number: startNum, maxMarks: m, active: true }; });
      return { ...q, questions: [...q.questions, ...newQs] };
    });
  }, [updateQuizInState]);

  const setScore = useCallback((quizId: string, teamId: string, questionId: string, state: ScoreEntry['state'], customValue?: number, actorId: string = 'admin', actorRole: 'admin' | 'invigilator' = 'admin') => {
    updateQuizInState(quizId, (q) => {
      const question = q.questions.find((qu) => qu.id === questionId);
      if (!question) return q;
      const marks = computeMarks(question, state, customValue);
      const existingIdx = q.scores.findIndex((s) => s.teamId === teamId && s.questionId === questionId);
      const prevEntry = existingIdx >= 0 ? q.scores[existingIdx] : null;
      const newScores = [...q.scores];
      const entry: ScoreEntry = {
        teamId, questionId, state, marks,
        updatedAt: Date.now(), updatedBy: actorId,
      };
      if (existingIdx >= 0) newScores[existingIdx] = entry;
      else newScores.push(entry);

      const log: AuditLogEntry = {
        id: uid('log'),
        quizId, teamId, questionId,
        previousMarks: prevEntry?.marks ?? null,
        newMarks: marks,
        previousState: prevEntry?.state ?? 'unanswered',
        newState: state,
        actorRole, actorId,
        timestamp: Date.now(),
      };
      return { ...q, scores: newScores, auditLogs: [log, ...q.auditLogs].slice(0, 500) };
    });
  }, [updateQuizInState]);

  const resetTeamScores = useCallback((quizId: string, teamId: string) => {
    updateQuizInState(quizId, (q) => ({
      ...q,
      scores: q.scores.filter((s) => s.teamId !== teamId),
    }));
  }, [updateQuizInState]);

  const addInvigilator = useCallback((quizId: string, access: Partial<InvigilatorAccess>) => {
    updateQuizInState(quizId, (q) => ({
      ...q,
      invigilatorAccess: [...q.invigilatorAccess, {
        id: uid('inv'),
        code: access.code ?? 'QUIZ-0000',
        label: access.label ?? 'Invigilator',
        teamIds: access.teamIds ?? 'all',
        readOnly: access.readOnly ?? false,
        createdAt: Date.now(),
        expiresAt: access.expiresAt ?? null,
        revoked: false,
        lastUsedAt: null,
      }],
    }));
  }, [updateQuizInState]);

  const updateInvigilator = useCallback((quizId: string, accessId: string, patch: Partial<InvigilatorAccess>) => {
    updateQuizInState(quizId, (q) => ({
      ...q,
      invigilatorAccess: q.invigilatorAccess.map((a) => (a.id === accessId ? { ...a, ...patch } : a)),
    }));
  }, [updateQuizInState]);

  const revokeInvigilator = useCallback((quizId: string, accessId: string) => {
    updateQuizInState(quizId, (q) => ({
      ...q,
      invigilatorAccess: q.invigilatorAccess.map((a) => (a.id === accessId ? { ...a, revoked: true } : a)),
    }));
  }, [updateQuizInState]);

  const updateProjectorSettings = useCallback((quizId: string, settings: Partial<ProjectorSettings>) => {
    updateQuizInState(quizId, (q) => ({ ...q, projector: { ...q.projector, ...settings } }));
  }, [updateQuizInState]);

  return (
    <QuizContext.Provider
      value={{
        quizzes, activeQuizId, activeQuiz, setActiveQuizId,
        createQuiz, updateQuiz, deleteQuiz, duplicateQuiz, setQuizStatus,
        addTeam, updateTeam, deleteTeam, addMember, updateMember, deleteMember,
        addQuestion, updateQuestion, deleteQuestion, bulkAddQuestions,
        setScore, resetTeamScores,
        addInvigilator, updateInvigilator, revokeInvigilator,
        updateProjectorSettings,
        getRankedTeams, getTeamTotal,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
}

// This hook intentionally lives beside its provider so the context stays private.
// eslint-disable-next-line react-refresh/only-export-components
export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error('useQuiz must be used within QuizProvider');
  return ctx;
}
