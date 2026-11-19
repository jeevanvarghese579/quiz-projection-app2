import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowDownUp, Grid3X3, GripHorizontal, LayoutList, Maximize, Minimize, Trophy, Radio, Settings2 } from 'lucide-react';
import { useQuiz } from '@/contexts/QuizContext';
import { formatMarks, getRankedTeams } from '@/utils/scoring';
import { calculateOverflowAutoScrollStep, calculateProminentTeamCapacity, calculateThumbnailGrid, type AutoScrollDirection, type ThumbnailGridLayout } from '@/utils/projector';

const themeClasses: Record<string, string> = {
  midnight: 'projector-bg projector-grid',
  royal: 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950',
  emerald: 'bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950',
  sunset: 'bg-gradient-to-br from-slate-950 via-orange-950 to-slate-950',
};

const speedMap: Record<string, number> = { instant: 0, fast: 0.28, normal: 0.5, slow: 0.8 };
const HEIGHT_STORAGE_KEY = 'quizProjectionApp2.projectorHeight';
const VIEW_MODE_STORAGE_KEY = 'quizProjectionApp2.projectorViewMode';
type ProjectorViewMode = 'standings' | 'thumbnails';

function initialProjectorHeight(): number {
  const savedHeight = Number(window.localStorage.getItem(HEIGHT_STORAGE_KEY));
  return Number.isFinite(savedHeight) ? Math.max(window.innerHeight, savedHeight) : window.innerHeight;
}

function initialViewMode(): ProjectorViewMode {
  return window.localStorage.getItem(VIEW_MODE_STORAGE_KEY) === 'thumbnails' ? 'thumbnails' : 'standings';
}

