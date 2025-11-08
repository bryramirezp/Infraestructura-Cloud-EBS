import React from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';
import { CourseCard } from '@/widgets/course';
import { cn } from '@/shared/lib/utils';
import { BookOpen, Award, Clock, TrendingUp } from 'lucide-react';
import type { CourseWithProgress } from '@/entities/course';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Mock data - En producción vendría de la API
  const courses: CourseWithProgress[] = [
    {
      id: 1,
      name: 'Introducción a la Biblia',
      description: 'Curso introductorio al estudio de la Biblia',
      code: 'CUR-101',
      level: 'Básico',
      status: 'Publicado',
      coordinatorId: 1,
      coordinatorName: 'Pastor Juan',
      lessons: 10,
      assignments: 5,
      exams: 2,
      estimatedDuration: '10 semanas',
      category: 'Introducción',
      hasCertificate: true,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-15',
      progress: {
        percentage: 75,
        lessonsCompleted: 7,
        assignmentsCompleted: 3,
        assignmentsPending: 2,
        examsCompleted: 1
      }
    },
    {
      id: 2,
      name: 'Estudio del Nuevo Testamento',
      description: 'Análisis profundo de los libros del Nuevo Testamento',
      code: 'CUR-102',
      level: 'Intermedio',
      status: 'Publicado',
      coordinatorId: 2,
      coordinatorName: 'Pastora María',
      lessons: 15,
      assignments: 8,
      exams: 3,
      estimatedDuration: '15 semanas',
      category: 'Nuevo Testamento',
      hasCertificate: true,
      createdAt: '2025-01-05',
      updatedAt: '2025-01-20',
      progress: {
        percentage: 50,
        lessonsCompleted: 7,
        assignmentsCompleted: 4,
        assignmentsPending: 4,
        examsCompleted: 1
      }
    },
    {
      id: 3,
      name: 'Vida de Jesús',
      description: 'Estudio biográfico de la vida y ministerio de Jesús',
      code: 'CUR-103',
      level: 'Básico',
      status: 'Publicado',
      coordinatorId: 3,
      coordinatorName: 'Pastor Carlos',
      lessons: 12,
      assignments: 6,
      exams: 2,
      estimatedDuration: '12 semanas',
      category: 'Biografía',
      hasCertificate: true,
      createdAt: '2025-01-10',
      updatedAt: '2025-01-25',
      progress: {
        percentage: 90,
        lessonsCompleted: 11,
        assignmentsCompleted: 5,
        assignmentsPending: 1,
        examsCompleted: 2
      }
    },
    {
      id: 4,
      name: 'Salmo 23',
      description: 'Análisis detallado del Salmo 23',
      code: 'CUR-104',
      level: 'Básico',
      status: 'Publicado',
      coordinatorId: 4,
      coordinatorName: 'Pastora Ana',
      lessons: 5,
      assignments: 3,
      exams: 1,
      estimatedDuration: '5 semanas',
      category: 'Salmos',
      hasCertificate: true,
      createdAt: '2025-01-15',
      updatedAt: '2025-01-30',
      progress: {
        percentage: 30,
        lessonsCompleted: 1,
        assignmentsCompleted: 1,
        assignmentsPending: 2,
        examsCompleted: 0
      }
    }
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Hero Section con mejor jerarquía */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 bg-cover bg-center text-white rounded-xl px-6 md:px-8 py-32 md:py-36 shadow-soft relative">
        <div className="absolute top-6 left-6 md:top-8 md:left-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            ¡Bienvenido{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-primary-100 text-sm md:text-base">Aquí está tu resumen bíblico</p>
        </div>
        <div className="absolute top-6 right-6 md:top-8 md:right-8 text-right">
          <p className="text-primary-200 text-sm">Panel de</p>
          <p className="text-xl md:text-2xl font-bold capitalize">{user?.role || 'Estudiante'}</p>
        </div>
      </div>

      {/* Mejor jerarquía visual: Estadísticas destacadas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos Bíblicos Activos</CardTitle>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            {/* <p className="text-xs text-muted-foreground">+2 desde el último mes</p> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Bíblico</CardTitle>
            <Award className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.5</div>
            {/* <p className="text-xs text-muted-foreground">Calificación (A-)</p> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas de Estudio Bíblico</CardTitle>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24h</div>
            {/* <p className="text-xs text-muted-foreground">Esta semana</p> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Bíblicas Pendientes</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            {/* <p className="text-xs text-muted-foreground">Para esta semana</p> */}
          </CardContent>
        </Card>
      </div>
      {/* --- FIN DE LA SECCIÓN DE ESTADÍSTICAS --- */}

      {/* Mejor jerarquía visual: Sección de cursos */}
      <div className="mt-8">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">Mis Cursos Bíblicos</h2>
        
        {/* Grid responsive con CourseCard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              variant="compact"
              showProgress={true}
              showActions={false}
            />
          ))}
        </div>
        {/* --- FIN DE LA SECCIÓN DE CURSOS --- */}
      </div>
    </div>
  );
};

export default Dashboard;