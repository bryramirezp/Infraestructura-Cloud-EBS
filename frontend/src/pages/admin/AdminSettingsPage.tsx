import React, { useState } from 'react';
import { Settings, Mail, Users, Shield, Database, Save, Edit, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertTitle, AlertDescription } from '@/shared/ui/Alert';
import { useAuth } from '@/app/providers/AuthProvider';
import { useTheme } from '@/app/styles/theme';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Checkbox } from '@/shared/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { cn } from '@/shared/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
}

export const AdminSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'general' | 'emails' | 'admins' | 'system'>('general');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleSaveSettings = () => {
    toast.success('Configuración guardada exitosamente');
  };

  const handleSaveTemplate = (template: EmailTemplate) => {
    setEmailTemplates(templates =>
      templates.map(t => t.id === template.id ? template : t)
    );
    setEditingTemplate(null);
    toast.success('Plantilla de correo guardada exitosamente');
  };

  const handleAddAdmin = () => {
    toast.success('Administrador invitado exitosamente');
  };

  const handleRemoveAdmin = (adminId: number) => {
    setAdmins(admins.filter(a => a.id !== adminId));
    toast.success('Administrador removido exitosamente');
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuración General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="platform-name">
                Nombre de la Plataforma
              </Label>
              <Input
                id="platform-name"
                type="text"
                defaultValue="Escuela Bíblica Salem"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="contact-email">
                Correo de Contacto
              </Label>
              <Input
                id="contact-email"
                type="email"
                defaultValue="contacto@ebsalem.com"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="min-grade">
                Calificación Mínima para Aprobar (%)
              </Label>
              <Input
                id="min-grade"
                type="number"
                defaultValue="80"
                min="0"
                max="100"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="max-attempts">
                Número Máximo de Intentos en Cuestionarios
              </Label>
              <Input
                id="max-attempts"
                type="number"
                defaultValue="3"
                min="1"
                max="10"
                className="mt-2"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="maintenance"
                checked={maintenanceMode}
                onCheckedChange={(checked) => setMaintenanceMode(checked === true)}
              />
              <Label htmlFor="maintenance" className="cursor-pointer">
                Modo de Mantenimiento (Los usuarios no podrán acceder)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="darkMode"
                checked={isDark}
                onCheckedChange={(checked) => {
                  setTheme(checked ? 'dark' : 'light');
                }}
              />
              <Label htmlFor="darkMode" className="cursor-pointer">
                Modo Oscuro ({theme === 'system' ? 'Sistema' : isDark ? 'Activado' : 'Desactivado'})
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Correo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="smtp-server">
                Servidor SMTP
              </Label>
              <Input
                id="smtp-server"
                type="text"
                defaultValue="smtp.gmail.com"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="smtp-port">
                Puerto
              </Label>
              <Input
                id="smtp-port"
                type="number"
                defaultValue="587"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="smtp-user">
                Usuario
              </Label>
              <Input
                id="smtp-user"
                type="email"
                defaultValue="noreply@ebsalem.com"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="smtp-password">
                Contraseña
              </Label>
              <div className="relative mt-2">
                <Input
                  id="smtp-password"
                  type={showPassword ? "text" : "password"}
                  defaultValue="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plantillas de Correo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {emailTemplates.map((template) => (
              <div key={template.id} className="border border-border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-foreground">{template.name}</h4>
                  <button
                    onClick={() => setEditingTemplate(template)}
                    className="text-primary hover:text-primary/80"
                    aria-label={`Editar plantilla ${template.name}`}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mb-2">Asunto: {template.subject}</p>
                <div className="text-xs text-muted-foreground">
                  Variables disponibles: {template.variables.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAdminManagement = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Gestión de Administradores</CardTitle>
            <button
              onClick={handleAddAdmin}
              className="theme-button px-4 py-2 rounded-lg flex items-center"
            >
              <Users className="h-4 w-4 mr-2" />
              Invitar Administrador
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {admins.map((admin) => (
              <div key={admin.id} className="flex justify-between items-center p-3 border border-border rounded-lg">
                <div>
                  <div className="font-medium text-foreground">{admin.name}</div>
                  <div className="text-sm text-muted-foreground">{admin.email}</div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={cn(
                    "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                    admin.status === 'Activo' 
                      ? 'bg-success/10 text-success' 
                      : 'bg-destructive/10 text-destructive'
                  )}>
                    {admin.status}
                  </span>
                  <button
                    onClick={() => handleRemoveAdmin(admin.id)}
                    className="text-destructive hover:text-destructive/80"
                    disabled={admin.email === 'admin@ebsalem.com'}
                    aria-label={`Remover administrador ${admin.name}`}
                  >
                    <Shield className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Estado del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Base de Datos</span>
                <span className="text-sm text-success font-medium">Operativo</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Servidor Web</span>
                <span className="text-sm text-success font-medium">Operativo</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Almacenamiento S3</span>
                <span className="text-sm text-success font-medium">Operativo</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Servicio de Correo</span>
                <span className="text-sm text-success font-medium">Operativo</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Último Backup</span>
                <span className="text-sm text-foreground">2025-01-15 02:00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Espacio Usado</span>
                <span className="text-sm text-foreground">2.3 GB / 10 GB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Versión del Sistema</span>
                <span className="text-sm text-foreground">v1.2.3</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mantenimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <button className="bg-warning text-warning-foreground px-4 py-2 rounded-lg hover:bg-warning/90 transition-colors">
              Ejecutar Backup Manual
            </button>
            <button className="theme-button px-4 py-2 rounded-lg">
              Limpiar Cache
            </button>
            <button className="bg-muted text-muted-foreground px-4 py-2 rounded-lg hover:bg-muted/80 transition-colors">
              Ver Logs del Sistema
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header específico de la página */}
      <div className="bg-card border-b border-border px-8 py-4 animate-fade-in -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
            <p className="text-sm text-muted-foreground">Administra la configuración general de la plataforma</p>
          </div>
          <button
            onClick={handleSaveSettings}
            className="theme-button px-4 py-2 rounded-lg flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar Cambios
          </button>
        </div>
      </div>

      <div className="space-y-8">
          {/* Navigation Tabs */}
          <div className="mb-8">
            <div className="flex space-x-1 bg-muted p-1 rounded-lg">
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
                        ? 'bg-card text-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
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

          {/* Email Template Editor Dialog */}
          <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Plantilla: {editingTemplate?.name}</DialogTitle>
                <DialogDescription>
                  Edita el asunto y contenido de la plantilla de correo
                </DialogDescription>
              </DialogHeader>
              {editingTemplate && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="template-subject">Asunto</Label>
                    <Input
                      id="template-subject"
                      type="text"
                      value={editingTemplate.subject}
                      onChange={(e) => setEditingTemplate({...editingTemplate, subject: e.target.value})}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-content">Contenido</Label>
                    <Textarea
                      id="template-content"
                      value={editingTemplate.content}
                      onChange={(e) => setEditingTemplate({...editingTemplate, content: e.target.value})}
                      rows={8}
                      className="mt-2"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Variables disponibles: {editingTemplate.variables.join(', ')}
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setEditingTemplate(null)}
                      className="px-4 py-2 text-muted-foreground hover:text-foreground"
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
              )}
            </DialogContent>
          </Dialog>
      </div>
    </div>
  );
};
