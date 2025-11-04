import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, BookOpen, Download } from 'lucide-react';
import { StatCard } from '../components/Dashboard/StatCard';
import { SidebarProvider, SidebarInset } from '../components/ui/sidebar';
import { UserSidebar } from '../components/Layout/Sidebar';
import { useAuth } from '../contexts/AuthContext';

interface CourseReport {
  name: string;
  completionRate: number;
  averageGrade: number;
  totalStudents: number;
  averageTime: string;
}

interface StudentReport {
  name: string;
  progress: number;
  coursesCompleted: number;
  averageGrade: number;
  lastActivity: string;
}

export const AdminReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('30d');

  // Mock data - in production this would come from API
  const courseReports: CourseReport[] = [
    { name: 'Génesis - Creación', completionRate: 85, averageGrade: 88, totalStudents: 45, averageTime: '3.2 semanas' },
    { name: 'Éxodo - Liberación', completionRate: 78, averageGrade: 85, totalStudents: 38, averageTime: '2.8 semanas' },
    { name: 'Salmos - Adoración', completionRate: 92, averageGrade: 91, totalStudents: 52, averageTime: '4.1 semanas' },
    { name: 'Mateo - Evangelio', completionRate: 67, averageGrade: 79, totalStudents: 31, averageTime: '3.5 semanas' },
    { name: 'Romanos - Epístola', completionRate: 73, averageGrade: 82, totalStudents: 28, averageTime: '2.9 semanas' }
  ];

  const studentReports: StudentReport[] = [
    { name: 'María González', progress: 95, coursesCompleted: 3, averageGrade: 92, lastActivity: '2025-01-15' },
    { name: 'Carlos Ruiz', progress: 87, coursesCompleted: 2, averageGrade: 88, lastActivity: '2025-01-14' },
    { name: 'Ana Martínez', progress: 76, coursesCompleted: 1, averageGrade: 85, lastActivity: '2025-01-12' },
    { name: 'Pedro Sánchez', progress: 68, coursesCompleted: 1, averageGrade: 78, lastActivity: '2025-01-10' },
    { name: 'Laura Jiménez', progress: 91, coursesCompleted: 2, averageGrade: 89, lastActivity: '2025-01-15' }
  ];

  const stats = {
    totalStudents: 156,
    activeStudents: 142,
    totalCourses: 12,
    averageCompletion: 79,
    certificatesIssued: 89,
    averageGrade: 85
  };

  const getActivityData = () => {
    // Mock activity data for the last 7 days
    return [
      { day: 'Lun', enrollments: 12, completions: 8 },
      { day: 'Mar', enrollments: 15, completions: 6 },
      { day: 'Mié', enrollments: 8, completions: 12 },
      { day: 'Jue', enrollments: 18, completions: 9 },
      { day: 'Vie', enrollments: 22, completions: 15 },
      { day: 'Sáb', enrollments: 14, completions: 7 },
      { day: 'Dom', enrollments: 9, completions: 5 }
    ];
  };

  const activityData = getActivityData();

  return (
    <SidebarProvider>
      <UserSidebar user={user || undefined} />
      <SidebarInset>
        <header className="bg-white border-b border-gray-200 px-8 py-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Reportes y Analíticas</h1>
              <p className="text-sm text-muted-foreground">Métricas y análisis del rendimiento de la plataforma</p>
            </div>
            <div className="flex space-x-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
                <option value="1y">Último año</option>
              </select>
              <button className="theme-button px-4 py-2 rounded-lg flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 animate-fade-in">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total de Alumnos"
              value={stats.totalStudents}
              icon={Users}
              color="blue"
              trend={{ value: 12, label: "vs mes anterior", isPositive: true }}
            />
            <StatCard
              title="Alumnos Activos"
              value={stats.activeStudents}
              icon={TrendingUp}
              color="green"
              trend={{ value: 8, label: "vs mes anterior", isPositive: true }}
            />
            <StatCard
              title="Tasa de Finalización"
              value={`${stats.averageCompletion}%`}
              icon={BarChart3}
              color="purple"
              trend={{ value: 5, label: "vs mes anterior", isPositive: true }}
            />
            <StatCard
              title="Cursos Activos"
              value={stats.totalCourses}
              icon={BookOpen}
              color="orange"
            />
            <StatCard
              title="Certificados Emitidos"
              value={stats.certificatesIssued}
              icon={TrendingUp}
              color="red"
              trend={{ value: 15, label: "este mes", isPositive: true }}
            />
            <StatCard
              title="Calificación Promedio"
              value={`${stats.averageGrade}%`}
              icon={BarChart3}
              color="green"
            />
          </div>

          {/* Activity Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">Actividad Reciente (Últimos 7 días)</h3>
            <div className="grid grid-cols-7 gap-4">
              {activityData.map((day, index) => (
                <div key={index} className="text-center">
                  <div className="text-sm font-medium text-muted-foreground mb-2">{day.day}</div>
                  <div className="space-y-2">
                    <div className="flex flex-col items-center">
                      <div className="text-xs text-blue-600 mb-1">Inscripciones</div>
                      <div className="w-8 bg-blue-100 rounded-full h-12 flex items-end justify-center">
                        <div
                          className="bg-blue-600 rounded-full w-6"
                          style={{ height: `${(day.enrollments / 25) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-xs font-medium text-foreground mt-1">{day.enrollments}</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-xs text-green-600 mb-1">Finalizaciones</div>
                      <div className="w-8 bg-green-100 rounded-full h-12 flex items-end justify-center">
                        <div
                          className="bg-green-600 rounded-full w-6"
                          style={{ height: `${(day.completions / 25) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-xs font-medium text-foreground mt-1">{day.completions}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Course Performance Report */}
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Rendimiento de Cursos</h3>
              <div className="space-y-4">
                {courseReports.map((course, index) => (
                  <div key={index} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-card-foreground">{course.name}</h4>
                      <span className="text-sm text-muted-foreground">{course.totalStudents} alumnos</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Finalización</div>
                        <div className="font-medium text-card-foreground">{course.completionRate}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Calificación</div>
                        <div className="font-medium text-card-foreground">{course.averageGrade}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Tiempo Promedio</div>
                        <div className="font-medium text-card-foreground">{course.averageTime}</div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${course.completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Student Progress Report */}
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Progreso de Alumnos</h3>
              <div className="space-y-4">
                {studentReports.map((student, index) => (
                  <div key={index} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-card-foreground">{student.name}</h4>
                      <span className="text-sm text-muted-foreground">
                        {student.coursesCompleted} curso{student.coursesCompleted !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                      <div>
                        <div className="text-muted-foreground">Progreso General</div>
                        <div className="font-medium text-card-foreground">{student.progress}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Calificación Promedio</div>
                        <div className="font-medium text-card-foreground">{student.averageGrade}%</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="w-3/4 bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${student.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-muted-foreground ml-2">
                        Última actividad: {new Date(student.lastActivity).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Insights */}
          <div className="mt-8 bg-card p-6 rounded-xl shadow-sm border border-border">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">Insights Adicionales</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-2">23</div>
                <div className="text-sm text-muted-foreground">Alumnos necesitan ayuda</div>
                <div className="text-xs text-muted-foreground mt-1">Progreso {'<'} 50% o inactivos {'>'} 7 días</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">94%</div>
                <div className="text-sm text-muted-foreground">Satisfacción de Alumnos</div>
                <div className="text-xs text-muted-foreground mt-1">Basado en encuestas recientes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">2.3</div>
                <div className="text-sm text-muted-foreground">Cursos por Alumno</div>
                <div className="text-xs text-muted-foreground mt-1">Promedio de inscripción</div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
