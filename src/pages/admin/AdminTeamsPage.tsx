import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Papa from 'papaparse';
import { Plus, Users, Trash2, Edit3, Download, Upload, ChevronDown, ChevronUp, UserPlus, X } from 'lucide-react';
import { useQuiz } from '@/contexts/QuizContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/admin/AdminLayout';

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
];

export function AdminTeamsPage() {
  const { quizId } = useParams();
  const { quizzes, addTeam, updateTeam, deleteTeam, addMember, updateMember, deleteMember } = useQuiz();
  const quiz = quizzes.find((q) => q.id === quizId);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<{ teamId: string; memberId: string } | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importPreview, setImportPreview] = useState<{ team_name: string; team_color: string; student_name: string; student_id: string; class: string; institution: string }[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [teamForm, setTeamForm] = useState({ name: '', color: PRESET_COLORS[0], institution: '' });
  const [memberForm, setMemberForm] = useState({ name: '', studentId: '', className: '', institution: '' });
  const [teamEditForm, setTeamEditForm] = useState({ name: '', color: PRESET_COLORS[0], institution: '' });
  const [memberEditForm, setMemberEditForm] = useState({ name: '', studentId: '', className: '', institution: '' });

  if (!quiz) return <p>Quiz not found.</p>;

  const handleAddTeam = () => {
    if (!teamForm.name.trim()) return;
    addTeam(quiz.id, { name: teamForm.name, color: teamForm.color, institution: teamForm.institution });
    setTeamForm({ name: '', color: PRESET_COLORS[0], institution: '' });
    setShowAddTeam(false);
  };

  const handleAddMember = (teamId: string) => {
    if (!memberForm.name.trim()) return;
    addMember(quiz.id, teamId, {
      name: memberForm.name,
      studentId: memberForm.studentId || undefined,
      className: memberForm.className || undefined,
      institution: memberForm.institution || undefined,
    });
    setMemberForm({ name: '', studentId: '', className: '', institution: '' });
  };

  const exportCSV = () => {
    const rows: Record<string, string>[] = [];
    quiz.teams.forEach((t) => {
      if (t.members.length === 0) {
        rows.push({ team_name: t.name, team_color: t.color, student_name: '', student_id: '', class: '', institution: t.institution ?? '' });
      } else {
        t.members.forEach((m) => {
          rows.push({
            team_name: t.name, team_color: t.color,
            student_name: m.name, student_id: m.studentId ?? '', class: m.className ?? '', institution: m.institution ?? '',
          });
        });
      }
    });
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quiz.name.replace(/\s+/g, '_')}_teams.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setImportPreview(results.data as { team_name: string; team_color: string; student_name: string; student_id: string; class: string; institution: string }[]);
      },
    });
  };

  const confirmImport = () => {
    if (!importPreview) return;
    const teamMap = new Map<string, { id: string; color: string; institution: string }>();
    importPreview.forEach((row) => {
      if (!teamMap.has(row.team_name)) {
        const id = `import-${row.team_name.replace(/\s+/g, '-')}`;
        teamMap.set(row.team_name, { id, color: row.team_color || PRESET_COLORS[teamMap.size % PRESET_COLORS.length], institution: row.institution });
        addTeam(quiz.id, { name: row.team_name, color: row.team_color || PRESET_COLORS[teamMap.size % PRESET_COLORS.length], institution: row.institution });
      }
      if (row.student_name) {
        addMember(quiz.id, teamMap.get(row.team_name)!.id, {
          name: row.student_name, studentId: row.student_id || undefined, className: row.class || undefined, institution: row.institution || undefined,
        });
      }
    });
    setImportPreview(null);
    setShowImport(false);
  };

  const downloadSampleCSV = () => {
    const sample = `team_name,team_color,student_name,student_id,class,institution
Team Alpha,#3B82F6,Student One,101,12A,School A
Team Alpha,#3B82F6,Student Two,102,12A,School A
Team Beta,#10B981,Student Three,103,12B,School B`;
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sample_teams.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Teams & Students"
        subtitle={`${quiz.teams.length} teams · ${quiz.teams.reduce((s, t) => s + t.members.length, 0)} students`}
        actions={
          <>
            <Button variant="outline" onClick={downloadSampleCSV}><Download className="w-4 h-4" /> Sample CSV</Button>
            <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4" /> Export</Button>
            <Button variant="outline" onClick={() => setShowImport(true)}><Upload className="w-4 h-4" /> Import</Button>
            <Button onClick={() => setShowAddTeam(true)}><Plus className="w-4 h-4" /> Add Team</Button>
          </>
        }
      />

      {quiz.teams.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">No teams yet. Add teams manually or import from CSV.</p>
          <div className="flex items-center justify-center gap-2">
            <Button onClick={() => setShowAddTeam(true)}><Plus className="w-4 h-4" /> Add Team</Button>
            <Button variant="outline" onClick={() => setShowImport(true)}><Upload className="w-4 h-4" /> Import CSV</Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {quiz.teams.map((team) => (
            <Card key={team.id} className="overflow-hidden">
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
              >
                <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white font-display font-bold" style={{ backgroundColor: team.color }}>
                  {team.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{team.name}</p>
                  <p className="text-xs text-slate-400">{team.members.length} members · {team.institution || 'No institution'}</p>
                </div>
                {expandedTeam === team.id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </div>

              {expandedTeam === team.id && (
                <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-700">Team Members</h4>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setTeamEditForm({ name: team.name, color: team.color, institution: team.institution ?? '' }); setEditingTeam(team.id); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm(`Delete ${team.name}?`)) deleteTeam(quiz.id, team.id); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  {team.members.length === 0 ? (
                    <p className="text-sm text-slate-400 py-2">No members yet.</p>
                  ) : (
                    <div className="space-y-1.5 mb-3">
                      {team.members.map((m) => (
                        <div key={m.id} className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-slate-100">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{m.name}</p>
                            <p className="text-xs text-slate-400">{[m.studentId, m.className, m.institution].filter(Boolean).join(' · ') || 'No details'}</p>
                          </div>
                          <button onClick={() => { setMemberEditForm({ name: m.name, studentId: m.studentId ?? '', className: m.className ?? '', institution: m.institution ?? '' }); setEditingMember({ teamId: team.id, memberId: m.id }); }} className="p-1 rounded text-slate-400 hover:bg-slate-100"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteMember(quiz.id, team.id, m.id)} className="p-1 rounded text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Quick add member */}
                  <div className="flex gap-2 items-end">
                    <Input placeholder="Member name" value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} className="flex-1" />
                    <Input placeholder="ID" value={memberForm.studentId} onChange={(e) => setMemberForm({ ...memberForm, studentId: e.target.value })} className="w-20" />
                    <Input placeholder="Class" value={memberForm.className} onChange={(e) => setMemberForm({ ...memberForm, className: e.target.value })} className="w-20" />
                    <Button size="sm" onClick={() => handleAddMember(team.id)}><UserPlus className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add team modal */}
      <Modal open={showAddTeam} onClose={() => setShowAddTeam(false)} title="Add Team">
        <div className="space-y-4">
          <Input label="Team Name" placeholder="e.g. Team Alpha" value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} autoFocus />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Team Color</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button key={c} onClick={() => setTeamForm({ ...teamForm, color: c })} className={`w-9 h-9 rounded-xl transition-all ${teamForm.color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`} style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={teamForm.color} onChange={(e) => setTeamForm({ ...teamForm, color: e.target.value })} className="w-9 h-9 rounded-xl cursor-pointer" />
            </div>
          </div>
          <Input label="Institution (optional)" value={teamForm.institution} onChange={(e) => setTeamForm({ ...teamForm, institution: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowAddTeam(false)}>Cancel</Button>
            <Button onClick={handleAddTeam}>Add Team</Button>
          </div>
        </div>
      </Modal>

      {/* Edit team modal */}
      <Modal open={editingTeam !== null} onClose={() => setEditingTeam(null)} title="Edit Team">
        <div className="space-y-4">
          <Input label="Team Name" value={teamEditForm.name} onChange={(e) => setTeamEditForm({ ...teamEditForm, name: e.target.value })} />
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Team Color</label><div className="flex flex-wrap gap-2">{PRESET_COLORS.map((c) => <button key={c} onClick={() => setTeamEditForm({ ...teamEditForm, color: c })} className={`w-9 h-9 rounded-xl transition-all ${teamEditForm.color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`} style={{ backgroundColor: c }} />)}<input type="color" value={teamEditForm.color} onChange={(e) => setTeamEditForm({ ...teamEditForm, color: e.target.value })} className="w-9 h-9 rounded-xl cursor-pointer" /></div></div>
          <Input label="Institution" value={teamEditForm.institution} onChange={(e) => setTeamEditForm({ ...teamEditForm, institution: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setEditingTeam(null)}>Cancel</Button><Button onClick={() => { if (editingTeam) updateTeam(quiz.id, editingTeam, teamEditForm); setEditingTeam(null); }}>Save</Button></div>
        </div>
      </Modal>

      {/* Edit member modal */}
      <Modal open={editingMember !== null} onClose={() => setEditingMember(null)} title="Edit Member" size="sm">
        <div className="space-y-4">
          <Input label="Name" value={memberEditForm.name} onChange={(e) => setMemberEditForm({ ...memberEditForm, name: e.target.value })} />
          <Input label="Student ID" value={memberEditForm.studentId} onChange={(e) => setMemberEditForm({ ...memberEditForm, studentId: e.target.value })} />
          <Input label="Class" value={memberEditForm.className} onChange={(e) => setMemberEditForm({ ...memberEditForm, className: e.target.value })} />
          <Input label="Institution" value={memberEditForm.institution} onChange={(e) => setMemberEditForm({ ...memberEditForm, institution: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setEditingMember(null)}>Cancel</Button><Button onClick={() => { if (editingMember) updateMember(quiz.id, editingMember.teamId, editingMember.memberId, memberEditForm); setEditingMember(null); }}>Save</Button></div>
        </div>
      </Modal>

      {/* Import modal */}
      <Modal open={showImport} onClose={() => { setShowImport(false); setImportPreview(null); }} title="Import Teams & Students from CSV" size="lg">
        {!importPreview ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Upload a CSV file with columns: <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">team_name, team_color, student_name, student_id, class, institution</code></p>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
            >
              <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 text-sm font-medium">Click to select CSV file</p>
              <p className="text-slate-400 text-xs mt-1">Repeated team rows will be merged into one team</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
            <Button variant="outline" onClick={downloadSampleCSV} className="w-full"><Download className="w-4 h-4" /> Download Sample CSV</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">{importPreview.length} rows ready to import. This will add new teams and members to your quiz.</p>
            <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    {['Team', 'Color', 'Student', 'ID', 'Class', 'Institution'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importPreview.slice(0, 50).map((row, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-3 py-1.5 text-slate-700">{row.team_name}</td>
                      <td className="px-3 py-1.5"><span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: row.team_color }} /></td>
                      <td className="px-3 py-1.5 text-slate-700">{row.student_name}</td>
                      <td className="px-3 py-1.5 text-slate-500">{row.student_id}</td>
                      <td className="px-3 py-1.5 text-slate-500">{row.class}</td>
                      <td className="px-3 py-1.5 text-slate-500">{row.institution}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {importPreview.length > 50 && <p className="text-xs text-slate-400">Showing first 50 rows. All {importPreview.length} rows will be imported.</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setImportPreview(null)}><X className="w-4 h-4" /> Cancel</Button>
              <Button onClick={confirmImport}><Upload className="w-4 h-4" /> Import {importPreview.length} rows</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
