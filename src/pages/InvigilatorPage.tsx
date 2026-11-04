import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, LogOut, Save, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { getInvigilatorSessionState, signOutInvigilator, submitInvigilatorScore, type SessionQuiz } from '@/firebase/invigilator';
import { formatMarks, getScoreEntry } from '@/utils/scoring';
import type { ScoreState } from '@/types';

const scoreStates: { value: ScoreState; label: string; symbol: string; symbolClass?: string; activeClass: string }[] = [
  { value: 'correct', label: 'Correct', symbol: '✓', activeClass: 'border-emerald-600 bg-emerald-600 text-white shadow-sm' },
  { value: 'half', label: 'Half marks', symbol: '½', symbolClass: 'text-[10px]', activeClass: 'border-amber-500 bg-amber-500 text-white shadow-sm' },
  { value: 'incorrect', label: 'Incorrect', symbol: '×', activeClass: 'border-red-500 bg-red-500 text-white shadow-sm' },
  { value: 'unanswered', label: 'Unanswered', symbol: '—', activeClass: 'border-slate-300 bg-slate-200 text-slate-500' },
];

const questionGradients = [
  'bg-gradient-to-b from-blue-50 via-white to-cyan-50/70',
  'bg-gradient-to-b from-violet-50 via-white to-fuchsia-50/60',
  'bg-gradient-to-b from-emerald-50 via-white to-teal-50/70',
  'bg-gradient-to-b from-amber-50 via-white to-orange-50/60',
];

