import React, { useState } from 'react';
import {
  Users,
  BookOpen,
  Award,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { StatsGrid } from '@/widgets/dashboard';
import { ActivityChart } from '@/widgets/reports';
import type { ActivityDataPoint } from '@/widgets/reports';
import { CourseForm, UserForm } from '@/widgets/forms';
import { useAuth } from '@/app/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isCourseFormOpen, setIsCourseFormOpen] = useState(false);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);

  // Mock data - En producción vendría de la API
  const stats = {
    totalStudents: 156,
    activeCourses: 12,
    certificatesIssued: 89,
    studentProgress: {
      '0-25%': 15,
      '26-50%': 28,
      '51-75%': 45,
      '76-100%': 68
    }
  };

  // Activity data for chart
  const activityData: ActivityDataPoint[] = [
    { day: 'Lun', enrollments: 12, completions: 8 },
    { day: 'Mar', enrollments: 15, completions: 6 },
    { day: 'Mié', enrollments: 8, completions: 12 },
    { day: 'Jue', enrollments: 18, completions: 9 },
    { day: 'Vie', enrollments: 22, completions: 15 },
    { day: 'Sáb', enrollments: 14, completions: 7 },
    { day: 'Dom', enrollments: 9, completions: 5 }
  ];

  // Calcular progreso promedio basado en las estadísticas
  const totalStudentsInProgress = Object.values(stats.studentProgress).reduce((a, b) => a + b, 0);
  const progressRanges = {
    '0-25%': 12.5,
    '26-50%': 37.5,
    '51-75%': 62.5,
    '76-100%': 87.5
  };
  const weightedProgress = Object.entries(stats.studentProgress).reduce((sum, [range, count]) => {
    return sum + (progressRanges[range as keyof typeof progressRanges] * count);
  }, 0);
  const averageProgress = totalStudentsInProgress > 0 
    ? Math.round(weightedProgress / totalStudentsInProgress) 
    : 0;

  const statsData = [
    {
      title: "Total Alumnos",
      value: stats.totalStudents,
      icon: Users,
      color: 'blue' as const,
      trend: { value: 12, label: "vs mes anterior", isPositive: true }
    },
    {
      title: "Cursos Activos",
      value: stats.activeCourses,
      icon: BookOpen,
      color: 'green' as const,
      trend: { value: 2, label: "este mes", isPositive: true }
    },
    {
      title: "Certificados Emitidos",
      value: stats.certificatesIssued,
      icon: Award,
      color: 'purple' as const,
      trend: { value: 8, label: "este mes", isPositive: true }
    },
    {
      title: "Progreso Promedio",
      value: `${averageProgress}%`,
      icon: TrendingUp,
      color: 'orange' as const,
      trend: { value: 5, label: "vs mes anterior", isPositive: true }
    }
  ];

  const handleCreateCourse = async (courseData: any) => {
    try {
      // API call to create course using serverless-offline endpoint
      const response = await fetch('http://localhost:4000/dev/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        throw new Error('Error creating course');
      }

      const result = await response.json();
      
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Course created successfully:', result);
      }

      // Check if the response has the expected structure
      if (result.success && result.data) {
        toast.success('Curso creado exitosamente');
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating course:', error);
      }
      toast.error('Error al crear el curso. Por favor, inténtalo de nuevo.');
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      // API call to create user using serverless-offline endpoint
      const response = await fetch('http://localhost:4000/dev/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        let errorMessage = 'Error creating user';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error('Respuesta del servidor no es JSON válido');
      }

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('User created successfully:', result);
      }

      // Check if the response has the expected structure
      if (result.success && result.data) {
        toast.success('Usuario creado exitosamente');
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating user:', error);
      }
      toast.error(`Error al crear el usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header específico de la página */}
      <div className="bg-card border-b border-border px-8 py-4 animate-fade-in -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Resumen general de la plataforma</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsGrid stats={statsData} columns={4} />

      {/* Activity Chart */}
      <ActivityChart
        title="Actividad Reciente (Últimos 7 días)"
        data={activityData}
        maxValue={25}
      />

      {/* Recent Completions */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Cursos Aprobados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'María González', course: 'Génesis - Creación', grade: 95, date: '2025-01-15' },
              { name: 'Carlos Ruiz', course: 'Éxodo - Liberación', grade: 88, date: '2025-01-14' },
              { name: 'Ana Martínez', course: 'Salmos - Adoración', grade: 92, date: '2025-01-13' },
              { name: 'Pedro Sánchez', course: 'Mateo - Evangelio', grade: 87, date: '2025-01-12' },
              { name: 'Laura Jiménez', course: 'Romanos - Epístola', grade: 90, date: '2025-01-11' }
            ].map((completion, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{completion.name}</p>
                    <p className="text-sm text-muted-foreground">{completion.course}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">{completion.grade}%</p>
                  <p className="text-sm text-muted-foreground">{new Date(completion.date).toLocaleDateString('es-ES')}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso General de Alumnos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.studentProgress).map(([range, count]) => (
              <div key={range} className="text-center">
                <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">{count}</span>
                </div>
                <p className="text-sm text-muted-foreground">{range}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Course Form Modal */}
      <CourseForm
        isOpen={isCourseFormOpen}
        onCancel={() => setIsCourseFormOpen(false)}
        onSubmit={async (data) => {
          await handleCreateCourse(data);
          setIsCourseFormOpen(false);
        }}
        coordinators={[
          { id: 1, name: 'Pastor Juan Pérez' },
          { id: 2, name: 'Pastora Elena García' },
          { id: 3, name: 'Pastor Miguel Ángel' }
        ]}
      />

      {/* User Form Modal */}
      <UserForm
        isOpen={isUserFormOpen}
        onCancel={() => setIsUserFormOpen(false)}
        onSubmit={async (data) => {
          // Remover confirmPassword antes de enviar
          const { confirmPassword, ...userData } = data;
          await handleCreateUser(userData);
          setIsUserFormOpen(false);
        }}
      />
    </div>
  );
};
