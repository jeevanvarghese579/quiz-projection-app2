import { Link, Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard, Trophy, Users, HelpCircle, ClipboardCheck,
  KeyRound, BarChart3, Monitor, ScrollText, Settings, Info,
  Plus, ChevronDown, LogOut, Menu, X, Crown
} from 'lucide-react';
import { useQuiz } from '@/contexts/QuizContext';
import { Badge } from '@/components/ui/Badge';

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/quizzes', label: 'My Quizzes', icon: Trophy },
  { path: '/admin/quizzes/:quizId/teams', label: 'Teams & Students', icon: Users, dynamic: true },
  { path: '/admin/quizzes/:quizId/questions', label: 'Questions', icon: HelpCircle, dynamic: true },
  { path: '/admin/quizzes/:quizId/scoring', label: 'Scoring', icon: ClipboardCheck, dynamic: true },
  { path: '/admin/quizzes/:quizId/invigilators', label: 'Invigilators', icon: KeyRound, dynamic: true },
  { path: '/admin/quizzes/:quizId/results', label: 'Results', icon: BarChart3, dynamic: true },
  { path: '/admin/quizzes/:quizId/activity', label: 'Activity Logs', icon: ScrollText, dynamic: true },
  { path: '/admin/quizzes/:quizId/settings', label: 'Settings', icon: Settings, dynamic: true },
  { path: '/about', label: 'About', icon: Info },
];

function statusVariant(status: string) {
  const map: Record<string, 'green' | 'amber' | 'gray' | 'blue' | 'red'> = {
    live: 'green', draft: 'gray', paused: 'amber', completed: 'blue', archived: 'red',
  };
  return map[status] ?? 'gray';
}

export function AdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { quizzes, activeQuizId, activeQuiz, setActiveQuizId } = useQuiz();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quizDropdown, setQuizDropdown] = useState(false);

  if (window.sessionStorage.getItem('quizProjectionApp2.demoAdmin') !== 'true') {
    return <Navigate to="/admin/login" replace />;
  }

  const currentQuizId = pathname.split('/')[3]; // /admin/quizzes/:quizId/...
  const navQuizId = currentQuizId ?? activeQuizId;
  const navQuiz = quizzes.find((q) => q.id === navQuizId) ?? activeQuiz;

  const replaceQuizId = (path: string) => path.replace(':quizId', navQuiz?.id ?? '');

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 z-40 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="px-5 py-5 border-b border-slate-100 flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-md shadow-blue-500/20">
                <Trophy className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className="font-display font-bold text-slate-900 text-sm leading-tight">Quiz Projection</p>
                <p className="text-xs text-slate-400">App 2</p>
              </div>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quiz selector */}
          <div className="px-3 py-3 border-b border-slate-100 relative">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">Active Quiz</p>
            <button
              onClick={() => setQuizDropdown(!quizDropdown)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{navQuiz?.name ?? 'No quiz selected'}</p>
                {navQuiz && <Badge variant={statusVariant(navQuiz.status)}>{navQuiz.status}</Badge>}
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
            {quizDropdown && (
              <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                {quizzes.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => { setActiveQuizId(q.id); setQuizDropdown(false); navigate(`/admin/quizzes/${q.id}/teams`); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 text-left first:rounded-t-xl last:rounded-b-xl"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-slate-800 truncate">{q.name}</p>
                      <p className="text-xs text-slate-400">{q.teams.length} teams</p>
                    </div>
                    <Badge variant={statusVariant(q.status)}>{q.status}</Badge>
                  </button>
                ))}
                <Link to="/admin/quizzes" onClick={() => setQuizDropdown(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-blue-600 font-medium hover:bg-slate-50 first:rounded-t-xl">
                  <Plus className="w-4 h-4" /> Manage all quizzes
                </Link>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const itemPath = item.dynamic ? replaceQuizId(item.path) : item.path;
              const isActive = item.exact ? pathname === item.path : pathname.startsWith(itemPath) && (itemPath !== '/admin' || pathname === '/admin');
              const Icon = item.icon;
              const disabled = item.dynamic && !navQuiz;
              return (
                <Link
                  key={item.path}
                  to={disabled ? '#' : itemPath}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : disabled
                        ? 'text-slate-300 pointer-events-none'
                        : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-4.5 h-4.5" /> {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Project Results */}
          <div className="px-3 py-3 border-t border-slate-100">
            {navQuiz && (
              <Link
                to={`/projector/${navQuiz.id}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-slate-800 to-slate-700 text-white hover:from-slate-700 hover:to-slate-600 transition-all shadow-md"
              >
                <Monitor className="w-4.5 h-4.5" /> Project Results
              </Link>
            )}
            <button
              onClick={() => { window.sessionStorage.removeItem('quizProjectionApp2.demoAdmin'); navigate('/'); }}
              className="mt-2 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <LogOut className="w-4.5 h-4.5" /> Sign out
            </button>
          </div>

          <div className="px-5 py-3 border-t border-slate-100">
            <Link to="/about" className="text-xs text-slate-400 hover:text-slate-600">Developed by Jeevan Varghese</Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 text-slate-600">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <span className="font-display font-bold text-slate-900 text-sm">Admin</span>
          </div>
        </header>
        <main className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
