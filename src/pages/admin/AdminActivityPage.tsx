import { useParams } from 'react-router-dom';
import { ScrollText, ArrowUpDown } from 'lucide-react';
import { useQuiz } from '@/contexts/QuizContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/admin/AdminLayout';
import { formatMarks } from '@/utils/scoring';

export function AdminActivityPage() {
  const { quizId } = useParams();
  const { quizzes } = useQuiz();
  const quiz = quizzes.find((q) => q.id === quizId);

  if (!quiz) return <p>Quiz not found.</p>;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Activity Logs" subtitle="Audit trail of all scoring changes" />

      {quiz.auditLogs.length === 0 ? (
        <Card className="p-12 text-center">
          <ScrollText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">No activity logged yet.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Team</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Question</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Change</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actor</th>
                </tr>
              </thead>
              <tbody>
                {quiz.auditLogs.slice(0, 100).map((log) => {
                  const team = quiz.teams.find((t) => t.id === log.teamId);
                  const question = quiz.questions.find((q) => q.id === log.questionId);
                  return (
                    <tr key={log.id} className="border-b border-slate-100">
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: team?.color ?? '#94a3b8' }} />
                          <span className="text-sm text-slate-700">{team?.name ?? 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">Q{question?.number ?? '?'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-400 tabular-nums">{formatMarks(log.previousMarks)}</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                          <span className="text-sm font-medium text-slate-700 tabular-nums">{formatMarks(log.newMarks)}</span>
                          <Badge variant={log.newState === 'correct' ? 'green' : log.newState === 'incorrect' ? 'red' : log.newState === 'half' ? 'amber' : 'gray'}>
                            {log.newState}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={log.actorRole === 'admin' ? 'purple' : 'blue'}>{log.actorRole}</Badge>
                          <span className="text-xs text-slate-400 font-mono">{log.actorId.slice(0, 12)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
