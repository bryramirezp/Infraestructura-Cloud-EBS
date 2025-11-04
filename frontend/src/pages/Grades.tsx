import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useAuth } from "../contexts/AuthContext";

const gradeData = [
  {
    course: "Matemáticas Avanzadas",
    assignments: [
      { name: "Parcial 1", grade: 9.0, weight: 30, date: "2024-09-15" },
      { name: "Tarea 1", grade: 8.5, weight: 10, date: "2024-09-22" },
      { name: "Parcial 2", grade: 8.8, weight: 30, date: "2024-10-20" },
      { name: "Proyecto Final", grade: null, weight: 30, date: "Pendiente" },
    ],
    average: 8.77,
  },
  {
    course: "Física Cuántica",
    assignments: [
      { name: "Examen 1", grade: 7.5, weight: 25, date: "2024-09-18" },
      { name: "Laboratorio 1", grade: 9.0, weight: 15, date: "2024-09-25" },
      { name: "Examen 2", grade: 8.2, weight: 25, date: "2024-10-15" },
      { name: "Laboratorio 2", grade: null, weight: 15, date: "Pendiente" },
      { name: "Proyecto", grade: null, weight: 20, date: "Pendiente" },
    ],
    average: 8.18,
  },
  {
    course: "Programación Web",
    assignments: [
      { name: "Práctica 1", grade: 9.5, weight: 20, date: "2024-09-12" },
      { name: "Proyecto 1", grade: 9.0, weight: 30, date: "2024-09-28" },
      { name: "Práctica 2", grade: 9.2, weight: 20, date: "2024-10-10" },
      { name: "Proyecto Final", grade: 9.3, weight: 30, date: "2024-10-25" },
    ],
    average: 9.23,
  },
];

// --- REFACTORIZACIÓN DE AYUDAS DE COLOR ---

/**
 * Devuelve el nombre de la variante del Badge según la calificación.
 * Asume que tienes variantes "success" y "warning" definidas en tu tema de Shadcn/ui.
 */
const getGradeVariant = (grade: number | null): "default" | "destructive" | "secondary" | "outline" => {
  if (grade === null) return "secondary";
  if (grade >= 9.0) return "default"; // Verde para excelente
  if (grade >= 7.5) return "outline"; // Azul para bueno
  if (grade >= 6.0) return "secondary"; // Amarillo para regular
  return "destructive"; // Rojo para insuficiente
};

/**
 * Devuelve la clase de color de TEXTO según la calificación.
 */
const getGradeColorClass = (grade: number | null): string => {
  if (grade === null) return "text-muted-foreground";
  if (grade >= 9.0) return "text-success"; // Asume que "text-success" está definido en tailwind.config.js
  if (grade >= 7.5) return "text-primary";
  if (grade >= 6.0) return "text-warning"; // Asume que "text-warning" está definido
  return "text-destructive";
};

// --- FIN DE LA REFACTORIZACIÓN DE AYUDAS ---

const Grades = () => {
  const { user, loading } = useAuth();

  // Estados de carga y error
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando calificaciones...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Acceso requerido</h2>
          <p className="text-muted-foreground">Debes iniciar sesión para ver tus calificaciones</p>
        </div>
      </div>
    );
  }
  const overallAverage = (
    gradeData.reduce((sum, course) => sum + course.average, 0) / gradeData.length
  );
  
  // Obtenemos la clase de color para el promedio general
  const overallColorClass = getGradeColorClass(overallAverage);

  return (
    <div className="flex-1 space-y-6 md:space-y-8 p-4 md:p-6 lg:p-8">
        {/* Mobile-First Design: Mejor jerarquía visual */}
        <div className="space-y-6 md:space-y-8">
          {/* Hero Section para promedio - Mejor jerarquía visual */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl p-6 md:p-8 shadow-soft">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Calificaciones</h1>
                <p className="text-primary-100 text-sm md:text-base">Revisa tu desempeño académico</p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-primary-200 text-sm mb-1">Promedio General</p>
                <p className={`text-3xl md:text-4xl font-bold ${overallColorClass}`}>
                  {overallAverage.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Progressive Disclosure: Acordeón para cursos */}
          <div className="space-y-4">
            {gradeData.map((courseData, index) => (
              <details key={courseData.course} className="group">
                <summary className="flex items-center justify-between p-4 bg-card rounded-lg border border-border cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{courseData.course}</h3>
                      <p className="text-sm text-muted-foreground">Promedio: {courseData.average.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getGradeVariant(courseData.average)}>
                      {courseData.average.toFixed(2)}
                    </Badge>
                    <svg className="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </summary>

                <div className="mt-2 p-4 bg-card rounded-lg border border-border">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Detalle de Evaluaciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Evaluación</TableHead>
                            <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                            <TableHead className="text-center">Ponderación</TableHead>
                            <TableHead className="text-right">Calificación</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {courseData.assignments.map((assignment, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{assignment.name}</TableCell>
                              <TableCell className="text-muted-foreground hidden sm:table-cell">{assignment.date}</TableCell>
                              <TableCell className="text-center">{assignment.weight}%</TableCell>
                              <TableCell className="text-right">
                                {assignment.grade !== null ? (
                                  <Badge variant={getGradeVariant(assignment.grade)}>
                                    {assignment.grade.toFixed(1)}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Pendiente</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </details>
            ))}
          </div>
        </div>
    </div>
  );
};

export default Grades;
