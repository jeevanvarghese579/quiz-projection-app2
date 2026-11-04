import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, ArrowLeft, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { redeemInvigilatorCode } from '@/firebase/invigilator';

export function InvigilatorLoginPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Please enter a quiz access code.');
      return;
    }
    setLoading(true);
    try {
      const quizId = await redeemInvigilatorCode(trimmed);
      navigate(`/invigilator/${quizId}`);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Invalid, expired, or revoked access code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen projector-bg projector-grid flex flex-col">
      <header className="px-6 py-5">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg mx-auto mb-5 border border-slate-600/50">
              <KeyRound className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="font-display font-bold text-white text-2xl mb-1">Invigilator Login</h1>
            <p className="text-slate-400 text-sm">Enter the quiz access code provided by the administrator.</p>
          </div>

          <div className="space-y-4">
            <Input
              label="Access Code"
              placeholder="Paste the code from the administrator"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && void handleLogin()}
              className="text-center text-sm font-mono tracking-wide"
              autoFocus
            />
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <Button onClick={() => void handleLogin()} disabled={loading} size="lg" className="w-full">{loading ? 'Checking code…' : 'Enter Quiz'}</Button>
          </div>

          <div className="mt-6 text-center">
            <Link to="/admin/login" className="text-slate-400 hover:text-white text-sm">
              Are you an administrator? Sign in →
            </Link>
          </div>
        </div>
      </main>

      <footer className="px-6 py-4 text-center">
        <Link to="/about" className="text-slate-400 hover:text-white text-xs font-medium transition-colors">
          Developed by Jeevan Varghese
        </Link>
      </footer>
    </div>
  );
}
