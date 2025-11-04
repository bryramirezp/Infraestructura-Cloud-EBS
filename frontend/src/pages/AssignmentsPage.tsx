import React, { useMemo } from 'react'; // MEJORA: Importar useMemo
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';

// --- MEJORA: Tipado de datos ---
type AssignmentStatus = "pending" | "in_progress" | "completed";
type AssignmentPriority = "high" | "medium" | "low";

interface Assignment {
  id: number;
  title: string;
  course: string;
  dueDate: string;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  description: string;
}

// --- MEJORA: Datos pre-procesados ---
interface ProcessedAssignment extends Assignment {
  daysUntil: number;
  formattedDate: string;
}

const assignments: Assignment[] = [
  {
    id: 1,
    title: "Ensayo sobre Romanos 8",
    course: "Estudio de Romanos",
    dueDate: "2025-10-25",
    status: "pending",
    priority: "high",
    description: "Análisis del capítulo 8 de Romanos enfocado en la vida en el Espíritu"
  },
  {
    id: 2,
    title: "Memorización de Salmos 23",
    course: "Memorización Bíblica",
    dueDate: "2025-10-27",
    status: "in_progress",
    priority: "medium",
    description: "Memorizar completamente el Salmo 23 en versión Reina-Valera 1960"
  },
  {
    id: 3,
    title: "Análisis de Parábola del Sembrador",
    course: "Estudio de Parábolas",
    dueDate: "2025-10-30",
    status: "completed",
    priority: "medium",
    description: "Análisis detallado de la parábola del sembrador y sus aplicaciones prácticas"
  },
  {
    id: 4,
    title: "Estudio del Tabernáculo",
    course: "Historia Bíblica",
    dueDate: "2025-11-02",
    status: "pending",
    priority: "low",
    description: "Investigación sobre el significado espiritual del tabernáculo de Moisés"
  }
];

// --- MEJORA: Helpers refactorizados ---

const getStatusVariant = (status: AssignmentStatus): "default" | "destructive" | "secondary" | "outline" => {
  switch (status) {
    case 'completed':
      return "default"; // Verde para completado
    case 'in_progress':
      return "secondary"; // Amarillo para en progreso
    case 'pending':
    default:
      return "destructive"; // Rojo para pendiente
  }
};

const getStatusText = (status: AssignmentStatus): string => {
  switch (status) {
    case 'completed':
      return "Completada";
    case 'in_progress':
      return "En Progreso";
    case 'pending':
    default:
      return "Pendiente";
  }
}

const getPriorityVariant = (priority: AssignmentPriority): "default" | "destructive" | "secondary" | "outline" => {
  switch (priority) {
    case 'high':
      return "destructive";
    case 'medium':
      return "outline";
    case 'low':
    default:
      return "secondary";
  }
};

const getPriorityText = (priority: AssignmentPriority): string => {
  switch (priority) {
    case 'high':
      return "Alta";
    case 'medium':
      return "Media";
    case 'low':
    default:
      return "Baja";
  }
}

const getStatusIcon = (status: AssignmentStatus) => {
  switch (status) {
    case 'completed':
      // Usa colores semánticos del tema
      return <CheckCircle className="w-5 h-5 text-success" />;
    case 'in_progress':
      return <Clock className="w-5 h-5 text-warning" />;
    case 'pending':
    default:
      return <AlertCircle className="w-5 h-5 text-destructive" />;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const utcDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60000);
  return utcDate.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
};

// --- MEJORA: Componente de Tarjeta de Tarea (DRY) ---
const AssignmentCard: React.FC<{ assignment: ProcessedAssignment }> = ({ assignment }) => {
  
  const daysText =
    assignment.daysUntil < 0
      ? "Vencida"
      : assignment.daysUntil === 0
      ? "Vence Hoy"
      : assignment.daysUntil === 1
      ? "Vence Mañana"
      : `Vence en ${assignment.daysUntil} días`;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            {getStatusIcon(assignment.status)}
            <div>
              <CardTitle className="text-xl">{assignment.title}</CardTitle>
              <CardDescription className="mt-1">{assignment.course}</CardDescription>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Badge variant={getPriorityVariant(assignment.priority)} className="justify-center">
              {getPriorityText(assignment.priority)}
            </Badge>
            {assignment.status !== 'completed' && (
              <Badge variant={getStatusVariant(assignment.status)} className="justify-center">
                {getStatusText(assignment.status)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        <p className="text-muted-foreground mb-4">{assignment.description}</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{assignment.formattedDate}</span>
          </div>
          {/* Muestra los días restantes si no está completada */}
          {assignment.status !== 'completed' && (
            <div className="flex items-center gap-1 font-medium text-foreground">
              <Clock className="w-4 h-4" />
              <span>{daysText}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Componente Principal de la Página ---
export const AssignmentsPage: React.FC = () => {
  const { user, loading } = useAuth();

  // Estados de carga y error
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
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

  // MEJORA: Optimización con useMemo para calcular y ordenar tareas
  const processedAssignments = useMemo(() => {
    const today = new Date("2025-10-22T12:00:00"); // Fecha de hoy (simulada para consistencia)
    today.setHours(0, 0, 0, 0);

    const getDays = (dateString: string) => {
      const dueDate = new Date(dateString);
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = dueDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    return assignments
      .map(task => {
        const daysUntil = getDays(task.dueDate);
        return {
          ...task,
          daysUntil,
          formattedDate: formatDate(task.dueDate),
        };
      })
      // Ordena por estado (pendientes/en progreso primero) y luego por fecha
      .sort((a, b) => {
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
        return a.daysUntil - b.daysUntil;
      });
      
  }, []); // Dependencia vacía ya que 'assignments' es estático

  if (!user) {
    return <div>Loading...</div>; // O un componente de esqueleto
  }

  return (
    <div className="flex-1 space-y-6 md:space-y-8 p-4 md:p-6 lg:p-8">
        {/* Mobile-First Design: Mejor jerarquía y navegación contextual */}
        <div className="space-y-6 md:space-y-8">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl p-6 md:p-8 shadow-soft">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Mis Tareas</h1>
                <p className="text-primary-100 text-sm md:text-base">Gestiona tus tareas y actividades pendientes</p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-primary-200 text-sm">Total de tareas</p>
                <p className="text-2xl md:text-3xl font-bold">{processedAssignments.length}</p>
              </div>
            </div>
          </div>

          {/* Progressive Disclosure: Tabs por estado */}
          <div className="space-y-4">
            {/* Tabs para filtrar por estado */}
            <div className="flex flex-wrap gap-2 border-b border-border pb-4">
              <button className="px-4 py-2 theme-button rounded-lg text-sm md:text-base">
                Todas ({processedAssignments.length})
              </button>
              <button className="px-4 py-2 theme-input border border-border bg-background text-foreground rounded-lg hover:bg-accent text-sm md:text-base">
                Pendientes ({processedAssignments.filter(a => a.status === 'pending').length})
              </button>
              <button className="px-4 py-2 theme-input border border-border bg-background text-foreground rounded-lg hover:bg-accent text-sm md:text-base">
                En Progreso ({processedAssignments.filter(a => a.status === 'in_progress').length})
              </button>
              <button className="px-4 py-2 theme-input border border-border bg-background text-foreground rounded-lg hover:bg-accent text-sm md:text-base">
                Completadas ({processedAssignments.filter(a => a.status === 'completed').length})
              </button>
            </div>

            {/* Grid con progressive disclosure */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {processedAssignments.map((assignment) => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))}
            </div>
          </div>
        </div>
    </div>
  );
};

export default AssignmentsPage;