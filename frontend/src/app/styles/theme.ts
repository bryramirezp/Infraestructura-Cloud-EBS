import { useState, useEffect } from 'react';

/**
 * Tipo de tema disponible
 * - 'light': Tema claro
 * - 'dark': Tema oscuro
 * - 'system': Sigue las preferencias del sistema
 */
export type Theme = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'ebsalem-theme';

/**
 * Obtiene el tema inicial desde localStorage o preferencias del sistema
 */
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  
  // Intentar obtener el tema guardado
  const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
  if (saved && ['light', 'dark', 'system'].includes(saved)) {
    return saved;
  }
  
  // Por defecto, usar 'system' para seguir preferencias del sistema
  return 'system';
};

/**
 * Obtiene el tema efectivo (light o dark) basado en el tema actual
 */
const getEffectiveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return theme;
};

/**
 * Aplica el tema al DOM agregando o quitando la clase 'dark'
 */
const applyThemeToDOM = (theme: Theme): void => {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  const effectiveTheme = getEffectiveTheme(theme);
  
  // Remover clase dark si existe
  root.classList.remove('dark');
  
  // Agregar clase dark si el tema efectivo es dark
  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
  }
};

/**
 * Hook para gestionar el tema de la aplicación
 * 
 * @returns {Object} Objeto con el tema actual, funciones para cambiar el tema, y estado
 * 
 * @example
 * ```tsx
 * const { theme, setTheme, toggleTheme, isDark } = useTheme();
 * 
 * // Cambiar a tema oscuro
 * setTheme('dark');
 * 
 * // Alternar entre light y dark
 * toggleTheme();
 * 
 * // Verificar si está en modo oscuro
 * if (isDark) {
 *   // ...
 * }
 * ```
 */
export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [mounted, setMounted] = useState(false);

  // Aplicar tema al montar y cuando cambie
  useEffect(() => {
    setMounted(true);
    applyThemeToDOM(theme);
  }, [theme]);

  // Escuchar cambios en las preferencias del sistema cuando el tema es 'system'
  useEffect(() => {
    if (!mounted) return;
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      applyThemeToDOM('system');
    };
    
    // Aplicar tema inicial basado en preferencias del sistema
    handleChange();
    
    // Escuchar cambios en las preferencias
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme, mounted]);

  /**
   * Establece un nuevo tema
   */
  const setThemeMode = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyThemeToDOM(newTheme);
  };

  /**
   * Alterna entre tema claro y oscuro (no incluye 'system')
   */
  const toggleTheme = () => {
    const currentEffective = getEffectiveTheme(theme);
    const newTheme: Theme = currentEffective === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
  };

  // Obtener el tema efectivo (light o dark, nunca 'system')
  const effectiveTheme = getEffectiveTheme(theme);

  return {
    /** Tema actual ('light', 'dark', o 'system') */
    theme,
    /** Tema efectivo ('light' o 'dark') */
    effectiveTheme,
    /** Función para establecer un tema específico */
    setTheme: setThemeMode,
    /** Función para alternar entre light y dark */
    toggleTheme,
    /** Indica si el tema efectivo es oscuro */
    isDark: effectiveTheme === 'dark',
    /** Indica si el componente está montado (útil para evitar hydration mismatch) */
    mounted,
  };
};

/**
 * Inicializa el tema al cargar la aplicación
 * Debe llamarse en el punto de entrada de la app (main.tsx)
 */
export const initTheme = (): void => {
  const theme = getInitialTheme();
  applyThemeToDOM(theme);
};

