import React from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { GradeCard } from '@/widgets/grades';
import type { CourseGrades } from '@/entities/grade';

// Mock data adaptado a la estructura de entidades
const mockGradeData: CourseGrades[] = [
  {
    courseId: 1,
    courseName: "Matemáticas Avanzadas",
    studentId: 1,
    grades: [
      {
        id: 1,
        studentId: 1,
        courseId: 1,
        courseName: "Matemáticas Avanzadas",
        assignmentId: 1,
        assignmentName: "Parcial 1",
        type: 'examen',
        grade: 9.0,
        maxGrade: 10,
        percentage: 90,
        weight: 30,
        evaluationDate: "2024-09-15",
        status: 'calificado'
      },
      {
        id: 2,
        studentId: 1,
        courseId: 1,
        courseName: "Matemáticas Avanzadas",
        assignmentId: 2,
        assignmentName: "Tarea 1",
        type: 'tarea',
        grade: 8.5,
        maxGrade: 10,
        percentage: 85,
        weight: 10,
        evaluationDate: "2024-09-22",
        status: 'calificado'
      },
      {
        id: 3,
        studentId: 1,
        courseId: 1,
        courseName: "Matemáticas Avanzadas",
        assignmentId: 3,
        assignmentName: "Parcial 2",
        type: 'examen',
        grade: 8.8,
        maxGrade: 10,
        percentage: 88,
        weight: 30,
        evaluationDate: "2024-10-20",
        status: 'calificado'
      },
      {
        id: 4,
        studentId: 1,
        courseId: 1,
        courseName: "Matemáticas Avanzadas",
        assignmentId: 4,
        assignmentName: "Proyecto Final",
        type: 'proyecto',
        grade: null,
        maxGrade: 10,
        percentage: 0,
        weight: 30,
        evaluationDate: "Pendiente",
        status: 'pendiente'
      }
    ],
    average: 8.77,
    weightedAverage: 8.77,
    totalWeight: 70,
    isPassed: true,
    minGradeToPass: 6.0
  },
  {
    courseId: 2,
    courseName: "Física Cuántica",
    studentId: 1,
    grades: [
      {
        id: 5,
        studentId: 1,
        courseId: 2,
        courseName: "Física Cuántica",
        assignmentId: 5,
        assignmentName: "Examen 1",
        type: 'examen',
        grade: 7.5,
        maxGrade: 10,
        percentage: 75,
        weight: 25,
        evaluationDate: "2024-09-18",
        status: 'calificado'
      },
      {
        id: 6,
        studentId: 1,
        courseId: 2,
        courseName: "Física Cuántica",
        assignmentId: 6,
        assignmentName: "Laboratorio 1",
        type: 'práctica',
        grade: 9.0,
        maxGrade: 10,
        percentage: 90,
        weight: 15,
        evaluationDate: "2024-09-25",
        status: 'calificado'
      },
      {
        id: 7,
        studentId: 1,
        courseId: 2,
        courseName: "Física Cuántica",
        assignmentId: 7,
        assignmentName: "Examen 2",
        type: 'examen',
        grade: 8.2,
        maxGrade: 10,
        percentage: 82,
        weight: 25,
        evaluationDate: "2024-10-15",
        status: 'calificado'
      },
      {
        id: 8,
        studentId: 1,
        courseId: 2,
        courseName: "Física Cuántica",
        assignmentId: 8,
        assignmentName: "Laboratorio 2",
        type: 'práctica',
        grade: null,
        maxGrade: 10,
        percentage: 0,
        weight: 15,
        evaluationDate: "Pendiente",
        status: 'pendiente'
      },
      {
        id: 9,
        studentId: 1,
        courseId: 2,
        courseName: "Física Cuántica",
        assignmentId: 9,
        assignmentName: "Proyecto",
        type: 'proyecto',
        grade: null,
        maxGrade: 10,
        percentage: 0,
        weight: 20,
        evaluationDate: "Pendiente",
        status: 'pendiente'
      }
    ],
    average: 8.18,
    weightedAverage: 8.18,
    totalWeight: 65,
    isPassed: true,
    minGradeToPass: 6.0
  },
  {
    courseId: 3,
    courseName: "Programación Web",
    studentId: 1,
    grades: [
      {
        id: 10,
        studentId: 1,
        courseId: 3,
        courseName: "Programación Web",
        assignmentId: 10,
        assignmentName: "Práctica 1",
        type: 'práctica',
        grade: 9.5,
        maxGrade: 10,
        percentage: 95,
        weight: 20,
        evaluationDate: "2024-09-12",
        status: 'calificado'
      },
      {
        id: 11,
        studentId: 1,
        courseId: 3,
        courseName: "Programación Web",
        assignmentId: 11,
        assignmentName: "Proyecto 1",
        type: 'proyecto',
        grade: 9.0,
        maxGrade: 10,
        percentage: 90,
        weight: 30,
        evaluationDate: "2024-09-28",
        status: 'calificado'
      },
      {
        id: 12,
        studentId: 1,
        courseId: 3,
        courseName: "Programación Web",
        assignmentId: 12,
        assignmentName: "Práctica 2",
        type: 'práctica',
        grade: 9.2,
        maxGrade: 10,
        percentage: 92,
        weight: 20,
        evaluationDate: "2024-10-10",
        status: 'calificado'
      },
      {
        id: 13,
        studentId: 1,
        courseId: 3,
        courseName: "Programación Web",
        assignmentId: 13,
        assignmentName: "Proyecto Final",
        type: 'proyecto',
        grade: 9.3,
        maxGrade: 10,
        percentage: 93,
        weight: 30,
        evaluationDate: "2024-10-25",
        status: 'calificado'
      }
    ],
    average: 9.23,
    weightedAverage: 9.23,
    totalWeight: 100,
    isPassed: true,
    minGradeToPass: 6.0
  }
];

const Grades = () => {
  const { user, loading } = useAuth();

  // Estados de carga y error
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
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

  // Calcular promedio general
  const overallAverage =
    mockGradeData.reduce((sum, course) => sum + course.average, 0) / mockGradeData.length;

  // Obtener clase de color para el promedio general
  const getGradeColorClass = (grade: number): string => {
    if (grade >= 9.0) return "text-success";
    if (grade >= 7.5) return "text-primary";
    if (grade >= 6.0) return "text-warning";
    return "text-destructive";
  };

  const overallColorClass = getGradeColorClass(overallAverage);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Hero Section para promedio */}
      <div className="bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl p-6 md:p-8 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Calificaciones</h1>
            <p className="text-primary-foreground/80 text-sm md:text-base">
              Revisa tu desempeño académico
            </p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-primary-foreground/80 text-sm mb-1">Promedio General</p>
            <p className={`text-3xl md:text-4xl font-bold ${overallColorClass}`}>
              {overallAverage.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de calificaciones por curso */}
      <div className="space-y-4">
        {mockGradeData.map((courseGrades, index) => (
          <GradeCard
            key={courseGrades.courseId}
            courseGrades={courseGrades}
            variant="detailed"
            showDetails={true}
            collapsible={true}
            index={index}
          />
        ))}
      </div>

      {/* Mensaje si no hay calificaciones */}
      {mockGradeData.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No hay calificaciones disponibles
          </h3>
          <p className="text-muted-foreground">
            Aún no tienes calificaciones registradas en ningún curso.
          </p>
        </div>
      )}
    </div>
  );
};

export default Grades;
