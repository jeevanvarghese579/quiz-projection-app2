import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, Copy, GripVertical, AlertTriangle } from 'lucide-react';
import { useQuiz } from '@/contexts/QuizContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/admin/AdminLayout';

export function AdminQuestionsPage() {
  const { quizId } = useParams();
  const { quizzes, addQuestion, updateQuestion, deleteQuestion, bulkAddQuestions } = useQuiz();
  const quiz = quizzes.find((q) => q.id === quizId);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkMarks, setBulkMarks] = useState('1,2,3,5,5,10');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmMarksChange, setConfirmMarksChange] = useState<{ questionId: string; newMarks: number } | null>(null);

  if (!quiz) return <p>Quiz not found.</p>;

  const handleAdd = () => {
    const lastMarks = quiz.questions.length > 0 ? quiz.questions[quiz.questions.length - 1].maxMarks : 1;
    addQuestion(quiz.id, lastMarks);
  };

  const handleBulk = () => {
    const marks = bulkMarks.split(',').map((m) => parseFloat(m.trim())).filter((m) => !isNaN(m) && m >= 0);
    if (marks.length === 0) return;
    bulkAddQuestions(quiz.id, marks);
    setShowBulk(false);
  };

  const handleMarksChange = (questionId: string, value: string) => {
    const newMarks = parseFloat(value);
    if (isNaN(newMarks) || newMarks < 0) return;
    // Check if any scores exist for this question
    const hasScores = quiz.scores.some((s) => s.questionId === questionId);
    if (hasScores) {
      setConfirmMarksChange({ questionId, newMarks });
    } else {
      updateQuestion(quiz.id, questionId, { maxMarks: newMarks });
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Questions"
        subtitle={`${quiz.questions.length} questions configured`}
        actions={
          <>
            <Button variant="outline" onClick={() => setShowBulk(true)}><Plus className="w-4 h-4" /> Bulk Add</Button>
            <Button onClick={handleAdd}><Plus className="w-4 h-4" /> Add Question</Button>
          </>
        }
      />

      {quiz.questions.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-slate-500 mb-4">No questions yet. Add questions with custom maximum marks.</p>
          <Button onClick={handleAdd}><Plus className="w-4 h-4" /> Add First Question</Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {quiz.questions.map((q) => {
            const scoredCount = quiz.scores.filter((s) => s.questionId === q.id).length;
            return (
              <Card key={q.id} className="p-4 flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-slate-300" />
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-display font-bold text-sm shrink-0">
                  {q.number}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Question {q.number}</p>
                  <p className="text-xs text-slate-400">{scoredCount} teams scored</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400">Max marks</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={q.maxMarks}
                    onChange={(e) => handleMarksChange(q.id, e.target.value)}
                    className="w-20 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => addQuestion(quiz.id, q.maxMarks)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Duplicate"><Copy className="w-4 h-4" /></button>
                  <button onClick={() => setConfirmDelete(q.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </Card>
            );
          })}
          <button onClick={handleAdd} className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2 text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>
      )}

      {/* Bulk add modal */}
      <Modal open={showBulk} onClose={() => setShowBulk(false)} title="Bulk Add Questions">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Enter maximum marks for each question, separated by commas. Decimal values are supported.</p>
          <Input label="Maximum marks (comma-separated)" placeholder="1, 2, 3, 5, 5, 10" value={bulkMarks} onChange={(e) => setBulkMarks(e.target.value)} />
          <div className="flex items-center gap-2 flex-wrap">
            {['1', '2', '5', '10', '2.5', '1, 2, 5, 10'].map((preset) => (
              <button key={preset} onClick={() => setBulkMarks(preset)} className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                {preset}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowBulk(false)}>Cancel</Button>
            <Button onClick={handleBulk}>Add Questions</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Delete Question" size="sm">
        <p className="text-slate-600 text-sm mb-5">
          {confirmDelete && quiz.scores.some((s) => s.questionId === confirmDelete)
            ? 'This question has scored entries. Deleting it will also remove all related scores. This cannot be undone.'
            : 'Are you sure you want to delete this question?'}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (confirmDelete) deleteQuestion(quiz.id, confirmDelete); setConfirmDelete(null); }}>Delete</Button>
        </div>
      </Modal>

      {/* Marks change confirm */}
      <Modal open={confirmMarksChange !== null} onClose={() => setConfirmMarksChange(null)} title="Change Maximum Marks" size="sm">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              Some teams have already been scored on this question. Changing the maximum marks may affect their scores. Existing scores will be re-validated against the new maximum.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="outline" onClick={() => setConfirmMarksChange(null)}>Cancel</Button>
          <Button onClick={() => { if (confirmMarksChange) updateQuestion(quiz.id, confirmMarksChange.questionId, { maxMarks: confirmMarksChange.newMarks }); setConfirmMarksChange(null); }}>Confirm Change</Button>
        </div>
      </Modal>
    </div>
  );
}
