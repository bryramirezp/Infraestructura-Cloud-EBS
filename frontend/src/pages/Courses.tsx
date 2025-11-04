import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { BookOpen, Clock, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const courses = [
  {
    id: "1",
    title: "Estudio de Romanos",
    instructor: "Pastor Juan Pérez",
    progress: 75,
    totalModules: 12,
    completedModules: 9,
    students: 45,
    schedule: "Lun, Mié, Vie 10:00 AM",
    status: "En progreso",
  },
  {
    id: "2",
    title: "Memorización Bíblica",
    instructor: "Pastora Elena García",
    progress: 60,
    totalModules: 10,
    completedModules: 6,
    students: 38,
    schedule: "Mar, Jue 2:00 PM",
    status: "En progreso",
  },
  {
    id: "3",
    title: "Estudio de Parábolas",
    instructor: "Pastor Miguel Ángel",
    progress: 90,
    totalModules: 15,
    completedModules: 13,
    students: 52,
    schedule: "Lun, Mié 4:00 PM",
    status: "Próximo a completar",
  },
  {
    id: "4",
    title: "Historia Bíblica",
    instructor: "Pastora Ana María",
    progress: 45,
    totalModules: 8,
    completedModules: 4,
    students: 41,
    schedule: "Mar, Jue 10:00 AM",
    status: "En progreso",
  },
  {
    id: "5",
    title: "Teología Sistemática",
    instructor: "Dr. Carlos Mendoza",
    progress: 30,
    totalModules: 20,
    completedModules: 6,
    students: 67,
    schedule: "Sáb 9:00 AM",
    status: "En progreso",
  },
  {
    id: "6",
    title: "Estudio de Génesis",
    instructor: "Pastor Roberto Silva",
    progress: 85,
    totalModules: 10,
    completedModules: 8,
    students: 33,
    schedule: "Dom 11:00 AM",
    status: "Próximo a completar",
  },
];

const Courses = () => {
  const { user, loading } = useAuth();

  // Estados de carga y error
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando cursos...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Acceso requerido</h2>
          <p className="text-muted-foreground">Debes iniciar sesión para ver tus cursos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 md:space-y-8 p-4 md:p-6 lg:p-8">
        {/* Mobile-First Design: Mejor jerarquía y responsive */}
        <div className="space-y-6 md:space-y-8">
          {/* Hero Section con mejor jerarquía visual */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl p-6 md:p-8 shadow-soft">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Mis Cursos</h1>
            <p className="text-primary-100 text-sm md:text-base">Gestiona y revisa el progreso de tus cursos</p>
          </div>

          {/* Navegación contextual: Búsqueda y filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar cursos..."
                className="w-full theme-input px-4 py-2 rounded-lg focus:ring-2 focus:ring-ring"
              />
            </div>
            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 theme-button rounded-lg text-sm md:text-base">
                Todos ({courses.length})
              </button>
              <button className="px-4 py-2 theme-input border border-border bg-background text-foreground rounded-lg hover:bg-accent transition-colors text-sm md:text-base">
                En progreso ({courses.filter(c => c.status === 'En progreso').length})
              </button>
              <button className="px-4 py-2 theme-input border border-border bg-background text-foreground rounded-lg hover:bg-accent transition-colors text-sm md:text-base">
                Completados ({courses.filter(c => c.status === 'Próximo a completar').length})
              </button>
            </div>
          </div>

          {/* Mobile-First Grid: Mejor experiencia en móviles */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-all duration-300 flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{course.title}</CardTitle>
                      <CardDescription>{course.instructor}</CardDescription>
                    </div>
                    <Badge variant={course.progress > 80 ? "default" : "secondary"}>
                      {course.status}
                    </Badge>
                  </div>
                </CardHeader>
                {/* Añadido flex-grow para que todas las tarjetas tengan la misma altura en el grid */}
                <CardContent className="flex flex-col flex-grow justify-between">
                  {/* MEJORA 3: Añadido flex-wrap y gap-y-2 para responsividad en la metadata */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{course.completedModules}/{course.totalModules} módulos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{course.students} estudiantes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{course.schedule}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progreso del curso</span>
                      <span className="font-semibold text-foreground">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
    </div>
  );
};

export default Courses;