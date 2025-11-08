import React, { useMemo } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { AssignmentCard } from '@/widgets/assignments';
import { cn } from '@/shared/lib/utils';
import type { Assignment } from '@/entities/assignment';

// Mock data adaptado a la estructura de entidades
const mockAssignments: Assignment[] = [
  {
    id: 1,
    title: "Ensayo sobre Romanos 8",
    description: "Análisis del capítulo 8 de Romanos enfocado en la vida en el Espíritu",
    type: 'ensayo',
    priority: 'alta',
    courseId: 1,
    courseName: "Estudio de Romanos",
    assignedDate: "2025-10-15",
    dueDate: "2025-10-25",
    status: 'pendiente' as const,
    maxGrade: 100,
    weight: 30
  },
  {
    id: 2,
    title: "Memorización de Salmos 23",
    description: "Memorizar completamente el Salmo 23 en versión Reina-Valera 1960",
    type: 'tarea',
    priority: 'media',
    courseId: 2,
    courseName: "Memorización Bíblica",
    assignedDate: "2025-10-10",
    dueDate: "2025-10-27",
    status: 'en_progreso' as const,
    maxGrade: 100,
    weight: 20
  },
  {
    id: 3,
    title: "Análisis de Parábola del Sembrador",
    description: "Análisis detallado de la parábola del sembrador y sus aplicaciones prácticas",
    type: 'proyecto',
    priority: 'media',
    courseId: 3,
    courseName: "Estudio de Parábolas",
    assignedDate: "2025-10-05",
    dueDate: "2025-10-30",
    submissionDate: "2025-10-28",
    status: 'calificado' as const,
    maxGrade: 100,
    weight: 40,
    grade: 95
  },
  {
    id: 4,
    title: "Estudio del Tabernáculo",
    description: "Investigación sobre el significado espiritual del tabernáculo de Moisés",
    type: 'práctica',
    priority: 'baja',
    courseId: 4,
    courseName: "Historia Bíblica",
    assignedDate: "2025-10-12",
    dueDate: "2025-11-02",
    status: 'pendiente',
    maxGrade: 100,
    weight: 15
  }
];

export const AssignmentsPage: React.FC = () => {
  const { user, loading } = useAuth();

  // Estados de carga y error
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando tareas...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Acceso requerido</h2>
          <p className="text-muted-foreground">Debes iniciar sesión para ver tus tareas</p>
        </div>
      </div>
    );
  }

  // Procesar tareas: calcular días hasta la entrega y formatear fechas
  const processedAssignments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getDaysUntil = (dateString: string): number => {
      const dueDate = new Date(dateString);
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = dueDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const formatDate = (dateString: string): string => {
      const date = new Date(dateString);
      const utcDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60000);
      return utcDate.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    };

    return mockAssignments
      .map(assignment => ({
        ...assignment,
        daysUntil: getDaysUntil(assignment.dueDate),
        formattedDueDate: formatDate(assignment.dueDate)
      }))
      // Ordenar: pendientes/en progreso primero, luego por fecha
      .sort((a, b) => {
        if (a.status === 'calificado' && b.status !== 'calificado') return 1;
        if (a.status !== 'calificado' && b.status === 'calificado') return -1;
        return a.daysUntil - b.daysUntil;
      });
  }, []);

  // Filtrar por estado
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'pendiente' | 'en_progreso' | 'calificado'>('all');

  const filteredAssignments = useMemo(() => {
    if (filterStatus === 'all') return processedAssignments;
    return processedAssignments.filter(a => a.status === filterStatus);
  }, [processedAssignments, filterStatus]);

  const statusCounts = {
    all: processedAssignments.length,
    pendiente: processedAssignments.filter(a => a.status === 'pendiente').length,
    en_progreso: processedAssignments.filter(a => a.status === 'en_progreso').length,
    calificado: processedAssignments.filter(a => a.status === 'calificado').length
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl p-6 md:p-8 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Mis Tareas</h1>
            <p className="text-primary-foreground/80 text-sm md:text-base">
              Gestiona tus tareas y actividades pendientes
            </p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-primary-foreground/80 text-sm">Total de tareas</p>
            <p className="text-2xl md:text-3xl font-bold">{processedAssignments.length}</p>
          </div>
        </div>
      </div>

      {/* Filtros por estado */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        <button
          onClick={() => setFilterStatus('all')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm md:text-base transition-colors",
            filterStatus === 'all'
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-background text-foreground hover:bg-accent"
          )}
        >
          Todas ({statusCounts.all})
        </button>
        <button
          onClick={() => setFilterStatus('pendiente')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm md:text-base transition-colors",
            filterStatus === 'pendiente'
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-background text-foreground hover:bg-accent"
          )}
        >
          Pendientes ({statusCounts.pendiente})
        </button>
        <button
          onClick={() => setFilterStatus('en_progreso')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm md:text-base transition-colors",
            filterStatus === 'en_progreso'
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-background text-foreground hover:bg-accent"
          )}
        >
          En Progreso ({statusCounts.en_progreso})
        </button>
        <button
          onClick={() => setFilterStatus('calificado')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm md:text-base transition-colors",
            filterStatus === 'calificado'
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-background text-foreground hover:bg-accent"
          )}
        >
          Calificadas ({statusCounts.calificado})
        </button>
      </div>

      {/* Grid de tareas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {filteredAssignments.map((assignment) => (
          <AssignmentCard
            key={assignment.id}
            assignment={assignment}
            daysUntil={assignment.daysUntil}
            formattedDueDate={assignment.formattedDueDate}
            variant="default"
            showDescription={true}
          />
        ))}
      </div>

      {/* Mensaje si no hay tareas */}
      {filteredAssignments.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No hay tareas {filterStatus !== 'all' ? 'en este estado' : ''}
          </h3>
          <p className="text-muted-foreground">
            {filterStatus !== 'all' 
              ? 'Intenta cambiar el filtro para ver otras tareas.'
              : 'No tienes tareas asignadas en este momento.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;
