import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/widgets/layout/Layout';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { useAuth } from '@/app/providers/AuthProvider';
import { LandingPage } from '@/pages/public/LandingPage';
// Auth pages removed - using Cognito Hosted UI instead
import Dashboard from '@/pages/student/StudentDashboard';
import { ContactPage } from '@/pages/student/ContactPage';
import { AboutPage } from '@/pages/public/AboutPage';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminCoursesPage } from '@/pages/admin/AdminCoursesPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import Courses from '@/pages/student/Courses';
import Calendar from '@/pages/student/Calendar';
import { AssignmentsPage } from '@/pages/student/AssignmentsPage';
import Grades from '@/pages/student/Grades';
import { ModulosPage } from '@/pages/student/ModulosPage';
import { ModuloDetailPage } from '@/pages/student/ModuloDetailPage';
import { CursoDetailPage } from '@/pages/student/CursoDetailPage';
import { LessonPage } from '@/pages/student/LessonPage';
import { QuizPage } from '@/pages/student/QuizPage';
import { QuizResultPage } from '@/pages/student/QuizResultPage';
import { ExamenFinalPage } from '@/pages/student/ExamenFinalPage';
import { MyCoursesPage } from '@/pages/student/MyCoursesPage';
import { ProgressPage } from '@/pages/student/ProgressPage';
import { CertificatesPage } from '@/pages/student/CertificatesPage';
import { VerifyCertificatePage } from '@/pages/public/VerifyCertificatePage';
import { ForumPage } from '@/pages/student/ForumPage';
import { CognitoCallback } from '@/pages/auth/CognitoCallback';

/**
 * Component to redirect to backend login endpoint which handles Cognito Hosted UI
 * The backend /api/auth/login endpoint generates PKCE URL and redirects to Cognito
 */
const LoginRedirect: React.FC = () => {
  React.useEffect(() => {
    // Redirect to backend login endpoint
    // Backend handles PKCE flow and redirects to Cognito Hosted UI
    const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api';
    const BASE_URL = API_URL.endsWith('/api') 
      ? API_URL.slice(0, -4)
      : API_URL.replace(/\/api$/, '');
    
    // Backend endpoint: GET /api/auth/login
    window.location.href = `${BASE_URL}/api/auth/login`;
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-foreground">Redirigiendo a Cognito...</p>
      </div>
    </div>
  );
};

/**
 * Router component that handles all application routes.
 * This component must be rendered inside the AuthProvider to access auth context.
 */
export const AppRouter: React.FC = () => {
  const { user } = useAuth();

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        {/* 
          Login routes - redirect to backend which handles Cognito Hosted UI
          The backend /api/auth/login endpoint generates PKCE URL and redirects to Cognito
        */}
        <Route 
          path="/login" 
          element={<LoginRedirect />} 
        />
        <Route 
          path="/admin/login" 
          element={<LoginRedirect />} 
        />
        {/* 
          Callback route - Cognito redirects here after authentication
          The frontend will extract the code and send it to backend with code_verifier
        */}
        <Route 
          path="/auth/callback" 
          element={<CognitoCallback />} 
        />
        <Route
          path="/contact"
          element={
            <Layout>
              <ContactPage />
            </Layout>
          }
        />
        <Route
          path="/about"
          element={
            <Layout>
              <AboutPage />
            </Layout>
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {user?.role === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : (
                user && (
                  <Layout user={user} showSidebar={true}>
                    <Dashboard />
                  </Layout>
                )
              )}
            </ProtectedRoute>
          }
        />

        {/* Admin specific routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              {user && (
                <Layout user={user} showSidebar={true}>
                  <AdminDashboard />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cursos"
          element={
            <ProtectedRoute requiredRole="admin">
              {user && (
                <Layout user={user} showSidebar={true}>
                  <AdminCoursesPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute requiredRole="admin">
              {user && (
                <Layout user={user} showSidebar={true}>
                  <AdminUsersPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reportes"
          element={
            <ProtectedRoute requiredRole="admin">
              {user && (
                <Layout user={user} showSidebar={true}>
                  <AdminReportsPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/configuracion"
          element={
            <ProtectedRoute requiredRole="admin">
              {user && (
                <Layout user={user} showSidebar={true}>
                  <AdminSettingsPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />

        {/* Student routes */}
        <Route
          path="/cursos"
          element={
            <ProtectedRoute>
              {user && (
                <Layout user={user} showSidebar={true}>
                  <Courses />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendario"
          element={
            <ProtectedRoute>
              {user && (
                <Layout user={user} showSidebar={true}>
                  <Calendar />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/tareas"
          element={
            <ProtectedRoute>
              {user && (
                <Layout user={user} showSidebar={true}>
                  <AssignmentsPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/calificaciones"
          element={
            <ProtectedRoute>
              {user && (
                <Layout user={user} showSidebar={true}>
                  <Grades />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/modulos"
          element={
            <ProtectedRoute>
              {user && (
                <Layout user={user} showSidebar={true}>
                  <ModulosPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/modulos/:id"
          element={
            <ProtectedRoute>
              {user && (
                <Layout user={user} showSidebar={true}>
                  <ModuloDetailPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/cursos/:id"
          element={
            <ProtectedRoute>
              {user && (
                <Layout user={user} showSidebar={true}>
                  <CursoDetailPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/lecciones/:id"
          element={
            <ProtectedRoute>
              {user && (
                <Layout user={user} showSidebar={true}>
                  <LessonPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/:id"
          element={
            <ProtectedRoute>
              {user && (
                <Layout user={user} showSidebar={true}>
                  <QuizPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/:id/resultado"
          element={
            <ProtectedRoute>
              {user && (
                <Layout user={user} showSidebar={true}>
                  <QuizResultPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/examenes-finales/:id"
          element={
            <ProtectedRoute>
              {user && (
                <Layout user={user} showSidebar={true}>
                  <ExamenFinalPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/mis-cursos"
          element={
            <ProtectedRoute>
              {user && (
                <Layout user={user} showSidebar={true}>
                  <MyCoursesPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/progreso"
          element={
            <ProtectedRoute>
              {user && (
                <Layout user={user} showSidebar={true}>
                  <ProgressPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/certificados"
          element={
            <ProtectedRoute>
              {user && (
                <Layout user={user} showSidebar={true}>
                  <CertificatesPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/foro"
          element={
            <ProtectedRoute>
              {user && (
                <Layout user={user} showSidebar={true}>
                  <ForumPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/foro/:leccionId"
          element={
            <ProtectedRoute>
              {user && (
                <Layout user={user} showSidebar={true}>
                  <ForumPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />

        {/* Public routes */}
        <Route
          path="/certificados/verificar"
          element={
            <Layout>
              <VerifyCertificatePage />
            </Layout>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

