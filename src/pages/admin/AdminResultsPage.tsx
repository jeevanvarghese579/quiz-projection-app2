import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Papa from 'papaparse';
import { Download, RotateCcw, Crown, Check, X, Minus, HelpCircle, Printer } from 'lucide-react';
import { useQuiz } from '@/contexts/QuizContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/admin/AdminLayout';
import { getRankedTeams, getScoreEntry, formatMarks } from '@/utils/scoring';

export function AdminResultsPage() {
  const { quizId } = useParams();
  const { quizzes, resetTeamScores, setScore } = useQuiz();
  const quiz = quizzes.find((q) => q.id === quizId);
  const [confirmReset, setConfirmReset] = useState<string | null>(null);

  if (!quiz) return <p>Quiz not found.</p>;

  const ranked = getRankedTeams(quiz);

  const exportCSV = () => {
    const rows = ranked.map((r) => {
      const questionScores: Record<string, string> = {};
      quiz.questions.forEach((q) => {
        const entry = getScoreEntry(quiz, r.team.id, q.id);
        questionScores[`Q${q.number}`] = entry?.marks !== null && entry?.marks !== undefined ? formatMarks(entry.marks) : '';
      });
      return {
        Rank: r.rank, Team: r.team.name, Institution: r.team.institution ?? '',
        ...questionScores,
        Total: formatMarks(r.total),
        Correct: r.correctCount, Incorrect: r.incorrectCount, Half: r.halfCount, Unanswered: r.unansweredCount,
      };
    });
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${quiz.name.replace(/\s+/g, '_')}_results.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => window.print();

  const rankAccents: Record<number, string> = {
    1: 'from-amber-400 to-amber-500',
    2: 'from-slate-300 to-slate-400',
    3: 'from-orange-400 to-orange-500',
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Results"
        subtitle="Detailed scoring breakdown and rankings"
        actions={
          <>
            <Button variant="outline" onClick={printReport}><Printer className="w-4 h-4" /> Print</Button>
            <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4" /> Export CSV</Button>
          </>
        }
      />

      {/* Podium */}
      {ranked.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 0, 2].map((idx) => {
            const r = ranked[idx];
            if (!r) return <div key={idx} />;
            const heights = ['h-32', 'h-40', 'h-24'];
            const accents: Record<number, string> = { 1: 'from-amber-400 to-amber-500', 2: 'from-slate-300 to-slate-400', 3: 'from-orange-400 to-orange-500' };
            return (
              <div key={r.team.id} className={`flex flex-col justify-end ${heights[idx === 0 ? 1 : idx === 1 ? 0 : 2]}`}>
                <Card className="p-4 text-center border-0 shadow-lg" >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accents[r.rank]} flex items-center justify-center mx-auto mb-2 shadow-md`}>
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-display font-bold text-slate-900 text-sm truncate">{r.team.name}</p>
                  <p className="text-2xl font-display font-extrabold text-slate-900 tabular-nums">{formatMarks(r.total)}</p>
                  <p className="text-xs text-slate-400">Rank #{r.rank}</p>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Results table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Team</th>
                {quiz.questions.map((q) => (
                  <th key={q.id} className="px-3 py-3 text-center text-xs font-semibold text-slate-600">Q{q.number}</th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Total</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase"><Check className="w-3.5 h-3.5 inline text-emerald-500" /></th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase"><X className="w-3.5 h-3.5 inline text-red-500" /></th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase"><Minus className="w-3.5 h-3.5 inline text-amber-500" /></th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase"><HelpCircle className="w-3.5 h-3.5 inline text-slate-400" /></th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r, i) => (
                <tr key={r.team.id} className={`border-b border-slate-100 ${i % 2 ? 'bg-slate-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm ${rankAccents[r.rank] ? `bg-gradient-to-br ${rankAccents[r.rank]} text-white` : 'bg-slate-100 text-slate-500'}`}>
                      {r.rank}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.team.color }} />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{r.team.name}</p>
                        <p className="text-xs text-slate-400">{r.team.institution}</p>
                      </div>
                    </div>
                  </td>
                  {quiz.questions.map((q) => {
                    const entry = getScoreEntry(quiz, r.team.id, q.id);
                    const val = entry?.marks !== null && entry?.marks !== undefined ? formatMarks(entry.marks) : '—';
                    const stateColor = entry?.state === 'correct' ? 'text-emerald-600 font-medium' : entry?.state === 'incorrect' ? 'text-red-500' : entry?.state === 'half' ? 'text-amber-600 font-medium' : entry?.state === 'custom' ? 'text-violet-600 font-medium' : 'text-slate-300';
                    return <td key={q.id} className={`px-3 py-3 text-center text-sm tabular-nums ${stateColor}`}>{val}</td>;
                  })}
                  <td className="px-4 py-3 text-center">
                    <span className="text-lg font-display font-bold text-slate-900 tabular-nums">{formatMarks(r.total)}</span>
                  </td>
                  <td className="px-3 py-3 text-center text-sm text-emerald-600 font-medium tabular-nums">{r.correctCount}</td>
                  <td className="px-3 py-3 text-center text-sm text-red-500 tabular-nums">{r.incorrectCount}</td>
                  <td className="px-3 py-3 text-center text-sm text-amber-600 font-medium tabular-nums">{r.halfCount}</td>
                  <td className="px-3 py-3 text-center text-sm text-slate-400 tabular-nums">{r.unansweredCount}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {quiz.questions.map((q) => {
                        const entry = getScoreEntry(quiz, r.team.id, q.id);
                        if (!entry || entry.state === 'unanswered') return null;
                        return (
                          <button
                            key={q.id}
                            onClick={() => setScore(quiz.id, r.team.id, q.id, 'unanswered', undefined, 'admin', 'admin')}
                            className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            title={`Reset Q${q.number}`}
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setConfirmReset(r.team.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Reset all scores"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={confirmReset !== null} onClose={() => setConfirmReset(null)} title="Reset Team Scores" size="sm">
        <p className="text-slate-600 text-sm mb-5">This will reset all scores for this team to unanswered. This cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmReset(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (confirmReset) resetTeamScores(quiz.id, confirmReset); setConfirmReset(null); }}>
            <RotateCcw className="w-4 h-4" /> Reset Scores
          </Button>
        </div>
      </Modal>
    </div>
  );
}
