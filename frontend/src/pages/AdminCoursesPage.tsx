import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, BookOpen, Users, Calendar, Settings } from 'lucide-react';
import { SidebarProvider, SidebarInset } from '../components/ui/sidebar';
import { UserSidebar } from '../components/Layout/Sidebar';
import { DataTable } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/Alert';
import { useAuth } from '../contexts/AuthContext';

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
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const columns = [
    {
      key: 'name',
      label: 'Nombre del Curso',
      sortable: true,
      render: (value: string, row: Course) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.category}</div>
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
          <Users className="h-4 w-4 text-gray-400 mr-1" />
          {value}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value === 'Publicado'
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
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
    console.log('View course:', course);
  };

  const confirmDelete = () => {
    if (selectedCourse) {
      setCourses(courses.filter(c => c.id !== selectedCourse.id));
      setAlert({ type: 'success', message: 'Curso eliminado exitosamente' });
      setIsDeleteModalOpen(false);
      setSelectedCourse(null);
    }
  };

  const actions = (row: Course) => (
    <div className="flex space-x-2">
      <button
        onClick={() => handleViewCourse(row)}
        className="text-blue-600 hover:text-blue-900"
        title="Ver detalles"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleEditCourse(row)}
        className="text-gray-600 hover:text-gray-900"
        title="Editar"
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleDeleteCourse(row)}
        className="text-red-600 hover:text-red-900"
        title="Eliminar"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <SidebarProvider>
      <UserSidebar user={user || undefined} />
      <SidebarInset>
        <header className="bg-white border-b border-gray-200 px-8 py-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Cursos</h1>
              <p className="text-sm text-gray-600">Administra todos los cursos de la plataforma</p>
            </div>
            <button
              onClick={handleCreateCourse}
              className="theme-button px-4 py-2 rounded-lg flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Curso
            </button>
          </div>
        </header>

        <div className="flex-1 p-8 animate-fade-in">
          {/* Alert */}
          {alert && (
            <div className="mb-6">
              <Alert
                variant={alert.type === 'success' ? 'default' : 'destructive'}
                className="mb-4"
              >
                <AlertTitle>{alert.type === 'success' ? 'Éxito' : 'Error'}</AlertTitle>
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Cursos</p>
                  <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Estudiantes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.reduce((sum, course) => sum + course.students, 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cursos Activos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.filter(c => c.status === 'Publicado').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cursos en Borrador</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.filter(c => c.status === 'Borrador').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Courses Table */}
          <DataTable
            columns={columns}
            data={courses}
            actions={actions}
            searchable={true}
            searchPlaceholder="Buscar cursos..."
          />

          {/* Create Course Modal */}
          <Modal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            title="Crear Nuevo Curso"
            size="lg"
          >
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Funcionalidad de creación de cursos próximamente</p>
            </div>
          </Modal>

          {/* Edit Course Modal */}
          <Modal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            title="Editar Curso"
            size="lg"
          >
            <div className="text-center py-8">
              <Edit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Funcionalidad de edición de cursos próximamente</p>
            </div>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            title="Confirmar Eliminación"
            size="sm"
          >
            <div className="text-center">
              <Trash2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-900 mb-4">
                ¿Estás seguro de que quieres eliminar el curso "{selectedCourse?.name}"?
              </p>
              <p className="text-sm text-gray-600 mb-6">
                Esta acción no se puede deshacer.
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
          </Modal>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
