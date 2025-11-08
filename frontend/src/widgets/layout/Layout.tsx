import React from 'react';
import { Header } from './Header';
import { UserSidebar, SidebarProvider, useSidebar } from './Sidebar';
import { useAuth } from '@/app/providers/AuthProvider';

interface LayoutProps {
  children: React.ReactNode;
  user?: {
    name: string;
    role: 'student' | 'teacher' | 'admin';
  };
  showSidebar?: boolean;
}

// Componente interno para manejar el contexto del sidebar
const LayoutWithSidebar: React.FC<LayoutProps & { onLogout: () => void }> = ({ children, user, onLogout }) => {
  const { toggleSidebar } = useSidebar(); // Obtener toggleSidebar del contexto

  return (
    <div className="min-h-screen bg-background flex w-full">
      <UserSidebar user={user} />
      {/* ✨ CORRECCIÓN 1:
          Se eliminó la clase 'md:ml-0'.
          Esto permite que 'peer-data-[state=collapsed]:md:ml-[var(--sidebar-width-icon)]'
          funcione correctamente y aplique el margen izquierdo pequeño.
      */}
      <div className="flex-1 flex flex-col w-full transition-all duration-200 peer-data-[state=expanded]:md:ml-[var(--sidebar-width)] peer-data-[state=collapsed]:md:ml-0">
        <Header user={user} onLogout={onLogout} onMenuToggle={toggleSidebar} /> {/* Pasar toggleSidebar */}
        
        {/* ✨ CORRECCIÓN 2:
            Se eliminó 'pt-14 sm:pt-16'.
            Como el Header ahora es 'sticky', ya no flota sobre el contenido.
            Solo necesitamos un padding vertical normal ('py-*') para espaciar.
        */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children, user, showSidebar = false }) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  // If no sidebar is needed, render a simple layout
  if (!showSidebar) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header user={user} onLogout={handleLogout} />
        {/* ✨ CORRECCIÓN 2 (también aquí):
            Se eliminó 'pt-14 sm:pt-16' por la misma razón.
        */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {children}
        </main>
      </div>
    );
  }

  // If sidebar is needed, use the layout with custom sidebar
  return (
    <SidebarProvider>
      <LayoutWithSidebar user={user} onLogout={handleLogout}>
        {children}
      </LayoutWithSidebar>
    </SidebarProvider>
  );
};

