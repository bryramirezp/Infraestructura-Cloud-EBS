import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { StatsGrid } from '@/widgets/dashboard';
import { ReportCardContainer, ActivityChart } from '@/widgets/reports';
import type { CourseReportData, StudentReportData, ActivityDataPoint } from '@/widgets/reports';
import { useAuth } from '@/app/providers/AuthProvider';
import { Users, TrendingUp, BookOpen, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';

export const AdminReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('30d');

  // Mock data - in production this would come from API
  const courseReports: CourseReportData[] = [
    { 
      id: 1,
      name: 'Génesis - Creación', 
      completionRate: 85, 
      averageGrade: 88, 
      totalStudents: 45, 
      averageTime: '3.2 semanas' 
    },
    { 
      id: 2,
      name: 'Éxodo - Liberación', 
      completionRate: 78, 
      averageGrade: 85, 
      totalStudents: 38, 
      averageTime: '2.8 semanas' 
    },
    { 
      id: 3,
      name: 'Salmos - Adoración', 
      completionRate: 92, 
      averageGrade: 91, 
      totalStudents: 52, 
      averageTime: '4.1 semanas' 
    },
    { 
      id: 4,
      name: 'Mateo - Evangelio', 
      completionRate: 67, 
      averageGrade: 79, 
      totalStudents: 31, 
      averageTime: '3.5 semanas' 
    },
    { 
      id: 5,
      name: 'Romanos - Epístola', 
      completionRate: 73, 
      averageGrade: 82, 
      totalStudents: 28, 
      averageTime: '2.9 semanas' 
    }
  ];

  const studentReports: StudentReportData[] = [
    { 
      id: 1,
      name: 'María González', 
      progress: 95, 
      coursesCompleted: 3, 
      averageGrade: 92, 
      lastActivity: '2025-01-15' 
    },
    { 
      id: 2,
      name: 'Carlos Ruiz', 
      progress: 87, 
      coursesCompleted: 2, 
      averageGrade: 88, 
      lastActivity: '2025-01-14' 
    },
    { 
      id: 3,
      name: 'Ana Martínez', 
      progress: 76, 
      coursesCompleted: 1, 
      averageGrade: 85, 
      lastActivity: '2025-01-12' 
    },
    { 
      id: 4,
      name: 'Pedro Sánchez', 
      progress: 68, 
      coursesCompleted: 1, 
      averageGrade: 78, 
      lastActivity: '2025-01-10' 
    },
    { 
      id: 5,
      name: 'Laura Jiménez', 
      progress: 91, 
      coursesCompleted: 2, 
      averageGrade: 89, 
      lastActivity: '2025-01-15' 
    }
  ];

  const stats = {
    totalStudents: 156,
    activeStudents: 142,
    totalCourses: 12,
    averageCompletion: 79,
    certificatesIssued: 89,
    averageGrade: 85
  };

  const activityData: ActivityDataPoint[] = [
    { day: 'Lun', enrollments: 12, completions: 8 },
    { day: 'Mar', enrollments: 15, completions: 6 },
    { day: 'Mié', enrollments: 8, completions: 12 },
    { day: 'Jue', enrollments: 18, completions: 9 },
    { day: 'Vie', enrollments: 22, completions: 15 },
    { day: 'Sáb', enrollments: 14, completions: 7 },
    { day: 'Dom', enrollments: 9, completions: 5 }
  ];

  return (
    <div className="space-y-8">
      {/* Header específico de la página */}
      <div className="bg-card border-b border-border px-8 py-4 animate-fade-in -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reportes y Analíticas</h1>
            <p className="text-sm text-muted-foreground">
              Métricas y análisis del rendimiento de la plataforma
            </p>
          </div>
          <div className="flex space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
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
      </div>

      <div className="space-y-8">
          {/* Stats Cards */}
          <StatsGrid
            stats={[
              {
                title: "Total de Alumnos",
                value: stats.totalStudents,
                icon: Users,
                color: 'blue' as const,
                trend: { value: 12, label: "vs mes anterior", isPositive: true }
              },
              {
                title: "Alumnos Activos",
                value: stats.activeStudents,
                icon: TrendingUp,
                color: 'green' as const,
                trend: { value: 8, label: "vs mes anterior", isPositive: true }
              },
              {
                title: "Tasa de Finalización",
                value: `${stats.averageCompletion}%`,
                icon: BarChart3,
                color: 'purple' as const,
                trend: { value: 5, label: "vs mes anterior", isPositive: true }
              },
              {
                title: "Cursos Activos",
                value: stats.totalCourses,
                icon: BookOpen,
                color: 'orange' as const
              },
              {
                title: "Certificados Emitidos",
                value: stats.certificatesIssued,
                icon: TrendingUp,
                color: 'red' as const,
                trend: { value: 15, label: "este mes", isPositive: true }
              },
              {
                title: "Calificación Promedio",
                value: `${stats.averageGrade}%`,
                icon: BarChart3,
                color: 'green' as const
              }
            ]}
            columns={3}
            className="mb-8"
          />

          {/* Activity Chart */}
          <ActivityChart
            title="Actividad Reciente"
            description="Últimos 7 días"
            data={activityData}
            maxValue={25}
            className="mb-8"
          />

          {/* Reports Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Course Performance Report */}
            <ReportCardContainer
              title="Rendimiento de Cursos"
              courseReports={courseReports}
              variant="default"
              showProgress={true}
                  onReportClick={(type, id) => {
                    if (process.env.NODE_ENV === 'development') {
                      // eslint-disable-next-line no-console
                      console.log('Report clicked:', type, id);
                    }
                    // TODO: Implementar navegación a página de detalle del curso
                  }}
            />

            {/* Student Progress Report */}
            <ReportCardContainer
              title="Progreso de Alumnos"
              studentReports={studentReports}
              variant="default"
              showProgress={true}
              onReportClick={(type, id) => {
                if (process.env.NODE_ENV === 'development') {
                  // eslint-disable-next-line no-console
                  console.log('Report clicked:', type, id);
                }
                // TODO: Implementar navegación a página de detalle del estudiante
              }}
            />
          </div>

          {/* Additional Insights */}
          <div className="mt-8">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Insights Adicionales</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-2">23</div>
                    <div className="text-sm text-muted-foreground">Alumnos necesitan ayuda</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Progreso {'<'} 50% o inactivos {'>'} 7 días
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success mb-2">94%</div>
                    <div className="text-sm text-muted-foreground">Satisfacción de Alumnos</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Basado en encuestas recientes
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-2">2.3</div>
                    <div className="text-sm text-muted-foreground">Cursos por Alumno</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Promedio de inscripción
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
      </div>
    </div>
  );
};
