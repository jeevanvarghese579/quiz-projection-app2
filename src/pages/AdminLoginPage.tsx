import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, ShieldCheck, ArrowLeft } from 'lucide-react';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    setLoading(true);
    // Demo access is deliberately separate from production Google/Auth Manager access.
    setTimeout(() => {
      window.sessionStorage.setItem('quizProjectionApp2.demoAdmin', 'true');
      navigate('/admin');
    }, 450);
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30 mx-auto mb-5">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display font-bold text-white text-2xl mb-1">Administrator Login</h1>
            <p className="text-slate-400 text-sm">Sign in with your authorized Google account.</p>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-800 font-medium px-6 py-3.5 rounded-xl hover:bg-slate-50 transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {loading ? 'Opening demo...' : 'Open Demo Dashboard'}
          </button>

          <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs text-center">
            <ShieldCheck className="w-4 h-4 inline mr-1.5" />
            Demo mode — this does not sign in to Google or grant production access. Production access remains disabled until the canonical rules, Access Manager registration, and backend functions are approved.
          </div>

          <div className="mt-6 text-center">
            <Link to="/invigilator/login" className="text-slate-400 hover:text-white text-sm">
              Are you an invigilator? Enter access code →
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
