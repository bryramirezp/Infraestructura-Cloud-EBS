import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, BookOpen, Users, Calendar, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/widgets/data-table';
import { CourseForm } from '@/widgets/forms';
import { StatsGrid } from '@/widgets/dashboard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { useAuth } from '@/app/providers/AuthProvider';
import { cn } from '@/shared/lib/utils';

interface Course {
  id: number;
  name: string;
  description: string;
  students: number;
  status: 'Publicado' | 'Borrador';
  createdAt: string;
  instructor: string;
  category: string;
}

export const AdminCoursesPage: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([
    {
      id: 1,
      name: 'Génesis - Creación',
      description: 'Estudio profundo del libro de Génesis',
      students: 45,
      status: 'Publicado',
      createdAt: '2025-01-15',
      instructor: 'Pastor Juan Pérez',
      category: 'Antiguo Testamento'
    },
    {
      id: 2,
      name: 'Éxodo - Liberación',
      description: 'El camino hacia la libertad espiritual',
      students: 38,
      status: 'Publicado',
      createdAt: '2025-01-20',
      instructor: 'Pastora Elena García',
      category: 'Antiguo Testamento'
    },
    {
      id: 3,
      name: 'Salmos - Adoración',
      description: 'Cantos y oraciones del corazón',
      students: 52,
      status: 'Borrador',
      createdAt: '2025-01-25',
      instructor: 'Pastor Carlos Ruiz',
      category: 'Poéticos'
    }
  ]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const columns = [
    {
      key: 'name',
      label: 'Nombre del Curso',
      sortable: true,
      render: (value: string, row: Course) => (
        <div>
          <div className="font-medium text-foreground">{value}</div>
          <div className="text-sm text-muted-foreground">{row.category}</div>
        </div>
      )
    },
    {
      key: 'instructor',
      label: 'Instructor',
      sortable: true
    },
    {
      key: 'students',
      label: 'Estudiantes',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center">
          <Users className="h-4 w-4 text-muted-foreground mr-1" />
          {value}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      render: (value: string) => (
        <span className={cn(
          "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
          value === 'Publicado'
            ? 'bg-success/10 text-success'
            : 'bg-warning/10 text-warning'
        )}>
          {value}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Fecha Creación',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-ES')
    }
  ];

  const handleCreateCourse = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setIsEditModalOpen(true);
  };

  const handleDeleteCourse = (course: Course) => {
    setSelectedCourse(course);
    setIsDeleteModalOpen(true);
  };

  const handleViewCourse = (course: Course) => {
    // Navigate to course details
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('View course:', course);
    }
  };

  const confirmDelete = () => {
    if (selectedCourse) {
      setCourses(courses.filter(c => c.id !== selectedCourse.id));
      toast.success('Curso eliminado exitosamente');
      setIsDeleteModalOpen(false);
      setSelectedCourse(null);
    }
  };

  const actions = (row: Course) => (
    <div className="flex space-x-2">
      <button
        onClick={() => handleViewCourse(row)}
        className="text-primary hover:text-primary/80"
        title="Ver detalles"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleEditCourse(row)}
        className="text-muted-foreground hover:text-foreground"
        title="Editar"
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleDeleteCourse(row)}
        className="text-destructive hover:text-destructive/80"
        title="Eliminar"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header específico de la página */}
      <div className="bg-card border-b border-border px-8 py-4 animate-fade-in -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión de Cursos</h1>
            <p className="text-sm text-muted-foreground">Administra todos los cursos de la plataforma</p>
          </div>
          <button
            onClick={handleCreateCourse}
            className="theme-button px-4 py-2 rounded-lg flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Curso
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsGrid
        stats={[
          {
            title: "Total Cursos",
            value: courses.length,
            icon: BookOpen,
            color: 'blue' as const,
          },
          {
            title: "Total Estudiantes",
            value: courses.reduce((sum, course) => sum + course.students, 0),
            icon: Users,
            color: 'green' as const,
          },
          {
            title: "Cursos Activos",
            value: courses.filter(c => c.status === 'Publicado').length,
            icon: Settings,
            color: 'purple' as const,
          },
          {
            title: "Cursos en Borrador",
            value: courses.filter(c => c.status === 'Borrador').length,
            icon: Calendar,
            color: 'orange' as const,
          }
        ]}
        columns={4}
        className="mb-8"
      />

      {/* Courses Table */}
      <DataTable
        columns={columns}
        data={courses}
        actions={actions}
        searchable={true}
        searchPlaceholder="Buscar cursos..."
      />

      {/* Course Forms */}
      <CourseForm
        isOpen={isCreateModalOpen || isEditModalOpen}
        mode={selectedCourse ? 'edit' : 'create'}
        initialData={selectedCourse ? {
          name: selectedCourse.name,
          description: selectedCourse.description,
          code: `CUR-${selectedCourse.id.toString().padStart(3, '0')}`,
          level: 'Básico' as const,
          status: selectedCourse.status === 'Publicado' ? 'Publicado' as const : 'Borrador' as const,
          imageUrl: '',
          coordinatorId: 1,
          lessons: 0,
          estimatedDuration: '',
          category: selectedCourse.category,
          hasCertificate: true
        } : undefined}
        coordinators={[
          { id: 1, name: 'Pastor Juan Pérez' },
          { id: 2, name: 'Pastora Elena García' },
          { id: 3, name: 'Pastor Miguel Ángel' }
        ]}
        onSubmit={async (data) => {
          try {
            if (selectedCourse) {
              // Actualizar curso
              setCourses(courses.map(c => 
                c.id === selectedCourse.id 
                  ? { 
                      ...c, 
                      name: data.name,
                      description: data.description,
                      category: data.category,
                      status: data.status,
                      instructor: [
                        { id: 1, name: 'Pastor Juan Pérez' },
                        { id: 2, name: 'Pastora Elena García' },
                        { id: 3, name: 'Pastor Miguel Ángel' }
                      ].find(coord => coord.id === data.coordinatorId)?.name || c.instructor
                    }
                  : c
              ));
              toast.success('Curso actualizado exitosamente');
            } else {
              // Crear curso
              const newCourse: Course = {
                id: courses.length + 1,
                name: data.name,
                description: data.description,
                students: 0,
                status: data.status,
                createdAt: new Date().toISOString().split('T')[0],
                instructor: [
                  { id: 1, name: 'Pastor Juan Pérez' },
                  { id: 2, name: 'Pastora Elena García' },
                  { id: 3, name: 'Pastor Miguel Ángel' }
                ].find(c => c.id === data.coordinatorId)?.name || '',
                category: data.category
              };
              setCourses([...courses, newCourse]);
              toast.success('Curso creado exitosamente');
            }
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            setSelectedCourse(null);
          } catch (error) {
            toast.error('Error al guardar el curso');
          }
        }}
        onCancel={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedCourse(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-4">
            <Trash2 className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-foreground mb-6">
              ¿Estás seguro de que quieres eliminar el curso "{selectedCourse?.name}"?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 bg-muted text-muted-foreground px-4 py-2 rounded-lg hover:bg-muted/80 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg hover:bg-destructive/90 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
