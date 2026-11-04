import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Plus, Copy, Trash2, Play, Pause, CheckCircle2, Archive, Edit3, MoreVertical, Eye } from 'lucide-react';
import { useQuiz } from '@/contexts/QuizContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/admin/AdminLayout';
import type { QuizStatus } from '@/types';

function statusBadge(s: QuizStatus) {
  const map: Record<string, 'green' | 'amber' | 'gray' | 'blue' | 'red'> = {
    live: 'green', draft: 'gray', paused: 'amber', completed: 'blue', archived: 'red',
  };
  return <Badge variant={map[s]}>{s}</Badge>;
}

export function AdminQuizzesPage() {
  const { quizzes, createQuiz, deleteQuiz, duplicateQuiz, setQuizStatus, setActiveQuizId } = useQuiz();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [newQuiz, setNewQuiz] = useState({ name: '', subtitle: 'LIVE CHAMPIONSHIP LEADERBOARD', institution: '', eventDate: '' });

  const handleCreate = () => {
    if (!newQuiz.name.trim()) return;
    const id = createQuiz({
      name: newQuiz.name,
      subtitle: newQuiz.subtitle,
      institution: newQuiz.institution,
      eventDate: newQuiz.eventDate || undefined,
      projector: {
        title: newQuiz.name,
        subtitle: newQuiz.subtitle,
        institution: newQuiz.institution,
        prominentTeamCount: 5,
        animationSpeed: 'normal',
        showRanks: true,
        showScores: true,
        autoScrollOverflow: true,
        theme: 'midnight',
      },
    });
    setShowCreate(false);
    setNewQuiz({ name: '', subtitle: 'LIVE CHAMPIONSHIP LEADERBOARD', institution: '', eventDate: '' });
    navigate(`/admin/quizzes/${id}/teams`);
  };

  const statusActions: Record<QuizStatus, { label: string; icon: typeof Play; action: (id: string) => void; variant: 'green' | 'amber' | 'blue' }[]> = {
    draft: [{ label: 'Start', icon: Play, action: (id) => setQuizStatus(id, 'live'), variant: 'green' }],
    live: [
      { label: 'Pause', icon: Pause, action: (id) => setQuizStatus(id, 'paused'), variant: 'amber' },
      { label: 'Complete', icon: CheckCircle2, action: (id) => setQuizStatus(id, 'completed'), variant: 'blue' },
    ],
    paused: [
      { label: 'Resume', icon: Play, action: (id) => setQuizStatus(id, 'live'), variant: 'green' },
      { label: 'Complete', icon: CheckCircle2, action: (id) => setQuizStatus(id, 'completed'), variant: 'blue' },
    ],
    completed: [{ label: 'Reopen', icon: Play, action: (id) => setQuizStatus(id, 'live'), variant: 'green' }],
    archived: [],
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Quizzes"
        subtitle="Create and manage quiz competitions."
        actions={<Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> Create Quiz</Button>}
      />

      {quizzes.length === 0 ? (
        <Card className="p-12 text-center">
          <Trophy className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">No quizzes yet. Create your first quiz to get started.</p>
          <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> Create Quiz</Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((q) => (
            <Card key={q.id} className="p-5 flex flex-col group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-blue-500" />
                </div>
                {statusBadge(q.status)}
              </div>
              <h3 className="font-display font-bold text-slate-900 text-base mb-1 truncate">{q.name}</h3>
              <p className="text-slate-400 text-xs mb-3 truncate">{q.institution || 'No institution set'}</p>
              <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                <span>{q.teams.length} teams</span>
                <span>{q.questions.length} questions</span>
                <span>{q.scores.length} scores</span>
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => { setActiveQuizId(q.id); navigate(`/admin/quizzes/${q.id}/teams`); }}
                >
                  <Eye className="w-3.5 h-3.5" /> Open
                </Button>
                {statusActions[q.status].map((a) => (
                  <Button key={a.label} variant="outline" size="sm" onClick={() => a.action(q.id)}>
                    <a.icon className="w-3.5 h-3.5" />
                  </Button>
                ))}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === q.id ? null : q.id)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {menuOpen === q.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                      <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 w-44">
                        <button onClick={() => { duplicateQuiz(q.id); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                          <Copy className="w-4 h-4" /> Duplicate
                        </button>
                        <button onClick={() => { setActiveQuizId(q.id); navigate(`/admin/quizzes/${q.id}/settings`); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                          <Edit3 className="w-4 h-4" /> Edit details
                        </button>
                        {q.status !== 'archived' && (
                          <button onClick={() => { setQuizStatus(q.id, 'archived'); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                            <Archive className="w-4 h-4" /> Archive
                          </button>
                        )}
                        <button onClick={() => { setConfirmDelete(q.id); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Quiz">
        <div className="space-y-4">
          <Input label="Quiz Programme Name" placeholder="e.g. INTER-SCHOOL SCIENCE QUIZ 2026" value={newQuiz.name} onChange={(e) => setNewQuiz({ ...newQuiz, name: e.target.value })} autoFocus />
          <Input label="Subtitle" value={newQuiz.subtitle} onChange={(e) => setNewQuiz({ ...newQuiz, subtitle: e.target.value })} />
          <Input label="Institution / Organizer" placeholder="e.g. St. Gemma's Girls' HSS, Malappuram" value={newQuiz.institution} onChange={(e) => setNewQuiz({ ...newQuiz, institution: e.target.value })} />
          <Input label="Event Date (optional)" type="date" value={newQuiz.eventDate} onChange={(e) => setNewQuiz({ ...newQuiz, eventDate: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newQuiz.name.trim()}>Create Quiz</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Delete Quiz" size="sm">
        <p className="text-slate-600 text-sm mb-5">Are you sure you want to delete this quiz? This will remove all teams, questions, and scores. This action cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (confirmDelete) deleteQuiz(confirmDelete); setConfirmDelete(null); }}>
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
