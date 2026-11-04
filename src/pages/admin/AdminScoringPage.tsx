import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, X, Minus, Plus, Save } from 'lucide-react';
import { useQuiz } from '@/contexts/QuizContext';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/admin/AdminLayout';
import { getScoreEntry, formatMarks, getTeamTotal, getRankedTeams } from '@/utils/scoring';
import type { ScoreState } from '@/types';

const STATE_CONFIG: Record<ScoreState, { icon: typeof Check; label: string; activeClass: string }> = {
  correct: { icon: Check, label: 'Correct', activeClass: 'bg-emerald-600 text-white border-emerald-600' },
  incorrect: { icon: X, label: 'Incorrect', activeClass: 'bg-red-600 text-white border-red-600' },
  half: { icon: Minus, label: 'Half', activeClass: 'bg-amber-500 text-white border-amber-500' },
  unanswered: { icon: Minus, label: 'Unanswered', activeClass: 'bg-slate-200 text-slate-500 border-slate-200' },
  custom: { icon: Plus, label: 'Custom', activeClass: 'bg-violet-600 text-white border-violet-600' },
};

export function AdminScoringPage() {
  const { quizId } = useParams();
  const { quizzes, setScore } = useQuiz();
  const quiz = quizzes.find((q) => q.id === quizId);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  if (!quiz) return <p>Quiz not found.</p>;

  const handleSetState = (teamId: string, questionId: string, state: ScoreState) => {
    if (state === 'custom') {
      const existing = getScoreEntry(quiz, teamId, questionId);
      const currentVal = existing?.marks?.toString() ?? '';
      setCustomValues((prev) => ({ ...prev, [`${teamId}-${questionId}`]: currentVal }));
    } else {
      setScore(quiz.id, teamId, questionId, state, undefined, 'admin', 'admin');
    }
  };

  const handleSaveCustom = (teamId: string, questionId: string) => {
    const key = `${teamId}-${questionId}`;
    const val = parseFloat(customValues[key]);
    if (isNaN(val)) return;
    setScore(quiz.id, teamId, questionId, 'custom', val, 'admin', 'admin');
    setCustomValues((prev) => { const next = { ...prev }; delete next[key]; return next; });
  };

  const ranked = getRankedTeams(quiz);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Scoring" subtitle="Admin scoring — enter marks for all teams" />

      {/* Summary totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
        {ranked.slice(0, 6).map((r) => (
          <Card key={r.team.id} className="p-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.team.color }} />
              <p className="text-xs font-medium text-slate-600 truncate">#{r.rank} {r.team.name}</p>
            </div>
            <p className="text-2xl font-display font-bold text-slate-900 tabular-nums mt-1">{formatMarks(r.total)}</p>
          </Card>
        ))}
      </div>

      {/* Scoring matrix */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider sticky left-0 bg-slate-50 z-10">Team</th>
                {quiz.questions.map((q) => (
                  <th key={q.id} className="px-3 py-3 text-center text-xs font-semibold text-slate-600 min-w-[120px]">
                    Q{q.number}
                    <span className="block text-slate-400 font-normal normal-case">{formatMarks(q.maxMarks)} max</span>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider sticky right-0 bg-slate-50 z-10">Total</th>
              </tr>
            </thead>
            <tbody>
              {quiz.teams.map((team, ti) => (
                <tr key={team.id} className={ti % 2 ? 'bg-slate-50/30' : ''}>
                  <td className="px-4 py-3 sticky left-0 bg-inherit z-10">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: team.color }} />
                      <span className="text-sm font-medium text-slate-800 whitespace-nowrap">{team.name}</span>
                    </div>
                  </td>
                  {quiz.questions.map((q) => {
                    const entry = getScoreEntry(quiz, team.id, q.id);
                    const state = entry?.state ?? 'unanswered';
                    const customKey = `${team.id}-${q.id}`;
                    const isCustomizing = customValues[customKey] !== undefined;
                    return (
                      <td key={q.id} className="px-3 py-3 text-center">
                        {isCustomizing ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number" step="0.5" min="0" max={q.maxMarks}
                              value={customValues[customKey]}
                              onChange={(e) => setCustomValues((prev) => ({ ...prev, [customKey]: e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveCustom(team.id, q.id)}
                              className="w-16 px-2 py-1 text-center text-sm rounded-lg border border-violet-300 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                              autoFocus
                            />
                            <button onClick={() => handleSaveCustom(team.id, q.id)} className="p-1 rounded-lg bg-violet-600 text-white"><Save className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            {(['correct', 'half', 'incorrect', 'unanswered'] as ScoreState[]).map((s) => {
                              const cfg = STATE_CONFIG[s];
                              const Icon = cfg.icon;
                              const isActive = state === s;
                              return (
                                <button
                                  key={s}
                                  onClick={() => handleSetState(team.id, q.id, s)}
                                  className={`p-1.5 rounded-lg border transition-all ${isActive ? cfg.activeClass : 'border-slate-200 text-slate-400 hover:bg-slate-100'}`}
                                  title={cfg.label}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                </button>
                              );
                            })}
                            <button
                              onClick={() => handleSetState(team.id, q.id, 'custom')}
                              className={`px-1.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${state === 'custom' ? 'bg-violet-600 text-white border-violet-600' : 'border-slate-200 text-slate-400 hover:bg-slate-100'}`}
                              title="Custom marks"
                            >
                              {entry?.state === 'custom' ? formatMarks(entry.marks) : '+'}
                            </button>
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center sticky right-0 bg-inherit z-10">
                    <span className="text-lg font-display font-bold text-slate-900 tabular-nums">{formatMarks(getTeamTotal(quiz, team.id))}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
