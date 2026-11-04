import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, ShieldCheck, ArrowLeft, AlertCircle, Clock3, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { user, accessState, error, signInWithGoogle, requestAccess, signOut, refreshAccess } = useAuth();

  useEffect(() => {
    if (accessState === 'authorized') navigate('/admin', { replace: true });
  }, [accessState, navigate]);

  const busy = accessState === 'loading' || accessState === 'checking';

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
            onClick={() => void signInWithGoogle()}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-800 font-medium px-6 py-3.5 rounded-xl hover:bg-slate-50 transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {busy ? 'Checking access...' : user ? 'Choose another Google account' : 'Continue with Google'}
          </button>

          {error && <div className="mt-4 flex gap-2 rounded-xl bg-red-500/10 border border-red-400/30 p-3 text-red-200 text-sm"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}

          {user && accessState !== 'authorized' && (
            <div className="mt-5 rounded-xl bg-slate-900/70 border border-slate-700 p-4 text-sm">
              <div className="flex items-center gap-2 text-white font-medium"><ShieldCheck className="w-4 h-4 text-cyan-400" />Signed in as {user.email}</div>
              {accessState === 'pending' ? (
                <p className="mt-2 text-amber-300 flex gap-2"><Clock3 className="w-4 h-4 shrink-0" />Your Access Manager request is awaiting approval.</p>
              ) : accessState === 'rejected' ? (
                <p className="mt-2 text-red-300">Your access request was rejected. Contact the Firebase Access Manager administrator.</p>
              ) : (
                <p className="mt-2 text-slate-300">This Google account is not yet authorized for Quiz Projection App 2.</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {(accessState === 'unauthorized' || accessState === 'error') && <Button size="sm" onClick={() => void requestAccess()}>Request access</Button>}
                <Button size="sm" variant="outline" onClick={() => void refreshAccess()}><RefreshCw className="w-3.5 h-3.5" /> Check again</Button>
                <Button size="sm" variant="ghost" onClick={() => void signOut()}>Sign out</Button>
              </div>
            </div>
          )}

          {!user && <div className="mt-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-200 text-xs text-center"><ShieldCheck className="w-4 h-4 inline mr-1.5" />Google creates your Firebase account on first sign-in. Dashboard access is granted only through Firebase Access Manager.</div>}

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
