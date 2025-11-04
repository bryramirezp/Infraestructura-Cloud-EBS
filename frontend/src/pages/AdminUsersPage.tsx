import React, { useState } from 'react';
import { Users, UserCheck, UserX, Eye, Edit, Trash2 } from 'lucide-react';
import { DataTable } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/Alert';
import { SidebarProvider, SidebarInset } from '../components/ui/sidebar';
import { UserSidebar } from '../components/Layout/Sidebar';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  status: 'Activo' | 'Inactivo';
  progress?: number;
  courses?: number;
  lastLogin: string;
  registrationDate: string;
}

export const AdminUsersPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: 'María González',
      email: 'maria@email.com',
      role: 'student',
      status: 'Activo',
      progress: 85,
      lastLogin: '2025-01-15',
      registrationDate: '2025-01-01'
    },
    {
      id: 2,
      name: 'Carlos Ruiz',
      email: 'carlos@email.com',
      role: 'student',
      status: 'Activo',
      progress: 62,
      lastLogin: '2025-01-14',
      registrationDate: '2025-01-02'
    },
    {
      id: 3,
      name: 'Pastor Juan Pérez',
      email: 'juan@ebsalem.com',
      role: 'teacher',
      status: 'Activo',
      courses: 5,
      lastLogin: '2025-01-15',
      registrationDate: '2024-12-15'
    },
    {
      id: 4,
      name: 'Ana Martínez',
      email: 'ana@email.com',
      role: 'student',
      status: 'Inactivo',
      progress: 43,
      lastLogin: '2025-01-10',
      registrationDate: '2025-01-05'
    },
    {
      id: 5,
      name: 'Pastora Elena García',
      email: 'elena@ebsalem.com',
      role: 'teacher',
      status: 'Activo',
      courses: 3,
      lastLogin: '2025-01-14',
      registrationDate: '2024-12-20'
    },
    {
      id: 6,
      name: 'Admin Principal',
      email: 'admin@ebsalem.com',
      role: 'admin',
      status: 'Activo',
      lastLogin: '2025-01-15',
      registrationDate: '2024-12-01'
    }
  ]);

  const [userTab, setUserTab] = useState<'all' | 'students' | 'teachers' | 'admins'>('all');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filteredUsers = users.filter(user => {
    if (userTab === 'all') return true;
    if (userTab === 'students') return user.role === 'student';
    if (userTab === 'teachers') return user.role === 'teacher';
    if (userTab === 'admins') return user.role === 'admin';
    return true;
  });

  const columns = [
    {
      key: 'name',
      label: 'Nombre Completo',
      sortable: true
    },
    {
      key: 'email',
      label: 'Correo Electrónico',
      sortable: true
    },
    {
      key: 'role',
      label: 'Rol',
      sortable: true,
      render: (value: string) => {
        const roleLabels = {
          student: 'Alumno',
          teacher: 'Coordinador',
          admin: 'Administrador'
        };
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value === 'admin' ? 'bg-purple-100 text-purple-800' :
            value === 'teacher' ? 'bg-blue-100 text-blue-800' :
            'bg-green-100 text-green-800'
          }`}>
            {roleLabels[value as keyof typeof roleLabels]}
          </span>
        );
      }
    },
    {
      key: 'progress',
      label: 'Progreso',
      sortable: true,
      render: (value: number, row: User) => {
        if (row.role !== 'student') return '-';
        return (
          <div className="flex items-center">
            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${value}%` }}></div>
            </div>
            <span className="text-sm text-gray-600">{value}%</span>
          </div>
        );
      }
    },
    {
      key: 'courses',
      label: 'Cursos',
      sortable: true,
      render: (value: number, row: User) => {
        if (row.role !== 'teacher') return '-';
        return value;
      }
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'lastLogin',
      label: 'Último Acceso',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-ES')
    }
  ];

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    // Could open a detailed view modal
    console.log('View user details:', user);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };


  const confirmDelete = () => {
    if (selectedUser) {
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setAlert({ type: 'success', message: 'Usuario eliminado exitosamente' });
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    }
  };

  const actions = (row: User) => (
    <div className="flex space-x-2">
      <button
        onClick={() => handleViewUser(row)}
        className="text-blue-600 hover:text-blue-900"
        title="Ver detalles"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleEditUser(row)}
        className="text-gray-600 hover:text-gray-900"
        title="Editar"
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleDeleteUser(row)}
        className="text-red-600 hover:text-red-900"
        title="Eliminar"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  const getStats = () => {
    const total = users.length;
    const active = users.filter(u => u.status === 'Activo').length;
    const students = users.filter(u => u.role === 'student').length;
    const teachers = users.filter(u => u.role === 'teacher').length;
    const admins = users.filter(u => u.role === 'admin').length;

    return { total, active, students, teachers, admins };
  };

  const stats = getStats();

  return (
    <SidebarProvider>
      <UserSidebar user={user || undefined} />
      <SidebarInset>
        <header className="bg-white border-b border-gray-200 px-8 py-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
              <p className="text-sm text-gray-600">Administra todos los usuarios de la plataforma</p>
            </div>
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="theme-button px-4 py-2 rounded-lg flex items-center"
            >
              <Users className="h-4 w-4 mr-2" />
              Agregar Usuario
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Alumnos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.students}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Coordinadores</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.teachers}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Administradores</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
                </div>
              </div>
            </div>
          </div>

          {/* User Type Tabs */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {[
                { id: 'all', label: 'Todos', count: stats.total },
                { id: 'students', label: 'Alumnos', count: stats.students },
                { id: 'teachers', label: 'Coordinadores', count: stats.teachers },
                { id: 'admins', label: 'Administradores', count: stats.admins }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setUserTab(tab.id as any)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    userTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <DataTable
            columns={columns}
            data={filteredUsers}
            actions={actions}
            searchable={true}
            searchPlaceholder="Buscar usuarios..."
          />

          {/* User Modal */}
          <Modal
            isOpen={isUserModalOpen}
            onClose={() => setIsUserModalOpen(false)}
            title={selectedUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
            size="md"
          >
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Funcionalidad de {selectedUser ? "edición" : "creación"} de usuarios próximamente
              </p>
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
              <UserX className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-900 mb-4">
                ¿Estás seguro de que quieres eliminar al usuario "{selectedUser?.name}"?
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
