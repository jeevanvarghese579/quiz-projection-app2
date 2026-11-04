import { Link } from 'react-router-dom';
import { Trophy, ShieldCheck, KeyRound, ArrowRight, Sparkles, Cloud } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen projector-bg projector-grid flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-white text-lg">Quiz Projection App 2</span>
        </div>
        <Link to="/about" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">About</Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Live Quiz Scoring & Championship Leaderboard
            </div>
            <h1 className="font-display font-extrabold text-white text-5xl md:text-6xl leading-tight mb-5">
              Run quiz competitions<br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-300 bg-clip-text text-transparent">with a stunning live scoreboard.</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Organize quizzes for schools, colleges, and institutions. Invigilators score from their phones.
              A beautiful animated projector shows real-time team rankings.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            <Link
              to="/admin/login"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 p-7 text-white shadow-xl shadow-blue-900/40 hover:scale-[1.02] transition-transform"
            >
              <ShieldCheck className="w-9 h-9 mb-4" />
              <h2 className="font-display text-xl font-bold mb-1.5">Administrator</h2>
              <p className="text-blue-100 text-sm mb-5">Create quizzes, manage teams, configure questions, and project results.</p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                Sign in with Google <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            <Link
              to="/invigilator/login"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 p-7 text-white shadow-xl shadow-slate-900/40 hover:scale-[1.02] transition-transform border border-slate-700/50"
            >
              <KeyRound className="w-9 h-9 mb-4" />
              <h2 className="font-display text-xl font-bold mb-1.5">Invigilator</h2>
              <p className="text-slate-300 text-sm mb-5">Enter a quiz access code to score teams from your phone. No account needed.</p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                Enter access code <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </div>

          <div className="mt-10 flex items-center justify-center gap-2 text-slate-400 text-xs">
            <Cloud className="w-3.5 h-3.5" />
            <span>Protected by Firebase Authentication and Access Manager</span>
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
