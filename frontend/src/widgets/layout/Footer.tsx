import React from 'react';
import { BookOpen, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/app/styles/theme';
import logoLight from '@/assets/images/Logo Modo Claro.png';
import logoDark from '@/assets/images/Logo Modo Oscuro.png';

export const Footer: React.FC = () => {
  const { isDark, mounted } = useTheme();
  const logo = mounted ? (isDark ? logoDark : logoLight) : logoLight;

  return (
    <footer className="bg-muted border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <img 
                src={logo} 
                alt="Escuela Bíblica Salem" 
                className="h-8 w-8 object-contain transition-opacity duration-200" 
              />
              <span className="ml-2 text-xl font-bold text-foreground">Escuela Bíblica Salem</span>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md">
              Preparando ministros piadosos para trabajar con más eficacia en el ministerio de la Iglesia.
            </p>
            <div className="flex space-x-4">
              <div className="flex items-center text-muted-foreground">
                <Mail className="h-4 w-4 mr-2" />
                <span className="text-sm">salemescuelabiblica@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li><Link to="/courses" className="text-muted-foreground hover:text-foreground transition-colors">Cursos</Link></li>
              <li><Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">Acerca de</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contacto</Link></li>
              <li><Link to="/help" className="text-muted-foreground hover:text-foreground transition-colors">Ayuda</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground">Soporte</h3>
            <ul className="space-y-2">
              <li><Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">Preguntas Frecuentes</Link></li>
              <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacidad</Link></li>
              <li><Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Términos</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground">&copy; 2025 Escuela Bíblica Salem. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};