export function ProjectorPage() {
  const { quizId } = useParams();
  const { quizzes, updateProjectorSettings } = useQuiz();
  const quiz = quizzes.find((item) => item.id === quizId);
  const [fullScreen, setFullScreen] = useState(false);
  const [screenCapacity, setScreenCapacity] = useState(5);
  const [projectorHeight, setProjectorHeight] = useState(initialProjectorHeight);
  const [viewMode, setViewMode] = useState<ProjectorViewMode>(initialViewMode);
  const [thumbnailGrid, setThumbnailGrid] = useState<ThumbnailGridLayout>({ columns: 0, rows: 0, tileSize: 0, gap: 0 });
  const standingsRef = useRef<HTMLElement>(null);
  const overflowPanelRef = useRef<HTMLDivElement>(null);
  const thumbnailGridRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const onFullscreen = () => setFullScreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => document.removeEventListener('fullscreenchange', onFullscreen);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(HEIGHT_STORAGE_KEY, String(projectorHeight));
  }, [projectorHeight]);

  useEffect(() => {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    const keepAtLeastOneScreenHigh = () => setProjectorHeight((height) => Math.max(window.innerHeight, height));
    window.addEventListener('resize', keepAtLeastOneScreenHigh);
    return () => window.removeEventListener('resize', keepAtLeastOneScreenHigh);
  }, []);

  const ranked = useMemo(() => quiz ? getRankedTeams(quiz) : [], [quiz]);
  const prominentCount = Math.min(ranked.length, screenCapacity);
  const prominent = ranked.slice(0, prominentCount);
  const overflow = ranked.slice(prominentCount);

  useEffect(() => {
    if (viewMode !== 'standings') return;
    const section = standingsRef.current;
    if (!section) return;
    const updateCapacity = () => {
      const availableHeight = section.getBoundingClientRect().height;
      setScreenCapacity(calculateProminentTeamCapacity(window.innerWidth, availableHeight, ranked.length));
    };
    updateCapacity();
    const observer = new ResizeObserver(updateCapacity);
    observer.observe(section);
    window.addEventListener('resize', updateCapacity);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateCapacity);
    };
  }, [ranked.length, viewMode]);

  useEffect(() => {
    if (viewMode !== 'thumbnails') return;
    const container = thumbnailGridRef.current;
    if (!container) return;
    const updateGrid = () => {
      const bounds = container.getBoundingClientRect();
      setThumbnailGrid(calculateThumbnailGrid(bounds.width, bounds.height, ranked.length));
    };
    updateGrid();
    const observer = new ResizeObserver(updateGrid);
    observer.observe(container);
    window.addEventListener('resize', updateGrid);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateGrid);
    };
  }, [ranked.length, viewMode]);

  useEffect(() => {
    const panel = overflowPanelRef.current;
    if (!panel || viewMode !== 'standings' || quiz?.projector.autoScrollOverflow !== true || prefersReducedMotion || overflow.length === 0) return;
    let frame = 0;
    let lastFrameTime = performance.now();
    let logicalScrollTop = panel.scrollTop;
    let lastAppliedScrollTop = panel.scrollTop;
    let direction: AutoScrollDirection = panel.scrollTop >= panel.scrollHeight - panel.clientHeight - 1 ? 'up' : 'down';
    const animate = (frameTime: number) => {
      const maxScroll = Math.max(0, panel.scrollHeight - panel.clientHeight);
      const renderedScrollTop = panel.scrollTop;
      if (Math.abs(renderedScrollTop - lastAppliedScrollTop) > 1) {
        logicalScrollTop = renderedScrollTop;
        if (renderedScrollTop >= maxScroll - 1) direction = 'up';
        else if (renderedScrollTop <= 1) direction = 'down';
      }
      const step = calculateOverflowAutoScrollStep(logicalScrollTop, maxScroll, frameTime - lastFrameTime, direction);
      logicalScrollTop = step.scrollTop;
      panel.scrollTop = step.scrollTop;
      lastAppliedScrollTop = panel.scrollTop;
      direction = step.direction;
      lastFrameTime = frameTime;
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [overflow.length, prefersReducedMotion, quiz?.projector.autoScrollOverflow, viewMode]);

  if (!quiz) return <div className="min-h-screen bg-slate-950 text-white grid place-items-center">Quiz not found.</div>;

  const duration = prefersReducedMotion ? 0 : speedMap[quiz.projector.animationSpeed];

  const toggleFullScreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  };

  const resizeProjector = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = projectorHeight;
    const onPointerMove = (moveEvent: PointerEvent) => {
      setProjectorHeight(Math.max(window.innerHeight, startHeight + moveEvent.clientY - startY));
    };
    const stopResizing = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', stopResizing);
      window.removeEventListener('pointercancel', stopResizing);
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stopResizing);
    window.addEventListener('pointercancel', stopResizing);
  };

  const resizeWithKeyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setProjectorHeight((height) => height + 80);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setProjectorHeight((height) => Math.max(window.innerHeight, height - 80));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setProjectorHeight(window.innerHeight);
    }
  };

  return (
    <div
      className={`projector-scoreboard text-white ${themeClasses[quiz.projector.theme]} overflow-hidden`}
      style={{ '--projector-height': viewMode === 'thumbnails' ? '100vh' : `${projectorHeight}px` } as CSSProperties}
    >
      <div className="projector-scoreboard-content relative p-5 pb-8 md:p-8 md:pb-10 xl:p-10 xl:pb-12 flex flex-col">
        <header className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row md:mb-8">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
              <Trophy className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="whitespace-normal break-words font-display text-xl font-extrabold leading-tight tracking-tight md:text-3xl xl:text-4xl">{quiz.projector.title}</h1>
              <p className="text-slate-300 text-xs md:text-sm mt-1 tracking-[0.18em] uppercase truncate">{quiz.projector.subtitle}</p>
              {quiz.projector.institution && <p className="text-slate-500 text-xs mt-1 truncate">{quiz.projector.institution}</p>}
            </div>
          </div>
          <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
            <div className="flex items-center rounded-xl border border-white/10 bg-black/20 p-1" role="group" aria-label="Projector view mode">
              <button
                type="button"
                aria-pressed={viewMode === 'standings'}
                aria-label="Standings view"
                title="Standings view"
                onClick={() => setViewMode('standings')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${viewMode === 'standings' ? 'bg-white/15 text-white shadow-sm' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                <LayoutList className="h-4 w-4" />
                <span className="hidden xl:inline">Standings</span>
              </button>
              <button
                type="button"
                aria-pressed={viewMode === 'thumbnails'}
                aria-label="All thumbnails view"
                title="Show every team as a thumbnail"
                onClick={() => setViewMode('thumbnails')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${viewMode === 'thumbnails' ? 'bg-cyan-400/20 text-cyan-200 shadow-sm' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Grid3X3 className="h-4 w-4" />
                <span className="hidden xl:inline">All thumbnails</span>
              </button>
            </div>
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

        {viewMode === 'standings' ? (
        <main className="flex-1 grid lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.38fr)] gap-5 md:gap-7 min-h-0">
          <section ref={standingsRef} className="min-w-0 flex flex-col min-h-0">
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
            <div className="px-4 md:px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
              <div>
                <p className="font-display font-bold text-sm md:text-base">Remaining teams</p>
                <p className="text-xs text-slate-500 mt-0.5">Full standings</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={quiz.projector.autoScrollOverflow === true}
                  aria-label="Auto-scroll remaining teams"
                  disabled={overflow.length === 0 || Boolean(prefersReducedMotion)}
                  title={prefersReducedMotion ? 'Auto-scroll is paused because reduced motion is enabled' : 'Toggle automatic scrolling for remaining teams'}
                  onClick={() => updateProjectorSettings(quiz.id, { autoScrollOverflow: !quiz.projector.autoScrollOverflow })}
                  className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${quiz.projector.autoScrollOverflow ? 'border-cyan-300/25 bg-cyan-300/10 text-cyan-200' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                >
                  <ArrowDownUp className="h-3.5 w-3.5" />
                  <span className="hidden xl:inline">Auto-scroll</span>
                  <span className={`h-1.5 w-1.5 rounded-full ${quiz.projector.autoScrollOverflow ? 'bg-cyan-300' : 'bg-slate-600'}`} />
                </button>
                <span className="text-xs font-semibold text-slate-500">{overflow.length}</span>
              </div>
            </div>
            <div ref={overflowPanelRef} className="overflow-y-auto flex-1 p-2.5 md:p-3 space-y-1.5">
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
        ) : (
          <main className="flex min-h-0 flex-1 flex-col">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">All teams</p>
              <p className="text-xs text-slate-500">{ranked.length} teams · one-screen view</p>
            </div>
            <div ref={thumbnailGridRef} className="min-h-0 flex-1 overflow-hidden">
              {ranked.length > 0 ? (
                <div
                  className="grid h-full w-full place-content-center"
                  style={{
                    gridTemplateColumns: `repeat(${Math.max(1, thumbnailGrid.columns)}, ${Math.max(0, thumbnailGrid.tileSize)}px)`,
                    gridAutoRows: `${thumbnailGrid.tileSize}px`,
                    gap: `${thumbnailGrid.gap}px`,
                    opacity: thumbnailGrid.tileSize > 0 ? 1 : 0,
                  }}
                >
                  <AnimatePresence initial={false}>
                    {ranked.map((entry) => {
                      const tileSize = thumbnailGrid.tileSize;
                      const showName = tileSize >= 44;
                      const showInstitution = tileSize >= 118;
                      const avatarSize = Math.max(12, Math.min(54, tileSize * 0.38));
                      return (
                        <motion.div
                          key={entry.team.id}
                          layout="position"
                          layoutId={entry.team.id}
                          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.9 }}
                          transition={{ duration, type: 'spring', stiffness: 280, damping: 28 }}
                          title={`${quiz.projector.showRanks ? `${entry.rank}. ` : ''}${entry.team.name}${quiz.projector.showScores ? ` — ${formatMarks(entry.total)} marks` : ''}`}
                          className={`relative flex min-h-0 min-w-0 flex-col items-center justify-center overflow-hidden rounded-xl border bg-white/[0.07] text-center backdrop-blur-sm ${entry.rank === 1 ? 'border-amber-300/40 ring-1 ring-amber-300/30' : 'border-white/10'}`}
                          style={{ padding: `${Math.max(2, Math.min(10, tileSize * 0.07))}px` }}
                        >
                          <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: entry.team.color }} />
                          {quiz.projector.showRanks && (
                            <span
                              className={`absolute left-1 top-1 font-display font-extrabold tabular-nums ${entry.rank === 1 ? 'text-amber-300' : 'text-slate-400'}`}
                              style={{ fontSize: `${Math.max(7, Math.min(14, tileSize * 0.11))}px` }}
                            >
                              {entry.rank}
                            </span>
                          )}
                          {quiz.projector.showScores && (
                            <motion.span
                              key={`${entry.team.id}-${entry.total}`}
                              initial={prefersReducedMotion ? false : { color: '#67e8f9' }}
                              animate={{ color: '#ffffff' }}
                              transition={{ duration: 0.45 }}
                              className="absolute right-1 top-1 font-display font-extrabold tabular-nums"
                              style={{ fontSize: `${Math.max(7, Math.min(15, tileSize * 0.12))}px` }}
                            >
                              {formatMarks(entry.total)}
                            </motion.span>
                          )}
                          <div
                            className="flex shrink-0 items-center justify-center rounded-lg font-display font-extrabold text-white shadow-sm"
                            style={{
                              width: `${avatarSize}px`,
                              height: `${avatarSize}px`,
                              backgroundColor: entry.team.color,
                              fontSize: `${Math.max(7, Math.min(20, avatarSize * 0.42))}px`,
                            }}
                          >
                            {entry.team.name.charAt(0)}
                          </div>
                          {showName && (
                            <p
                              className="mt-1 w-full truncate font-display font-bold leading-tight text-white"
                              style={{ fontSize: `${Math.max(7, Math.min(15, tileSize * 0.1))}px` }}
                            >
                              {entry.team.name}
                            </p>
                          )}
                          {showInstitution && entry.team.institution && (
                            <p className="mt-0.5 w-full truncate text-slate-400" style={{ fontSize: `${Math.min(10, tileSize * 0.07)}px` }}>
                              {entry.team.institution}
                            </p>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="grid h-full place-items-center rounded-2xl border border-white/10 text-slate-400">Waiting for teams and scores.</div>
              )}
            </div>
          </main>
        )}

        <footer className="pt-5 md:pt-7 flex items-center justify-between text-slate-500 text-xs">
          <span>{quiz.status === 'live' ? 'Scores update automatically' : `Quiz ${quiz.status}`}</span>
          <span className="flex items-center gap-1.5"><Radio className="w-3.5 h-3.5" /> Live scoreboard</span>
        </footer>

        {viewMode === 'standings' && <button
          type="button"
          aria-label="Resize score screen height. Use the up and down arrow keys, or press Home to reset."
          title="Drag to extend the score screen · Double-click to reset"
          onPointerDown={resizeProjector}
          onKeyDown={resizeWithKeyboard}
          onDoubleClick={() => setProjectorHeight(window.innerHeight)}
          className="absolute inset-x-0 bottom-0 hidden h-6 cursor-ns-resize touch-none items-center justify-center border-t border-white/10 bg-black/20 text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-400 lg:flex"
        >
          <GripHorizontal className="h-4 w-7" />
        </button>}
      </div>
    </div>
  );
}