export function InvigilatorPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<SessionQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState('');

  useEffect(() => {
    let cancelled = false;
    let refreshTimer = 0;
    const load = async (showLoading = false) => {
      if (showLoading) setLoading(true);
      try {
        const next = await getInvigilatorSessionState();
        if (cancelled) return;
        if (next.id !== quizId) throw new Error('This session belongs to a different quiz.');
        setQuiz(next);
        setError('');
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Invigilator access is unavailable.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load(true);
    refreshTimer = window.setInterval(() => void load(false), 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [quizId]);

  const isReadOnly = !quiz || quiz.sessionAccess.readOnly || quiz.status === 'completed' || quiz.status === 'paused' || quiz.status === 'archived';

  const setTeamScore = async (teamId: string, questionId: string, state: ScoreState, customValue?: number) => {
    if (isReadOnly) return;
    const key = `${teamId}-${questionId}`;
    setSaving(key);
    setError('');
    try {
      const next = await submitInvigilatorScore({ teamId, questionId, state, customValue });
      setQuiz(next);
      setCustomValues((previous) => { const updated = { ...previous }; delete updated[key]; return updated; });
    } catch (scoreError) {
      setError(scoreError instanceof Error ? scoreError.message : 'The score could not be saved.');
    } finally {
      setSaving('');
    }
  };

  const exit = async () => {
    await signOutInvigilator();
    navigate('/invigilator/login');
  };

  if (loading) return <div className="min-h-screen bg-slate-50 grid place-items-center text-slate-500">Loading secure session…</div>;
  if (!quiz) return <div className="min-h-screen bg-slate-50 grid place-items-center p-6"><div className="text-center max-w-md"><ShieldCheck className="w-12 h-12 text-red-300 mx-auto mb-3" /><h1 className="font-display font-bold text-xl text-slate-900">Access unavailable</h1><p className="text-slate-500 text-sm mt-1 mb-5">{error || 'This session is invalid, expired, or revoked.'}</p><Link to="/invigilator/login" className="text-blue-600 text-sm font-medium">Return to login</Link></div></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 bg-slate-950 text-white shadow-lg">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0"><img src="/quiz-projection-icon.png" alt="" className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-md" /><div className="min-w-0"><p className="font-display font-bold text-sm truncate">{quiz.name}</p><p className="text-xs text-slate-400">{isReadOnly ? 'Read-only view' : 'Secure scoring console'}</p></div></div>
          <button onClick={() => void exit()} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"><LogOut className="w-3.5 h-3.5" /> Exit</button>
        </div>
      </header>

      <main className="p-3 md:p-6">
        <div className="flex items-center justify-between gap-3 mb-4"><div><h1 className="font-display text-xl font-bold text-slate-900">Enter marks</h1><p className="text-sm text-slate-500">Score every assigned team in the question matrix.</p></div><Badge variant={isReadOnly ? 'amber' : 'green'}>{isReadOnly ? 'Read only' : 'Can score'}</Badge></div>
        {error && <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}

        <div className="max-h-[calc(100vh-180px)] overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-max min-w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-30">
              <tr>
                <th className="sticky left-0 z-40 w-[170px] min-w-[170px] border-b border-r border-slate-200 bg-slate-100 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600 shadow-[4px_0_8px_-6px_rgba(15,23,42,0.6)]">Team</th>
                {quiz.questions.map((question, questionIndex) => <th key={question.id} className={`min-w-[170px] border-b border-r border-slate-200 px-3 py-3 text-center text-xs font-bold text-slate-700 ${questionGradients[questionIndex % questionGradients.length]}`}>Q{question.number}<span className="block font-normal text-slate-400">{formatMarks(question.maxMarks)} max</span></th>)}
              </tr>
            </thead>
            <tbody>
              {quiz.teams.map((team, teamIndex) => (
                <tr key={team.id}>
                  <td className={`sticky left-0 z-20 w-[170px] min-w-[170px] max-w-[170px] border-b border-r border-slate-200 px-4 py-3 align-middle shadow-[4px_0_8px_-6px_rgba(15,23,42,0.6)] ${teamIndex % 2 ? 'bg-slate-50' : 'bg-white'}`}>
                    <div className="flex items-start gap-2"><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: team.color }} /><span className="break-words text-sm font-semibold leading-snug text-slate-800">{team.name}</span></div>
                  </td>
                  {quiz.questions.map((question, questionIndex) => {
                    const entry = getScoreEntry(quiz, team.id, question.id);
                    const state = entry?.state ?? 'unanswered';
                    const key = `${team.id}-${question.id}`;
                    const isSaving = saving === key;
                    const isCustomizing = customValues[key] !== undefined;
                    return <td key={question.id} className={`min-w-[170px] border-b border-r border-slate-200 px-3 py-3 text-center ${questionGradients[questionIndex % questionGradients.length]}`}>
                      {isCustomizing ? <div className="flex items-center justify-center gap-1"><input type="number" min={-question.maxMarks} max={question.maxMarks} step="0.5" value={customValues[key]} disabled={isReadOnly || isSaving} onChange={(event) => setCustomValues((previous) => ({ ...previous, [key]: event.target.value }))} onKeyDown={(event) => event.key === 'Enter' && void setTeamScore(team.id, question.id, 'custom', Number(customValues[key]))} className="w-16 rounded-lg border border-violet-300 bg-white px-2 py-1.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" autoFocus /><button title="Save custom marks" disabled={isReadOnly || isSaving || customValues[key] === ''} onClick={() => void setTeamScore(team.id, question.id, 'custom', Number(customValues[key]))} className="rounded-lg bg-violet-600 p-2 text-white disabled:opacity-40"><Save className="h-3.5 w-3.5" /></button></div> : <div className="flex items-center justify-center gap-1">
                        {scoreStates.map((item) => <button key={item.value} title={item.label} aria-label={`${item.label} for ${team.name}, question ${question.number}`} disabled={isReadOnly || isSaving} onClick={() => void setTeamScore(team.id, question.id, item.value)} className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-bold transition-all disabled:opacity-40 ${state === item.value ? item.activeClass : 'border-slate-200 bg-white/90 text-slate-400 hover:border-slate-300 hover:bg-white'}`}><span className={item.symbolClass}>{item.symbol}</span></button>)}
                        <button title="Custom marks" aria-label={`Custom marks for ${team.name}, question ${question.number}`} disabled={isReadOnly || isSaving} onClick={() => setCustomValues((previous) => ({ ...previous, [key]: entry?.marks?.toString() ?? '' }))} className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-1.5 text-xs font-bold transition-all disabled:opacity-40 ${state === 'custom' ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-200 bg-white/90 text-slate-400 hover:border-violet-300 hover:text-violet-600'}`}>{state === 'custom' ? formatMarks(entry?.marks ?? null) : '+'}</button>
                      </div>}
                    </td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
