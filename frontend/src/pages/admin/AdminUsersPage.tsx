import React, { useState } from 'react';
import { Users, UserCheck, UserX, Eye, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/widgets/data-table';
import { UserForm } from '@/widgets/forms';
import { StatsGrid } from '@/widgets/dashboard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { useAuth } from '@/app/providers/AuthProvider';
import { Progress } from '@/shared/ui/progress';
import { cn } from '@/shared/lib/utils';

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
          <span className={cn(
            "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
            value === 'admin' ? 'bg-primary/10 text-primary' :
            value === 'teacher' ? 'bg-primary/10 text-primary' :
            'bg-success/10 text-success'
          )}>
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
          <div className="flex items-center gap-2 min-w-[120px]">
            <Progress value={value} className="flex-1 max-w-[80px]" />
            <span className="text-sm text-muted-foreground">{value}%</span>
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
        <span className={cn(
          "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
          value === 'Activo' 
            ? 'bg-success/10 text-success' 
            : 'bg-destructive/10 text-destructive'
        )}>
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
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('View user details:', user);
    }
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
      toast.success('Usuario eliminado exitosamente');
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    }
  };

  const actions = (row: User) => (
    <div className="flex space-x-2">
      <button
        onClick={() => handleViewUser(row)}
        className="text-primary hover:text-primary/80"
        title="Ver detalles"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleEditUser(row)}
        className="text-muted-foreground hover:text-foreground"
        title="Editar"
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleDeleteUser(row)}
        className="text-destructive hover:text-destructive/80"
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
    <div className="space-y-8">
      {/* Header específico de la página */}
      <div className="bg-card border-b border-border px-8 py-4 animate-fade-in -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
            <p className="text-sm text-muted-foreground">Administra todos los usuarios de la plataforma</p>
          </div>
          <button
            onClick={() => setIsUserModalOpen(true)}
            className="theme-button px-4 py-2 rounded-lg flex items-center"
          >
            <Users className="h-4 w-4 mr-2" />
            Agregar Usuario
          </button>
        </div>
      </div>

      <div className="space-y-8">
          {/* Stats Cards */}
          <StatsGrid
            stats={[
              {
                title: "Total Usuarios",
                value: stats.total,
                icon: Users,
                color: 'blue' as const,
              },
              {
                title: "Usuarios Activos",
                value: stats.active,
                icon: UserCheck,
                color: 'green' as const,
              },
              {
                title: "Alumnos",
                value: stats.students,
                icon: UserCheck,
                color: 'purple' as const,
              },
              {
                title: "Coordinadores",
                value: stats.teachers,
                icon: UserCheck,
                color: 'orange' as const,
              },
              {
                title: "Administradores",
                value: stats.admins,
                icon: UserCheck,
                color: 'blue' as const,
              }
            ]}
            columns={5}
            className="mb-8"
          />

          {/* User Type Tabs */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-muted p-1 rounded-lg">
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
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
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

          {/* User Form */}
          <UserForm
            isOpen={isUserModalOpen}
            mode={selectedUser ? 'edit' : 'create'}
            initialData={selectedUser ? {
              name: selectedUser.name,
              email: selectedUser.email,
              role: (selectedUser.role === 'student' ? 'alumno' : selectedUser.role === 'teacher' ? 'coordinador' : 'administrador') as 'alumno' | 'administrador' | 'coordinador',
              status: selectedUser.status as 'Activo' | 'Inactivo' | 'Suspendido',
              phone: selectedUser.phone
            } : undefined}
            onSubmit={async (data) => {
                try {
                if (selectedUser) {
                  // Actualizar usuario
                  setUsers(users.map(u => 
                    u.id === selectedUser.id 
                      ? { ...u, ...data, password: undefined, confirmPassword: undefined }
                      : u
                  ));
                  toast.success('Usuario actualizado exitosamente');
                } else {
                  // Crear usuario
                  const newUser = {
                    id: users.length + 1,
                    ...data,
                    role: data.role === 'alumno' ? 'student' : data.role === 'coordinador' ? 'teacher' : 'admin',
                    progress: data.role === 'alumno' ? 0 : undefined,
                    courses: data.role === 'coordinador' ? 0 : undefined,
                    lastLogin: new Date().toISOString().split('T')[0],
                    registrationDate: new Date().toISOString().split('T')[0]
                  };
                  setUsers([...users, newUser as typeof users[0]]);
                  toast.success('Usuario creado exitosamente');
                }
                setIsUserModalOpen(false);
                setSelectedUser(null);
              } catch (error) {
                toast.error('Error al guardar el usuario');
              }
            }}
            onCancel={() => {
              setIsUserModalOpen(false);
              setSelectedUser(null);
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
                <UserX className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-foreground mb-6">
                  ¿Estás seguro de que quieres eliminar al usuario "{selectedUser?.name}"?
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
    </div>
  );
};
