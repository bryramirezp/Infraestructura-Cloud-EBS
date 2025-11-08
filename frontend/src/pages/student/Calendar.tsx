import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Input } from "@/shared/ui/input";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useMemo } from "react"; // MEJORA: Importar useMemo

const tasks = [
  {
    id: 1,
    title: "Ensayo sobre Romanos 8",
    course: "Estudio de Romanos",
    dueDate: "2025-10-25",
    dueTime: "11:59 PM",
    type: "Ensayo",
    priority: "high",
  },
  {
    id: 2,
    title: "Memorización de Salmos 23",
    course: "Memorización Bíblica",
    dueDate: "2025-10-27",
    dueTime: "11:59 PM",
    type: "Memorización",
    priority: "medium",
  },
  {
    id: 3,
    title: "Análisis de Parábola del Sembrador",
    course: "Estudio de Parábolas",
    dueDate: "2025-10-30",
    dueTime: "11:59 PM",
    type: "Análisis",
    priority: "medium",
  },
  {
    id: 4,
    title: "Estudio del Tabernáculo",
    course: "Historia Bíblica",
    dueDate: "2025-11-02",
    dueTime: "11:59 PM",
    type: "Investigación",
    priority: "low",
  },
  {
    id: 5,
    title: "Lectura Génesis 1-3",
    course: "Estudio de Génesis",
    dueDate: "2025-11-05",
    dueTime: "11:59 PM",
    type: "Lectura",
    priority: "medium",
  },
  {
    id: 6,
    title: "Examen Final - Teología Sistemática",
    course: "Teología Sistemática",
    dueDate: "2025-11-10",
    dueTime: "10:00 AM",
    type: "Examen",
    priority: "high",
  },
];


// --- MEJORA 1: Refactorización de Helpers de Estilo ---

// Convertido a 'getPriorityVariant' para usar semánticamente las variantes de Badge
const getPriorityVariant = (priority: string): "default" | "destructive" | "secondary" | "outline" => {
  switch (priority) {
    case "high":
      return "destructive";
    case "medium":
      return "outline";
    case "low":
    default:
      return "secondary";
  }
};

// Renombrado a 'getTypeClass' para mayor claridad, ya que crea un estilo personalizado
// (fondo suave + texto de color) que 'variant="outline"' no hace por defecto.
const getTypeClass = (type: string) => {
  switch (type) {
    case "Examen":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "Proyecto":
      return "bg-primary/10 text-primary border-primary/20";
    case "Laboratorio":
      return "bg-accent/10 text-accent border-accent/20"; // Asume que 'text-accent' está definido
    default:
      return "bg-secondary text-secondary-foreground border-border";
  }
};
// --- Fin de Helpers de Estilo ---

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  // Ajuste para asegurar que la fecha se interprete como UTC y evitar problemas de zona horaria
  const utcDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60000);
  return utcDate.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
};

// --- MEJORA 2: Creación de un componente reutilizable para Tareas ---
// Esto sigue el principio DRY (Don't Repeat Yourself)
interface TaskItemProps {
  task: {
    id: number;
    title: string;
    course: string;
    dueTime: string;
    type: string;
    priority: string;
    // Propiedades pre-calculadas de useMemo
    daysUntil: number;
    formattedDate: string;
  };
}

const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const daysText =
    task.daysUntil === 0
      ? "Hoy"
      : task.daysUntil === 1
      ? "Mañana"
      : `En ${task.daysUntil} días`;

  return (
    <div
      className="flex flex-col sm:flex-row items-start gap-4 p-4 bg-card rounded-lg border border-border transition-colors hover:border-primary/50"
    >
      {/* --- Sección Izquierda (Info) --- */}
      <div className="flex-1">
        <h4 className="font-semibold text-foreground mb-1">{task.title}</h4>
        <p className="text-sm text-muted-foreground mb-2">{task.course}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <CalendarIcon className="w-4 h-4" />
            <span>{task.formattedDate}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{task.dueTime}</span>
          </div>
        </div>
      </div>
      {/* --- Sección Derecha (Badges) --- */}
      <div className="flex flex-row sm:flex-col items-end gap-2 w-full sm:w-auto pt-2 sm:pt-0">
        <Badge
          variant="outline"
          className={`w-full sm:w-auto justify-center ${getTypeClass(task.type)}`}
        >
          {task.type}
        </Badge>
        <Badge
          variant={getPriorityVariant(task.priority)}
          className="w-full sm:w-auto justify-center"
        >
          {daysText}
        </Badge>
      </div>
    </div>
  );
};
// --- Fin de Componente TaskItem ---


