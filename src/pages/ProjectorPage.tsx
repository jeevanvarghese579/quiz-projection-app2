import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Maximize, Minimize, Trophy, Radio, Settings2 } from 'lucide-react';
import { useQuiz } from '@/contexts/QuizContext';
import { formatMarks, getRankedTeams } from '@/utils/scoring';

const themeClasses: Record<string, string> = {
  midnight: 'projector-bg projector-grid',
  royal: 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950',
  emerald: 'bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950',
  sunset: 'bg-gradient-to-br from-slate-950 via-orange-950 to-slate-950',
};

const speedMap: Record<string, number> = { instant: 0, fast: 0.28, normal: 0.5, slow: 0.8 };

export function ProjectorPage() {
  const { quizId } = useParams();
  const { quizzes } = useQuiz();
  const quiz = quizzes.find((item) => item.id === quizId);
  const [fullScreen, setFullScreen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const onFullscreen = () => setFullScreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => document.removeEventListener('fullscreenchange', onFullscreen);
  }, []);

  const ranked = useMemo(() => quiz ? getRankedTeams(quiz) : [], [quiz]);
  if (!quiz) return <div className="min-h-screen bg-slate-950 text-white grid place-items-center">Quiz not found.</div>;

  const prominent = ranked.slice(0, quiz.projector.prominentTeamCount);
  const overflow = ranked.slice(quiz.projector.prominentTeamCount);
  const duration = prefersReducedMotion ? 0 : speedMap[quiz.projector.animationSpeed];

  const toggleFullScreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  };

  return (
    <div className={`min-h-screen text-white ${themeClasses[quiz.projector.theme]} overflow-hidden`}>
      <div className="min-h-screen p-5 md:p-8 xl:p-10 flex flex-col">
        <header className="flex items-start justify-between gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
              <Trophy className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-extrabold text-xl md:text-3xl xl:text-4xl tracking-tight truncate">{quiz.projector.title}</h1>
              <p className="text-slate-300 text-xs md:text-sm mt-1 tracking-[0.18em] uppercase truncate">{quiz.projector.subtitle}</p>
              {quiz.projector.institution && <p className="text-slate-500 text-xs mt-1 truncate">{quiz.projector.institution}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-live" /> LIVE
            </div>
            <button onClick={toggleFullScreen} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors" title="Toggle full screen">
              {fullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
            <Link to={`/admin/quizzes/${quiz.id}/settings`} className="hidden md:flex p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors" title="Projector settings">
              <Settings2 className="w-4 h-4" />
            </Link>
          </div>
        </header>

        <main className="flex-1 grid lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.38fr)] gap-5 md:gap-7 min-h-0">
          <section className="min-w-0 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Championship standings</p>
              <p className="text-xs text-slate-500">{ranked.length} teams competing</p>
            </div>
            <div className="space-y-2.5 md:space-y-3 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {prominent.map((entry) => (
                  <motion.div
                    key={entry.team.id}
                    layout="position"
                    layoutId={entry.team.id}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.96 }}
                    transition={{ duration, type: 'spring', stiffness: 280, damping: 28 }}
                    className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.065] backdrop-blur-sm ${entry.rank === 1 ? 'ring-1 ring-amber-300/40 shadow-xl shadow-amber-950/20' : ''}`}
                  >
                    <div className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: entry.team.color }} />
                    <div className="flex items-center gap-4 md:gap-6 px-4 md:px-6 py-3.5 md:py-4">
                      {quiz.projector.showRanks && (
                        <div className={`w-10 md:w-14 text-center font-display font-extrabold tabular-nums ${entry.rank === 1 ? 'text-amber-300 text-2xl md:text-3xl' : entry.rank === 2 ? 'text-slate-200 text-xl md:text-2xl' : entry.rank === 3 ? 'text-orange-300 text-xl md:text-2xl' : 'text-slate-500 text-lg md:text-xl'}`}>
                          {entry.rank}
                        </div>
                      )}
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white font-display font-extrabold text-lg md:text-xl shrink-0" style={{ backgroundColor: entry.team.color }}>
                        {entry.team.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-display font-bold truncate ${entry.rank === 1 ? 'text-lg md:text-2xl' : 'text-base md:text-xl'}`}>{entry.team.name}</p>
                        <p className="text-slate-400 text-xs md:text-sm truncate">{entry.team.institution}</p>
                      </div>
                      {quiz.projector.showScores && (
                        <motion.div key={`${entry.team.id}-${entry.total}`} initial={prefersReducedMotion ? false : { scale: 1.18, color: '#67e8f9' }} animate={{ scale: 1, color: '#ffffff' }} transition={{ duration: 0.45 }} className={`font-display font-extrabold tabular-nums ${entry.rank === 1 ? 'text-2xl md:text-4xl' : 'text-xl md:text-3xl'}`}>
                          {formatMarks(entry.total)}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {prominent.length === 0 && <div className="rounded-2xl border border-white/10 p-12 text-center text-slate-400">Waiting for teams and scores.</div>}
            </div>
          </section>

          <aside className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden flex flex-col min-h-0">
            <div className="px-4 md:px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <p className="font-display font-bold text-sm md:text-base">Remaining teams</p>
                <p className="text-xs text-slate-500 mt-0.5">Full standings</p>
              </div>
              <span className="text-xs font-semibold text-slate-500">{overflow.length}</span>
            </div>
            <div className="overflow-y-auto flex-1 p-2.5 md:p-3 space-y-1.5">
              <AnimatePresence initial={false}>
                {overflow.map((entry) => (
                  <motion.div key={entry.team.id} layout="position" layoutId={entry.team.id} animate={{ opacity: 1 }} transition={{ duration, type: 'spring', stiffness: 280, damping: 28 }} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                    <span className="w-6 text-center text-xs font-bold text-slate-500 tabular-nums">{entry.rank}</span>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.team.color }} />
                    <span className="text-sm text-slate-300 truncate flex-1">{entry.team.name}</span>
                    {quiz.projector.showScores && <span className="text-sm font-bold tabular-nums text-white">{formatMarks(entry.total)}</span>}
                  </motion.div>
                ))}
              </AnimatePresence>
              {overflow.length === 0 && <p className="text-xs text-slate-500 text-center py-8">All teams are in the main standings.</p>}
            </div>
          </aside>
        </main>

        <footer className="pt-5 md:pt-7 flex items-center justify-between text-slate-500 text-xs">
          <span>{quiz.status === 'live' ? 'Scores update automatically' : `Quiz ${quiz.status}`}</span>
          <span className="flex items-center gap-1.5"><Radio className="w-3.5 h-3.5" /> Live scoreboard</span>
        </footer>
      </div>
    </div>
  );
}
