import React, { useState } from 'react';
import { Settings, Mail, Users, Shield, Database, Save, Edit, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/Alert';
import { SidebarProvider, SidebarInset } from '../components/ui/sidebar';
import { UserSidebar } from '../components/Layout/Sidebar';
import { useAuth } from '../contexts/AuthContext';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
}

export const AdminSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'emails' | 'admins' | 'system'>('general');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Check if user has a preference stored
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Mock data
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([
    {
      id: 'welcome',
      name: 'Bienvenida',
      subject: '¡Bienvenido a Escuela Bíblica Salem!',
      content: 'Hola {{nombre}},\n\n¡Bienvenido a nuestra plataforma de formación bíblica! Estamos emocionados de tenerte con nosotros.\n\nTu cuenta ha sido creada exitosamente y ya puedes comenzar tu viaje espiritual.\n\nAtentamente,\nEl equipo de EBS',
      variables: ['nombre']
    },
    {
      id: 'completion',
      name: 'Felicitación por Completar Curso',
      subject: '¡Felicitaciones! Has completado {{curso}}',
      content: '¡Felicitaciones {{nombre}}!\n\nHas completado exitosamente el curso "{{curso}}" con una calificación de {{calificacion}}%.\n\nTu certificado está disponible en tu panel de estudiante.\n\n¡Sigue adelante en tu formación espiritual!\n\nAtentamente,\nEl equipo de EBS',
      variables: ['nombre', 'curso', 'calificacion']
    },
    {
      id: 'reminder',
      name: 'Recordatorio de Actividad',
      subject: 'No olvides continuar tu aprendizaje',
      content: 'Hola {{nombre}},\n\nHace tiempo que no vemos actividad en tu cuenta. Te recordamos que tienes cursos pendientes por completar.\n\n¡No pierdas el ritmo en tu formación espiritual!\n\nAtentamente,\nEl equipo de EBS',
      variables: ['nombre']
    }
  ]);

  const [admins, setAdmins] = useState([
    { id: 1, name: 'Admin Principal', email: 'admin@ebsalem.com', status: 'Activo' },
    { id: 2, name: 'Pastor Juan Pérez', email: 'juan@ebsalem.com', status: 'Activo' }
  ]);

  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSaveSettings = () => {
    setAlert({ type: 'success', message: 'Configuración guardada exitosamente' });
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Apply dark mode on component mount
  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSaveTemplate = (template: EmailTemplate) => {
    setEmailTemplates(templates =>
      templates.map(t => t.id === template.id ? template : t)
    );
    setEditingTemplate(null);
    setAlert({ type: 'success', message: 'Plantilla de correo guardada exitosamente' });
  };

  const handleAddAdmin = () => {
    // Mock add admin functionality
    setAlert({ type: 'success', message: 'Administrador invitado exitosamente' });
  };

  const handleRemoveAdmin = (adminId: number) => {
    setAdmins(admins.filter(a => a.id !== adminId));
    setAlert({ type: 'success', message: 'Administrador removido exitosamente' });
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración General</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Plataforma
            </label>
            <input
              type="text"
              defaultValue="Escuela Bíblica Salem"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo de Contacto
            </label>
            <input
              type="email"
              defaultValue="contacto@ebsalem.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calificación Mínima para Aprobar (%)
            </label>
            <input
              type="number"
              defaultValue="80"
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número Máximo de Intentos en Cuestionarios
            </label>
            <input
              type="number"
              defaultValue="3"
              min="1"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="maintenance"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="maintenance" className="ml-2 block text-sm text-gray-900">
              Modo de Mantenimiento (Los usuarios no podrán acceder)
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="darkMode"
              checked={darkMode}
              onChange={toggleDarkMode}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="darkMode" className="ml-2 block text-sm text-gray-900">
              Modo Oscuro
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Correo</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Servidor SMTP
            </label>
            <input
              type="text"
              defaultValue="smtp.gmail.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Puerto
            </label>
            <input
              type="number"
              defaultValue="587"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario
            </label>
            <input
              type="email"
              defaultValue="noreply@ebsalem.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                defaultValue="••••••••"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Plantillas de Correo</h3>
        <div className="space-y-4">
          {emailTemplates.map((template) => (
            <div key={template.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{template.name}</h4>
                <button
                  onClick={() => setEditingTemplate(template)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-2">Asunto: {template.subject}</p>
              <div className="text-xs text-gray-500">
                Variables disponibles: {template.variables.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAdminManagement = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Gestión de Administradores</h3>
          <button
            onClick={handleAddAdmin}
            className="theme-button px-4 py-2 rounded-lg flex items-center"
          >
            <Users className="h-4 w-4 mr-2" />
            Invitar Administrador
          </button>
        </div>
        <div className="space-y-3">
          {admins.map((admin) => (
            <div key={admin.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">{admin.name}</div>
                <div className="text-sm text-gray-600">{admin.email}</div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  admin.status === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {admin.status}
                </span>
                <button
                  onClick={() => handleRemoveAdmin(admin.id)}
                  className="text-red-600 hover:text-red-900"
                  disabled={admin.email === 'admin@ebsalem.com'}
                >
                  <Shield className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Base de Datos</span>
              <span className="text-sm text-green-600 font-medium">Operativo</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Servidor Web</span>
              <span className="text-sm text-green-600 font-medium">Operativo</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Almacenamiento S3</span>
              <span className="text-sm text-green-600 font-medium">Operativo</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Servicio de Correo</span>
              <span className="text-sm text-green-600 font-medium">Operativo</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Último Backup</span>
              <span className="text-sm text-gray-900">2025-01-15 02:00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Espacio Usado</span>
              <span className="text-sm text-gray-900">2.3 GB / 10 GB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Versión del Sistema</span>
              <span className="text-sm text-gray-900">v1.2.3</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mantenimiento</h3>
        <div className="space-y-4">
          <button className="bg-warning text-warning-foreground px-4 py-2 rounded-lg hover:bg-warning/90 transition-colors">
            Ejecutar Backup Manual
          </button>
          <button className="theme-button px-4 py-2 rounded-lg ml-3">
            Limpiar Cache
          </button>
          <button className="bg-muted text-muted-foreground px-4 py-2 rounded-lg hover:bg-muted/80 transition-colors ml-3">
            Ver Logs del Sistema
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <SidebarProvider>
      <UserSidebar user={user || undefined} />
      <SidebarInset>
        <header className="bg-white border-b border-gray-200 px-8 py-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
              <p className="text-sm text-gray-600">Administra la configuración general de la plataforma</p>
            </div>
            <button
              onClick={handleSaveSettings}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
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

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'general', label: 'General', icon: Settings },
              { id: 'emails', label: 'Correos', icon: Mail },
              { id: 'admins', label: 'Administradores', icon: Users },
              { id: 'system', label: 'Sistema', icon: Database }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'general' && renderGeneralSettings()}
        {activeTab === 'emails' && renderEmailSettings()}
        {activeTab === 'admins' && renderAdminManagement()}
        {activeTab === 'system' && renderSystemSettings()}

        {/* Email Template Editor Modal */}
        {editingTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Editar Plantilla: {editingTemplate.name}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Asunto</label>
                  <input
                    type="text"
                    value={editingTemplate.subject}
                    onChange={(e) => setEditingTemplate({...editingTemplate, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contenido</label>
                  <textarea
                    value={editingTemplate.content}
                    onChange={(e) => setEditingTemplate({...editingTemplate, content: e.target.value})}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  Variables disponibles: {editingTemplate.variables.join(', ')}
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSaveTemplate(editingTemplate)}
                  className="px-4 py-2 theme-button rounded-lg"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