const CalendarPage = () => {
  const { user, loading } = useAuth();

  // Estados de carga y error
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📅</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Acceso requerido</h2>
          <p className="text-muted-foreground">Debes iniciar sesión para ver tu calendario</p>
        </div>
      </div>
    );
  }

  // --- MEJORA 3: Optimización con useMemo ---
  // Pre-calcula todos los valores (días restantes, fechas formateadas)
  // y ordena la lista UNA SOLA VEZ.
  const processedTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getDays = (dateString: string) => {
      const dueDate = new Date(dateString);
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = dueDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    return tasks
      .map(task => {
        const daysUntil = getDays(task.dueDate);
        return {
          ...task,
          daysUntil,
          isUrgent: daysUntil >= 0 && daysUntil <= 7,
          formattedDate: formatDate(task.dueDate),
        };
      })
      // Filtra tareas pasadas
      .filter(task => task.daysUntil >= 0)
      // MEJORA 4: Ordena las tareas por fecha de entrega
      .sort((a, b) => a.daysUntil - b.daysUntil);
      
  }, []); // El array de dependencias está vacío ya que 'tasks' es un mock estático

  const urgentTasks = processedTasks.filter(task => task.isUrgent);
  const upcomingTasks = processedTasks; // Ya está filtrado y ordenado
  // --- Fin de useMemo ---

  return (
    <div className="space-y-6 md:space-y-8">
          {/* Hero Section con estadísticas */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl p-6 md:p-8 shadow-soft">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Calendario de Tareas</h1>
                <p className="text-primary-100 text-sm md:text-base">Organiza tus fechas límite y actividades</p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-primary-200 text-sm">Tareas urgentes</p>
                <p className="text-2xl md:text-3xl font-bold">{urgentTasks.length}</p>
              </div>
            </div>
          </div>

          {/* Navegación contextual: Búsqueda y filtros por tiempo */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Buscar tareas..."
              />
            </div>
            {/* Filtros por tiempo */}
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 theme-button rounded-lg text-sm md:text-base">
                Esta semana ({urgentTasks.length})
              </button>
              <button className="px-4 py-2 theme-input border border-border bg-background text-foreground rounded-lg hover:bg-accent transition-colors text-sm md:text-base">
                Este mes ({processedTasks.filter(t => t.daysUntil <= 30).length})
              </button>
              <button className="px-4 py-2 theme-input border border-border bg-background text-foreground rounded-lg hover:bg-accent transition-colors text-sm md:text-base">
                Próximos 3 meses ({processedTasks.filter(t => t.daysUntil <= 90).length})
              </button>
            </div>
          </div>

          {/* Sección Tareas Urgentes */}
          {urgentTasks.length > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-destructive">Tareas Urgentes</CardTitle>
                <CardDescription>Vencen en los próximos 7 días</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Usamos el componente reutilizable */}
                  {urgentTasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sección Todas las Tareas */}
          <Card>
            <CardHeader>
              <CardTitle>Todas las Tareas Pendientes</CardTitle>
              <CardDescription>Vista completa de tus actividades, ordenadas por fecha.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Usamos el componente reutilizable */}
                {upcomingTasks.length > 0 ? (
                  upcomingTasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))
                ) : (
                  <p className="text-muted-foreground text-center p-4">¡No tienes tareas pendientes!</p>
                )}
              </div>
            </CardContent>
          </Card>
    </div>
  );
};

export default CalendarPage;