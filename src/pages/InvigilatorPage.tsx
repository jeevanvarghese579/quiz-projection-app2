import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, X, Minus, LogOut, ShieldCheck, Save, Trophy, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { getInvigilatorSessionState, signOutInvigilator, submitInvigilatorScore, type SessionQuiz } from '@/firebase/invigilator';
import { getScoreEntry, formatMarks, getTeamTotal } from '@/utils/scoring';
import type { ScoreState } from '@/types';

const states: { value: ScoreState; label: string; icon: typeof Check; classes: string }[] = [
  { value: 'correct', label: 'Correct', icon: Check, classes: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  { value: 'half', label: 'Half', icon: Minus, classes: 'border-amber-300 bg-amber-50 text-amber-700' },
  { value: 'incorrect', label: 'Incorrect', icon: X, classes: 'border-red-300 bg-red-50 text-red-700' },
  { value: 'unanswered', label: 'Unanswered', icon: Minus, classes: 'border-slate-200 bg-slate-50 text-slate-500' },
];

export function InvigilatorPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<SessionQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [custom, setCustom] = useState<Record<string, string>>({});
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

  const allowedTeams = useMemo(() => quiz?.teams ?? [], [quiz]);
  const selectedTeam = allowedTeams.find((team) => team.id === (selectedTeamId || allowedTeams[0]?.id));
  const isReadOnly = !quiz || quiz.sessionAccess.readOnly || quiz.status === 'completed' || quiz.status === 'paused' || quiz.status === 'archived';

  const setTeamScore = async (questionId: string, state: ScoreState, customValue?: number) => {
    if (!selectedTeam || isReadOnly) return;
    const key = `${selectedTeam.id}-${questionId}`;
    setSaving(key);
    setError('');
    try {
      const next = await submitInvigilatorScore({ teamId: selectedTeam.id, questionId, state, customValue });
      setQuiz(next);
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
      <header className="sticky top-0 z-20 bg-slate-950 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0"><div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0"><Trophy className="w-4 h-4" /></div><div className="min-w-0"><p className="font-display font-bold text-sm truncate">{quiz.name}</p><p className="text-xs text-slate-400">{isReadOnly ? 'Read-only view' : 'Secure scoring console'}</p></div></div>
          <button onClick={() => void exit()} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"><LogOut className="w-3.5 h-3.5" /> Exit</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between gap-3 mb-4"><div><h1 className="font-display text-xl font-bold text-slate-900">Enter marks</h1><p className="text-sm text-slate-500">Choose a team, then tap a result for each question.</p></div><Badge variant={isReadOnly ? 'amber' : 'green'}>{isReadOnly ? 'Read only' : 'Can score'}</Badge></div>
        {error && <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}

        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {allowedTeams.map((team) => { const active = selectedTeam?.id === team.id; return <button key={team.id} onClick={() => setSelectedTeamId(team.id)} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border whitespace-nowrap text-sm font-medium transition-all ${active ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: team.color }} />{team.name}<span className="text-xs text-slate-400">{formatMarks(getTeamTotal(quiz, team.id))}</span></button>; })}
        </div>

        {selectedTeam && <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm"><span className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedTeam.color }} /><div className="flex-1"><p className="font-display font-bold text-slate-900">{selectedTeam.name}</p><p className="text-xs text-slate-400">{selectedTeam.institution}</p></div><div className="text-right"><p className="text-xs text-slate-400">Total</p><p className="text-xl font-display font-bold text-slate-900 tabular-nums">{formatMarks(getTeamTotal(quiz, selectedTeam.id))}</p></div></div>
          {quiz.questions.map((question) => {
            const entry = getScoreEntry(quiz, selectedTeam.id, question.id);
            const key = `${selectedTeam.id}-${question.id}`;
            const customValue = custom[key] ?? '';
            const isSaving = saving === key;
            return <div key={question.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"><div className="flex items-center justify-between mb-3"><div><p className="font-display font-bold text-slate-900">Question {question.number}</p><p className="text-xs text-slate-400">Maximum {formatMarks(question.maxMarks)} marks</p></div><span className="text-lg font-display font-bold text-slate-700 tabular-nums">{isSaving ? 'Saving…' : formatMarks(entry?.marks ?? null)}</span></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{states.map((item) => { const Icon = item.icon; const active = (entry?.state ?? 'unanswered') === item.value; return <button key={item.value} disabled={isReadOnly || isSaving} onClick={() => void setTeamScore(question.id, item.value)} className={`min-h-12 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-all disabled:opacity-50 ${active ? `${item.classes} ring-2 ring-offset-1 ring-slate-300` : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}><Icon className="w-4 h-4" />{item.label}</button>; })}</div><div className="mt-3 flex items-center gap-2"><Input type="number" min={-question.maxMarks} max={question.maxMarks} step="0.5" placeholder="Custom marks" value={customValue} disabled={isReadOnly || isSaving} onChange={(event) => setCustom((previous) => ({ ...previous, [key]: event.target.value }))} /><Button size="sm" variant="outline" disabled={isReadOnly || isSaving || customValue === ''} onClick={() => void setTeamScore(question.id, 'custom', Number(customValue))}><Save className="w-3.5 h-3.5" /> Set custom</Button></div></div>;
          })}
        </div>}
      </main>
    </div>
  );
}
