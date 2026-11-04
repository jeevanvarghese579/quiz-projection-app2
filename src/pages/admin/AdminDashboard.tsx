import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Users, HelpCircle, Monitor, Crown, Plus, Radio, CheckCircle2, Layers } from 'lucide-react';
import { useQuiz } from '@/contexts/QuizContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getRankedTeams, formatMarks } from '@/utils/scoring';

export function AdminDashboard() {
  const { quizzes, activeQuiz, setActiveQuizId } = useQuiz();
  const navigate = useNavigate();

  const totalTeams = quizzes.reduce((s, q) => s + q.teams.length, 0);
  const totalStudents = quizzes.reduce((s, q) => s + q.teams.reduce((s2, t) => s2 + t.members.length, 0), 0);
  const totalQuestions = quizzes.reduce((s, q) => s + q.questions.length, 0);
  const liveCount = quizzes.filter((q) => q.status === 'live').length;
  const completedCount = quizzes.filter((q) => q.status === 'completed').length;

  const ranked = activeQuiz ? getRankedTeams(activeQuiz) : [];
  const leadingTeam = ranked[0];

  const recentLogs = activeQuiz?.auditLogs.slice(0, 5) ?? [];

  const stats = [
    { label: 'Total Quizzes', value: quizzes.length, icon: Trophy, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Live Quizzes', value: liveCount, icon: Radio, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Completed', value: completedCount, icon: CheckCircle2, color: 'text-slate-600', bg: 'bg-slate-100' },
    { label: 'Total Teams', value: totalTeams, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Total Students', value: totalStudents, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Questions', value: totalQuestions, icon: HelpCircle, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Overview of your quiz competitions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/about')}>
            About
          </Button>
          <Button onClick={() => navigate('/admin/quizzes')}>
            <Plus className="w-4 h-4" /> Create Quiz
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-display font-bold text-slate-900 tabular-nums">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Leading team + recent activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        {activeQuiz && (
          <Card className="p-6 lg:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-800">
            <div className="flex items-center gap-2 text-amber-400 mb-4">
              <Crown className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Current Leader</span>
            </div>
            {leadingTeam ? (
              <>
                <p className="font-display text-2xl font-bold mb-1">{leadingTeam.team.name}</p>
                <p className="text-slate-400 text-sm mb-4">{leadingTeam.team.institution}</p>
                <div className="flex items-end gap-6">
                  <div>
                    <p className="text-slate-400 text-xs">Total Marks</p>
                    <p className="text-3xl font-display font-extrabold text-amber-400 tabular-nums">{formatMarks(leadingTeam.total)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Rank</p>
                    <p className="text-3xl font-display font-extrabold text-slate-300 tabular-nums">#{leadingTeam.rank}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-slate-400">No scores yet.</p>
            )}
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <Link to={`/projector/${activeQuiz.id}`} className="inline-flex items-center gap-2 text-cyan-400 text-sm font-medium hover:text-cyan-300">
                <Monitor className="w-4 h-4" /> Open Projector
              </Link>
            </div>
          </Card>
        )}

        <Card className="p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-slate-400" /> Recent Scoring Activity
          </h2>
          {recentLogs.length > 0 ? (
            <div className="space-y-2">
              {recentLogs.map((log) => {
                const team = activeQuiz?.teams.find((t) => t.id === log.teamId);
                const question = activeQuiz?.questions.find((q) => q.id === log.questionId);
                return (
                  <div key={log.id} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: team?.color ?? '#94a3b8' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">
                        <span className="font-medium">{team?.name ?? 'Unknown'}</span> — Q{question?.number ?? '?'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {log.previousMarks !== null ? formatMarks(log.previousMarks) : '—'} → {formatMarks(log.newMarks)} · {log.actorRole}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-400 text-sm py-8 text-center">No scoring activity yet.</p>
          )}
        </Card>
      </div>

      {/* Quiz list preview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-slate-900">Your Quizzes</h2>
          <Link to="/admin/quizzes" className="text-sm text-blue-600 font-medium hover:text-blue-700">View all →</Link>
        </div>
        <div className="space-y-2">
          {quizzes.slice(0, 5).map((q) => (
            <div
              key={q.id}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => { setActiveQuizId(q.id); navigate(`/admin/quizzes/${q.id}/teams`); }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{q.name}</p>
                  <p className="text-xs text-slate-400">{q.teams.length} teams · {q.questions.length} questions</p>
                </div>
              </div>
              <Badge variant={q.status === 'live' ? 'green' : q.status === 'completed' ? 'blue' : q.status === 'paused' ? 'amber' : 'gray'}>
                {q.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
