import { CourseList } from "@/widgets/course";
import { useAuth } from "@/app/providers/AuthProvider";
import type { CourseWithProgress } from "@/entities/course";

// Mock data - En producción vendría de la API
const courses: CourseWithProgress[] = [
  {
    id: 1,
    name: "Estudio de Romanos",
    description: "Estudio profundo de la carta del apóstol Pablo a los romanos",
    code: "CUR-001",
    level: "Intermedio",
    status: "Publicado",
    coordinatorId: 1,
    coordinatorName: "Pastor Juan Pérez",
    lessons: 12,
    assignments: 8,
    exams: 3,
    estimatedDuration: "12 semanas",
    category: "Nuevo Testamento",
    hasCertificate: true,
    createdAt: "2025-01-01",
    updatedAt: "2025-01-15",
    studentsEnrolled: 45,
    progress: {
      percentage: 75,
      lessonsCompleted: 9,
      assignmentsCompleted: 6,
      assignmentsPending: 2,
      examsCompleted: 2,
      currentLessonId: 10
    }
  },
  {
    id: 2,
    name: "Memorización Bíblica",
    description: "Técnicas y métodos para memorizar versículos bíblicos",
    code: "CUR-002",
    level: "Básico",
    status: "Publicado",
    coordinatorId: 2,
    coordinatorName: "Pastora Elena García",
    lessons: 10,
    assignments: 5,
    exams: 2,
    estimatedDuration: "10 semanas",
    category: "Práctica",
    hasCertificate: true,
    createdAt: "2025-01-05",
    updatedAt: "2025-01-20",
    studentsEnrolled: 38,
    progress: {
      percentage: 60,
      lessonsCompleted: 6,
      assignmentsCompleted: 3,
      assignmentsPending: 2,
      examsCompleted: 1
    }
  },
  {
    id: 3,
    name: "Estudio de Parábolas",
    description: "Análisis detallado de las parábolas de Jesús",
    code: "CUR-003",
    level: "Intermedio",
    status: "Publicado",
    coordinatorId: 3,
    coordinatorName: "Pastor Miguel Ángel",
    lessons: 15,
    assignments: 10,
    exams: 4,
    estimatedDuration: "15 semanas",
    category: "Nuevo Testamento",
    hasCertificate: true,
    createdAt: "2024-12-15",
    updatedAt: "2025-01-18",
    studentsEnrolled: 52,
    progress: {
      percentage: 90,
      lessonsCompleted: 13,
      assignmentsCompleted: 9,
      assignmentsPending: 1,
      examsCompleted: 3
    }
  },
  {
    id: 4,
    name: "Historia Bíblica",
    description: "Recorrido por los eventos históricos de la Biblia",
    code: "CUR-004",
    level: "Básico",
    status: "Publicado",
    coordinatorId: 4,
    coordinatorName: "Pastora Ana María",
    lessons: 8,
    assignments: 4,
    exams: 2,
    estimatedDuration: "8 semanas",
    category: "Historia",
    hasCertificate: true,
    createdAt: "2025-01-10",
    updatedAt: "2025-01-22",
    studentsEnrolled: 41,
    progress: {
      percentage: 45,
      lessonsCompleted: 4,
      assignmentsCompleted: 2,
      assignmentsPending: 2,
      examsCompleted: 1
    }
  },
  {
    id: 5,
    name: "Teología Sistemática",
    description: "Estudio sistemático de las doctrinas bíblicas fundamentales",
    code: "CUR-005",
    level: "Avanzado",
    status: "Publicado",
    coordinatorId: 5,
    coordinatorName: "Dr. Carlos Mendoza",
    lessons: 20,
    assignments: 12,
    exams: 5,
    estimatedDuration: "20 semanas",
    category: "Teología",
    hasCertificate: true,
    createdAt: "2024-11-20",
    updatedAt: "2025-01-15",
    studentsEnrolled: 67,
    progress: {
      percentage: 30,
      lessonsCompleted: 6,
      assignmentsCompleted: 3,
      assignmentsPending: 9,
      examsCompleted: 1
    }
  },
  {
    id: 6,
    name: "Estudio de Génesis",
    description: "Estudio versículo por versículo del libro de Génesis",
    code: "CUR-006",
    level: "Intermedio",
    status: "Publicado",
    coordinatorId: 6,
    coordinatorName: "Pastor Roberto Silva",
    lessons: 10,
    assignments: 6,
    exams: 3,
    estimatedDuration: "10 semanas",
    category: "Antiguo Testamento",
    hasCertificate: true,
    createdAt: "2025-01-08",
    updatedAt: "2025-01-25",
    studentsEnrolled: 33,
    progress: {
      percentage: 85,
      lessonsCompleted: 8,
      assignmentsCompleted: 5,
      assignmentsPending: 1,
      examsCompleted: 2
    }
  }
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
    <div className="space-y-6 md:space-y-8">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl p-6 md:p-8 shadow-soft">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Mis Cursos</h1>
        <p className="text-primary-100 text-sm md:text-base">Gestiona y revisa el progreso de tus cursos</p>
      </div>

      <CourseList
        courses={courses}
        variant="detailed"
        showProgress={true}
        showActions={true}
        onView={(id) => {
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.log('Ver curso:', id);
          }
          // TODO: Implementar navegación a detalle del curso
        }}
        columns={3}
        searchable={true}
        searchPlaceholder="Buscar cursos..."
      />
    </div>
  );
};

export default Courses;