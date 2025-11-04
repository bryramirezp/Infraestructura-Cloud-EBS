import React, { useState } from 'react';
import {
  Users,
  BookOpen,
  Award,
  TrendingUp,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Settings,
  Mail,
  MessageSquare,
  Server,
  CheckCircle
} from 'lucide-react';
import { SidebarProvider, SidebarInset } from '../components/ui/sidebar';
import { UserSidebar } from '../components/Layout/Sidebar';
import { StatCard } from '../components/Dashboard/StatCard';
import { CourseForm } from '../components/forms/CourseForm';
import { UserForm } from '../components/forms/UserForm';
import { useAuth } from '../contexts/AuthContext';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab] = useState('overview');
  const [userTab, setUserTab] = useState('students');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCourseFormOpen, setIsCourseFormOpen] = useState(false);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);

  // Mock data - En producción vendría de la API
  const stats = {
    totalStudents: 156,
    activeCourses: 12,
    certificatesIssued: 89,
    studentProgress: {
      '0-25%': 15,
      '26-50%': 28,
      '51-75%': 45,
      '76-100%': 68
    }
  };

  const mockUsers = {
    students: [
      { id: 1, name: 'María González', email: 'maria@email.com', progress: 85, status: 'Activo', lastLogin: '2025-01-15' },
      { id: 2, name: 'Carlos Ruiz', email: 'carlos@email.com', progress: 62, status: 'Activo', lastLogin: '2025-01-14' },
      { id: 3, name: 'Ana Martínez', email: 'ana@email.com', progress: 43, status: 'Inactivo', lastLogin: '2025-01-10' },
    ],
    teachers: [
      { id: 1, name: 'Pastor Juan Pérez', email: 'juan@ebsalem.com', courses: 5, status: 'Activo' },
      { id: 2, name: 'Pastora Elena García', email: 'elena@ebsalem.com', courses: 3, status: 'Activo' },
    ],
    admins: [
      { id: 1, name: 'Admin Principal', email: 'admin@ebsalem.com', role: 'Super Admin', status: 'Activo' },
    ]
  };

  const mockCourses = [
    { id: 1, name: 'Génesis - Creación', description: 'Estudio profundo del libro de Génesis', students: 45, status: 'Activo' },
    { id: 2, name: 'Éxodo - Liberación', description: 'El camino hacia la libertad espiritual', students: 38, status: 'Activo' },
    { id: 3, name: 'Salmos - Adoración', description: 'Cantos y oraciones del corazón', students: 52, status: 'Activo' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Alumnos"
          value={stats.totalStudents}
          icon={Users}
          color="blue"
          trend={{ value: 12, label: "vs mes anterior", isPositive: true }}
        />
        <StatCard
          title="Cursos Activos"
          value={stats.activeCourses}
          icon={BookOpen}
          color="green"
          trend={{ value: 2, label: "este mes", isPositive: true }}
        />
        <StatCard
          title="Certificados Emitidos"
          value={stats.certificatesIssued}
          icon={Award}
          color="purple"
          trend={{ value: 8, label: "este mes", isPositive: true }}
        />
        <StatCard
          title="Progreso Promedio"
          value={`${stats.studentProgress}%`}
          icon={TrendingUp}
          color="orange"
          trend={{ value: 5, label: "vs mes anterior", isPositive: true }}
        />
      </div>

      {/* Activity Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente (Últimos 7 días)</h3>
        <div className="grid grid-cols-7 gap-4">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, index) => {
            const enrollments = Math.floor(Math.random() * 20) + 5;
            const completions = Math.floor(Math.random() * 15) + 2;
            return (
              <div key={index} className="text-center">
                <div className="text-sm font-medium text-gray-600 mb-2">{day}</div>
                <div className="space-y-2">
                  <div className="flex flex-col items-center">
                    <div className="text-xs text-blue-600 mb-1">Inscripciones</div>
                    <div className="w-8 bg-blue-100 rounded-full h-12 flex items-end justify-center">
                      <div
                        className="bg-blue-600 rounded-full w-6"
                        style={{ height: `${(enrollments / 25) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs font-medium text-gray-900 mt-1">{enrollments}</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-xs text-green-600 mb-1">Finalizaciones</div>
                    <div className="w-8 bg-green-100 rounded-full h-12 flex items-end justify-center">
                      <div
                        className="bg-green-600 rounded-full w-6"
                        style={{ height: `${(completions / 25) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs font-medium text-gray-900 mt-1">{completions}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Completions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Últimos Cursos Aprobados</h3>
        <div className="space-y-3">
          {[
            { name: 'María González', course: 'Génesis - Creación', grade: 95, date: '2025-01-15' },
            { name: 'Carlos Ruiz', course: 'Éxodo - Liberación', grade: 88, date: '2025-01-14' },
            { name: 'Ana Martínez', course: 'Salmos - Adoración', grade: 92, date: '2025-01-13' },
            { name: 'Pedro Sánchez', course: 'Mateo - Evangelio', grade: 87, date: '2025-01-12' },
            { name: 'Laura Jiménez', course: 'Romanos - Epístola', grade: 90, date: '2025-01-11' }
          ].map((completion, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{completion.name}</p>
                  <p className="text-sm text-gray-600">{completion.course}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">{completion.grade}%</p>
                <p className="text-sm text-gray-500">{new Date(completion.date).toLocaleDateString('es-ES')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progreso General de Alumnos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats.studentProgress).map(([range, count]) => (
            <div key={range} className="text-center">
              <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{count}</span>
              </div>
              <p className="text-sm text-gray-600">{range}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      {/* User Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'students', label: 'Alumnos', count: mockUsers.students.length },
          { id: 'teachers', label: 'Coordinadores', count: mockUsers.teachers.length },
          { id: 'admins', label: 'Administradores', count: mockUsers.admins.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setUserTab(tab.id)}
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

      {/* Search and Add */}
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setIsUserFormOpen(true)}
          className="theme-button px-4 py-2 rounded-lg flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Usuario
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                {userTab === 'students' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progreso</th>}
                {userTab === 'teachers' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cursos</th>}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockUsers[userTab as keyof typeof mockUsers].map((user: any) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  {userTab === 'students' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${user.progress}%` }}></div>
                        </div>
                        <span className="text-sm text-gray-600">{user.progress}%</span>
                      </div>
                    </td>
                  )}
                  {userTab === 'teachers' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.courses}</td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const handleCreateCourse = async (courseData: any) => {
    try {
      // API call to create course using serverless-offline endpoint
      const response = await fetch('http://localhost:4000/dev/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        throw new Error('Error creating course');
      }

      const result = await response.json();
      console.log('Course created successfully:', result);

      // Check if the response has the expected structure
      if (result.success && result.data) {
        alert('Curso creado exitosamente');
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }

    } catch (error) {
      console.error('Error creating course:', error);
      alert('Error al crear el curso. Por favor, inténtalo de nuevo.');
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      // API call to create user using serverless-offline endpoint
      const response = await fetch('http://localhost:4000/dev/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        let errorMessage = 'Error creating user';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error('Respuesta del servidor no es JSON válido');
      }

      console.log('User created successfully:', result);

      // Check if the response has the expected structure
      if (result.success && result.data) {
        alert('Usuario creado exitosamente');
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }

    } catch (error) {
      console.error('Error creating user:', error);
      alert(`Error al crear el usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };



  const renderCourseManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Gestión de Cursos</h3>
        <button
          onClick={() => setIsCourseFormOpen(true)}
          className="theme-button px-4 py-2 rounded-lg flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Curso
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiantes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockCourses.map((course) => (
                <tr key={course.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{course.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.students}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {course.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">Editar</button>
                      <button className="text-green-600 hover:text-green-900">Contenido</button>
                      <button className="text-purple-600 hover:text-purple-900">Cuestionarios</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Reportes y Métricas</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Report */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Reporte de Cursos</h4>
          <div className="space-y-3">
            {mockCourses.map((course) => (
              <div key={course.id} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{course.name}</span>
                <div className="flex items-center">
                  <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">85%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Report */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Actividad Reciente</h4>
          <div className="space-y-3">
            {mockUsers.students.slice(0, 5).map((student) => (
              <div key={student.id} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">{student.name}</p>
                  <p className="text-xs text-gray-500">Último acceso: {student.lastLogin}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  student.status === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {student.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Sistema y Configuración</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <Mail className="h-5 w-5 text-blue-600 mr-2" />
            <h4 className="text-md font-semibold text-gray-900">Configuración de Notificaciones</h4>
          </div>
          <p className="text-sm text-gray-600 mb-4">Gestiona las plantillas de correo electrónico</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Editar Plantillas
          </button>
        </div>

        {/* Forum Management */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <MessageSquare className="h-5 w-5 text-green-600 mr-2" />
            <h4 className="text-md font-semibold text-gray-900">Gestión del Foro</h4>
          </div>
          <p className="text-sm text-gray-600 mb-4">Modera discusiones y responde consultas</p>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            Ver Foro
          </button>
        </div>

        {/* System Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <Server className="h-5 w-5 text-purple-600 mr-2" />
            <h4 className="text-md font-semibold text-gray-900">Estado del Sistema</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Base de Datos</span>
              <span className="text-sm text-green-600 font-medium">Operativo</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Servidor Web</span>
              <span className="text-sm text-green-600 font-medium">Operativo</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Almacenamiento</span>
              <span className="text-sm text-green-600 font-medium">Operativo</span>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <Settings className="h-5 w-5 text-orange-600 mr-2" />
            <h4 className="text-md font-semibold text-gray-900">Configuración General</h4>
          </div>
          <p className="text-sm text-gray-600 mb-4">Ajustes generales de la plataforma</p>
          <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
            Configurar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <SidebarProvider>
      <UserSidebar user={user || undefined} />
      <SidebarInset>

        {/* Dashboard Content */}
        <div className="flex-1 p-8 animate-fade-in">
          {/* Content */}
          {renderOverview()}
  
          {/* User Management Tab */}
          {activeTab === 'users' && renderUserManagement()}
  
          {/* Course Management Tab */}
          {activeTab === 'courses' && renderCourseManagement()}
  
          {/* Reports Tab */}
          {activeTab === 'reports' && renderReports()}
  
          {/* System Settings Tab */}
          {activeTab === 'system' && renderSystemSettings()}
  
          {/* Course Form Modal */}
          <CourseForm
            isOpen={isCourseFormOpen}
            onClose={() => setIsCourseFormOpen(false)}
            onSubmit={handleCreateCourse}
          />

          {/* User Form Modal */}
          <UserForm
            isOpen={isUserFormOpen}
            onClose={() => setIsUserFormOpen(false)}
            onSubmit={handleCreateUser}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
