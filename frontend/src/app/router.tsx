import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/widgets/layout/Layout';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { useAuth } from '@/app/providers/AuthProvider';
import { LandingPage } from '@/pages/public/LandingPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { AdminLoginPage } from '@/pages/auth/AdminLoginPage';
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

/**
 * Router component that handles all application routes.
 * This component must be rendered inside the AuthProvider to access auth context.
 */
export const AppRouter: React.FC = () => {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
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

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

