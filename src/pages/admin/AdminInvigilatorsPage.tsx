import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, KeyRound, Trash2, Eye, EyeOff, Copy, Clock, Check, Users, ShieldAlert } from 'lucide-react';
import { useQuiz } from '@/contexts/QuizContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Toggle } from '@/components/ui/Input';
import { PageHeader } from '@/components/admin/AdminLayout';
import { createInvigilatorCode, revokeInvigilatorSession } from '@/firebase/invigilator';

export function AdminInvigilatorsPage() {
  const { quizId } = useParams();
  const { quizzes, updateQuiz } = useQuiz();
  const quiz = quizzes.find((q) => q.id === quizId);
  const [showAdd, setShowAdd] = useState(false);
  const [showCodes, setShowCodes] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ label: '', code: '', teamIds: 'all' as string[] | 'all', readOnly: false, expiresAt: '' });
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!quiz) return <p>Quiz not found.</p>;

  const handleAdd = async () => {
    const customCode = form.code.trim().toUpperCase();
    if (customCode && !/^[A-Z0-9-]{6,48}$/.test(customCode)) {
      setError('Custom codes must contain 6–48 letters, numbers, or hyphens.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await createInvigilatorCode({
        quizId: quiz.id,
        code: customCode || undefined,
        label: form.label || `Invigilator ${quiz.invigilatorAccess.length + 1}`,
        teamIds: form.teamIds,
        readOnly: form.readOnly,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).getTime() : null,
      });
      setForm({ label: '', code: '', teamIds: 'all', readOnly: false, expiresAt: '' });
      setShowAdd(false);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create the access code.');
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirmRevoke) return;
    setBusy(true);
    setError('');
    try {
      await revokeInvigilatorSession(quiz.id, confirmRevoke);
      setConfirmRevoke(null);
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : 'Could not revoke the access code.');
    } finally {
      setBusy(false);
    }
  };

  const toggleTeam = (teamId: string) => {
    if (form.teamIds === 'all') { setForm({ ...form, teamIds: [teamId] }); return; }
    if (form.teamIds.includes(teamId)) { setForm({ ...form, teamIds: form.teamIds.filter((t) => t !== teamId) }); }
    else { setForm({ ...form, teamIds: [...form.teamIds, teamId] }); }
  };

  const toggleCode = (id: string) => {
    setShowCodes((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Invigilators"
        subtitle="Manage access codes and team permissions"
        actions={<Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Create Access Code</Button>}
      />

      <Card className="p-4 mb-4 bg-blue-50/50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-slate-800">Invigilator Login</p>
              <p className="text-xs text-slate-500">Allow invigilators to score teams with access codes</p>
            </div>
          </div>
          <Toggle label="" checked={quiz.invigilatorLoginEnabled} onChange={(v) => updateQuiz(quiz.id, { invigilatorLoginEnabled: v })} />
        </div>
      </Card>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {quiz.invigilatorAccess.length === 0 ? (
        <Card className="p-12 text-center">
          <KeyRound className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">No access codes created yet. Generate codes for invigilators.</p>
          <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Create Access Code</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {quiz.invigilatorAccess.map((access) => {
            const isExpired = access.expiresAt !== null && access.expiresAt < Date.now();
            const isRevoked = access.revoked;
            const isActive = !isExpired && !isRevoked;
            const showCode = showCodes.has(access.id);
            const assignedTeams = access.teamIds === 'all' ? quiz.teams : quiz.teams.filter((t) => access.teamIds.includes(t.id));
            return (
              <Card key={access.id} className={`p-4 ${isRevoked ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-slate-900">{access.label}</p>
                      {isActive && <Badge variant="green">Active</Badge>}
                      {isExpired && <Badge variant="amber">Expired</Badge>}
                      {isRevoked && <Badge variant="red">Revoked</Badge>}
                      {access.readOnly && <Badge variant="blue">Read-only</Badge>}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="px-2 py-1 rounded-lg bg-slate-100 text-sm font-mono font-semibold text-slate-700">
                        {showCode ? access.code : '••••-••••'}
                      </code>
                      <button onClick={() => toggleCode(access.id)} className="p-1 text-slate-400 hover:text-slate-600">
                        {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button onClick={() => copyCode(access.code)} className="p-1 text-slate-400 hover:text-slate-600"><Copy className="w-4 h-4" /></button>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {access.teamIds === 'all' ? 'All teams' : `${assignedTeams.length} teams`}</span>
                      {access.expiresAt && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Expires {new Date(access.expiresAt).toLocaleDateString()}</span>}
                      {access.lastUsedAt && <span>Last used {new Date(access.lastUsedAt).toLocaleTimeString()}</span>}
                    </div>
                  </div>
                  {isActive && (
                    <button onClick={() => setConfirmRevoke(access.id)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="Revoke">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create Access Code">
        <div className="space-y-4">
          <Input label="Label (optional)" placeholder="e.g. Invigilator A" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <Input
            label="Custom access code (optional)"
            placeholder="e.g. SCIENCE-2026"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
            minLength={6}
            maxLength={48}
            pattern="[A-Z0-9-]{6,48}"
            autoComplete="off"
            spellCheck={false}
            hint="Use 6–48 letters, numbers, or hyphens. Leave blank to generate a secure code."
          />
          <Input label="Expiration Date (optional)" type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Assigned Teams</label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              <button
                onClick={() => setForm({ ...form, teamIds: 'all' })}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${form.teamIds === 'all' ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                <span>All Teams</span>
                {form.teamIds === 'all' && <Check className="w-4 h-4" />}
              </button>
              {quiz.teams.map((t) => {
                const selected = form.teamIds !== 'all' && form.teamIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => toggleTeam(t.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${selected ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded" style={{ backgroundColor: t.color }} />
                      {t.name}
                    </span>
                    {selected && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>
          <Toggle label="Read-only access" checked={form.readOnly} onChange={(v) => setForm({ ...form, readOnly: v })} description="Invigilator can view scores but cannot enter marks" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => void handleAdd()} disabled={busy}>{busy ? 'Creating…' : 'Create Code'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={confirmRevoke !== null} onClose={() => setConfirmRevoke(null)} title="Revoke Access Code" size="sm">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200 mb-4">
          <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">Revoking this code will immediately prevent the invigilator from accessing the quiz. Active sessions will be terminated.</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmRevoke(null)}>Cancel</Button>
          <Button variant="danger" disabled={busy} onClick={() => void handleRevoke()}>{busy ? 'Revoking…' : 'Revoke'}</Button>
        </div>
      </Modal>
    </div>
  );
}
