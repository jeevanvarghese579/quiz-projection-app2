import { Link } from 'react-router-dom';
import { Trophy, GraduationCap, Building2, Globe, Github, Code2 } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="min-h-screen projector-bg projector-grid flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Trophy className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-display font-bold text-white">Quiz Projection App 2</span>
        </Link>
        <Link to="/" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Home</Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-2xl shadow-blue-500/40 mx-auto mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display font-extrabold text-white text-3xl mb-2">Quiz Projection App 2</h1>
            <p className="text-slate-400 max-w-lg mx-auto">
              A professional live quiz scoring and championship leaderboard platform for schools,
              colleges, and educational institutions. Invigilators score from their phones while a
              beautiful animated projector shows real-time team rankings.
            </p>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur border border-slate-700/50 p-8 shadow-2xl">
            <h2 className="font-display text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-cyan-400" /> Developer
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-xl shadow-blue-500/30 shrink-0">
                <span className="font-display text-3xl font-bold text-white">JV</span>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-display text-xl font-bold text-white mb-1">Jeevan Varghese</h3>
                <div className="space-y-1.5">
                  <p className="text-slate-300 text-sm flex items-center justify-center sm:justify-start gap-2">
                    <GraduationCap className="w-4 h-4 text-slate-400" /> HSST Jr. Botany
                  </p>
                  <p className="text-slate-300 text-sm flex items-center justify-center sm:justify-start gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" /> St. Gemma's Girls' HSS, Malappuram
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-400/20 mb-4">
              <p className="text-center text-blue-200 text-sm font-medium">
                Visit itsjeevanvarghese.web.app for more softwares.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://itsjeevanvarghese.web.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Globe className="w-4 h-4" /> Visit Website
              </a>
              <a
                href="https://github.com/jeevanvarghese579/quiz-projection-app2"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 text-white text-sm font-medium hover:bg-slate-600 transition-colors"
              >
                <Github className="w-4 h-4" /> GitHub Repository
              </a>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-slate-500 text-xs">
              Live Quiz Scoring & Championship Leaderboard
            </p>
          </div>
        </div>
      </main>

      <footer className="px-6 py-4 text-center">
        <p className="text-slate-400 text-xs font-medium">Developed by Jeevan Varghese</p>
      </footer>
    </div>
  );
}
