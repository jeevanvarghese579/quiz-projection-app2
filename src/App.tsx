import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QuizProvider } from '@/contexts/QuizContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { LandingPage } from '@/pages/LandingPage';
import { AdminLoginPage } from '@/pages/AdminLoginPage';
import { InvigilatorLoginPage } from '@/pages/InvigilatorLoginPage';
import { AboutPage } from '@/pages/AboutPage';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminQuizzesPage } from '@/pages/admin/AdminQuizzesPage';
import { AdminTeamsPage } from '@/pages/admin/AdminTeamsPage';
import { AdminQuestionsPage } from '@/pages/admin/AdminQuestionsPage';
import { AdminScoringPage } from '@/pages/admin/AdminScoringPage';
import { AdminInvigilatorsPage } from '@/pages/admin/AdminInvigilatorsPage';
import { AdminResultsPage } from '@/pages/admin/AdminResultsPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import { AdminActivityPage } from '@/pages/admin/AdminActivityPage';
import { InvigilatorPage } from '@/pages/InvigilatorPage';
import { ProjectorPage } from '@/pages/ProjectorPage';

export default function App() {
  return (
    <AuthProvider>
      <QuizProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/invigilator/login" element={<InvigilatorLoginPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/projector/:quizId" element={<ProjectorPage />} />
          <Route path="/invigilator/:quizId" element={<InvigilatorPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="quizzes" element={<AdminQuizzesPage />} />
            <Route path="quizzes/:quizId/teams" element={<AdminTeamsPage />} />
            <Route path="quizzes/:quizId/questions" element={<AdminQuestionsPage />} />
            <Route path="quizzes/:quizId/scoring" element={<AdminScoringPage />} />
            <Route path="quizzes/:quizId/invigilators" element={<AdminInvigilatorsPage />} />
            <Route path="quizzes/:quizId/results" element={<AdminResultsPage />} />
            <Route path="quizzes/:quizId/settings" element={<AdminSettingsPage />} />
            <Route path="quizzes/:quizId/activity" element={<AdminActivityPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </QuizProvider>
    </AuthProvider>
  );
}
