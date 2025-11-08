import React from 'react';
import { Menu, User, LogOut, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SidebarTrigger } from './Sidebar';
import { useTheme } from '@/app/styles/theme';
import logoLight from '@/assets/images/Logo Modo Claro.png';
import logoDark from '@/assets/images/Logo Modo Oscuro.png';

interface HeaderProps {
  user?: {
    name: string;
    role: 'student' | 'teacher' | 'admin';
  };
  onMenuToggle?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onMenuToggle, onLogout }) => {
  const { isDark, toggleTheme, mounted } = useTheme();

  // Logo según el tema
  const logo = isDark ? logoDark : logoLight;

  // Evitar renderizado hasta que el tema esté montado (previene hydration mismatch)
  if (!mounted) {
    return (
      <header className="bg-background shadow-sm border-b border-border sticky top-0 z-30 w-full">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center min-w-0 flex-1">
              <Link to="/" className="flex items-center min-w-0">
                <img 
                  src={logoLight} 
                  alt="Escuela Bíblica Salem" 
                  className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0 object-contain" 
                />
                <span className="ml-2 text-lg sm:text-xl font-bold text-foreground truncate">EBS Online</span>
              </Link>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-background shadow-sm border-b border-border sticky top-0 z-30 w-full">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo responsive */}
          <div className="flex items-center min-w-0 flex-1">
            {/* ✨ CORRECCIÓN DE LÓGICA 1:
                Solo mostrar el botón de menú móvil si onMenuToggle existe.
            */}
            {onMenuToggle && (
              <button
                onClick={onMenuToggle}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors md:hidden mr-2"
                aria-label="Abrir menú"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <Link to="/" className="flex items-center min-w-0">
              <img 
                src={logo} 
                alt="Escuela Bíblica Salem" 
                className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0 object-contain transition-opacity duration-200" 
              />
              <span className="ml-2 text-lg sm:text-xl font-bold text-foreground truncate">EBS Online</span>
            </Link>
          </div>

          {/* Sidebar toggle y User menu responsive */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* ✨ CORRECCIÓN DE LÓGICA 2:
                Solo mostrar el SidebarTrigger si el usuario existe Y onMenuToggle existe.
                Esto evita que el botón intente renderizarse en páginas sin SidebarProvider (como Login).
            */}
            {user && onMenuToggle && (
              <SidebarTrigger className="hidden lg:inline-flex h-10 w-10 hover:bg-accent hover:text-accent-foreground" />
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center border rounded-full p-1 transition-colors border-border focus:outline-none hover:bg-accent"
              aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              title={isDark ? 'Tema oscuro activo - Click para cambiar a claro' : 'Tema claro activo - Click para cambiar a oscuro'}
            >
              <span className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${isDark ? 'text-muted-foreground' : 'text-yellow-500'}`}>
                <Sun className="w-5 h-5" />
              </span>
              <span className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${isDark ? 'text-blue-400' : 'text-muted-foreground'}`}>
                <Moon className="w-5 h-5" />
              </span>
            </button>


            {/* Separator */}
            {user && <div className="h-8 w-px bg-border" />}

            {user ? (
              <div className="flex items-center space-x-2">
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="bg-primary text-primary-foreground px-3 sm:px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
                >
                  Iniciar Sesión
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
