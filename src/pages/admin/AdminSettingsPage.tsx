import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Save, Settings2, Monitor } from 'lucide-react';
import { useQuiz } from '@/contexts/QuizContext';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Toggle } from '@/components/ui/Input';
import { PageHeader } from '@/components/admin/AdminLayout';

export function AdminSettingsPage() {
  const { quizId } = useParams();
  const { quizzes, updateQuiz, updateProjectorSettings, setQuizStatus } = useQuiz();
  const quiz = quizzes.find((q) => q.id === quizId);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(() => ({
    name: quiz?.name ?? '', subtitle: quiz?.subtitle ?? '', institution: quiz?.institution ?? '',
    eventDate: quiz?.eventDate ?? '', status: quiz?.status ?? 'draft',
  }));
  const [projector, setProjector] = useState(() => quiz?.projector ?? {
    title: '', subtitle: '', institution: '', prominentTeamCount: 5, animationSpeed: 'normal' as const,
    showRanks: true, showScores: true, autoScrollOverflow: true, theme: 'midnight' as const,
  });

  if (!quiz) return <p>Quiz not found.</p>;

  const handleSaveQuiz = () => {
    updateQuiz(quiz.id, {
      name: form.name,
      subtitle: form.subtitle,
      institution: form.institution,
      eventDate: form.eventDate || undefined,
    });
    updateProjectorSettings(quiz.id, { title: form.name, subtitle: form.subtitle, institution: form.institution });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveProjector = () => {
    updateProjectorSettings(quiz.id, projector);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Settings" subtitle="Configure quiz details and projector appearance" />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings2 className="w-5 h-5 text-slate-400" /> Quiz Details</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input label="Quiz Programme Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            <Input label="Institution / Organizer" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Event Date" type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
              <Select label="Status" value={form.status} onChange={(e) => { setForm({ ...form, status: e.target.value as typeof form.status }); setQuizStatus(quiz.id, e.target.value as typeof form.status); }}>
                <option value="draft">Draft</option>
                <option value="live">Live</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSaveQuiz}><Save className="w-4 h-4" /> {saved ? 'Saved!' : 'Save Details'}</Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Monitor className="w-5 h-5 text-slate-400" /> Projector Appearance</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input label="Projector Title" value={projector.title} onChange={(e) => setProjector({ ...projector, title: e.target.value })} />
            <Input label="Projector Subtitle" value={projector.subtitle} onChange={(e) => setProjector({ ...projector, subtitle: e.target.value })} />
            <Input label="Institution (projector)" value={projector.institution} onChange={(e) => setProjector({ ...projector, institution: e.target.value })} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Select label="Theme" value={projector.theme} onChange={(e) => setProjector({ ...projector, theme: e.target.value as typeof projector.theme })}>
                <option value="midnight">Midnight Blue</option>
                <option value="royal">Royal Indigo</option>
                <option value="emerald">Emerald Dark</option>
                <option value="sunset">Sunset Gold</option>
              </Select>
              <Select label="Animation Speed" value={projector.animationSpeed} onChange={(e) => setProjector({ ...projector, animationSpeed: e.target.value as typeof projector.animationSpeed })}>
                <option value="instant">Instant</option>
                <option value="fast">Fast</option>
                <option value="normal">Normal</option>
                <option value="slow">Slow</option>
              </Select>
              <Input label="Prominent Teams (main panel)" type="number" min="1" max="20" value={projector.prominentTeamCount} onChange={(e) => setProjector({ ...projector, prominentTeamCount: Math.max(1, Math.min(20, parseInt(e.target.value) || 5)) })} />
            </div>
            <div className="space-y-3 pt-2">
              <Toggle label="Show Ranks" checked={projector.showRanks} onChange={(v) => setProjector({ ...projector, showRanks: v })} />
              <Toggle label="Show Scores" checked={projector.showScores} onChange={(v) => setProjector({ ...projector, showScores: v })} />
              <Toggle label="Auto-scroll overflow panel" checked={projector.autoScrollOverflow} onChange={(v) => setProjector({ ...projector, autoScrollOverflow: v })} description="Automatically scroll the right-side panel to show all teams" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSaveProjector}><Save className="w-4 h-4" /> {saved ? 'Saved!' : 'Save Projector Settings'}</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
