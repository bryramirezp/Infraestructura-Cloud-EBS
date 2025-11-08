# Plataforma de Cursos Modalidad Online - EBS Online (Cloud Edition)

Una plataforma web moderna y escalable para la gestión de cursos en modalidad online, desarrollada con React y un backend 100% nativo en la nube de Amazon Web Services (AWS).

## 🚀 Características

- **Arquitectura Serverless**: Backend sin servidor para una escalabilidad automática y costos optimizados.
- **Autenticación Segura y Federada**: Gestión de usuarios con roles (estudiante, profesor, administrador) mediante Amazon Cognito.
- **API Robusta**: Lógica de negocio desacoplada y modular a través de AWS Lambda y Amazon API Gateway.
- **Base de Datos Relacional Gestionada**: Almacenamiento de datos seguro y escalable con Amazon RDS.
- **Despliegue Continuo (CI/CD)**: Proceso de despliegue automatizado con AWS Amplify, conectado a un repositorio Git.
- **Interfaz Responsive**: Diseño optimizado para dispositivos móviles y de escritorio con Tailwind CSS.
- **Entrega de Contenido Global**: Distribución de baja latencia del frontend y los recursos estáticos a través de Amazon S3 y Amazon CloudFront.

## 🛠️ Stack Tecnológico en la Nube (AWS)

### Frontend
- **React 18.3.1** - Biblioteca para la interfaz de usuario
- **TypeScript 5.5.3** - Tipado estático para un código más robusto
- **Vite 7.1.9** - Herramienta de construcción y servidor de desarrollo con React SWC plugin
- **Tailwind CSS 3.4.1** - Framework de CSS para diseño rápido y moderno con extensiones de tema personalizadas
- **Radix UI Primitives** - Componentes de UI accesibles y personalizables (accordion, dialog, dropdown, etc.)
- **Lucide React 0.344.0** - Biblioteca moderna de íconos SVG optimizados para React
- **React Hook Form 7.53.0** - Manejo de formularios con validación usando Zod
- **Zod 3.23.8** - Esquemas de validación para TypeScript
- **React Router DOM 6.30.1** - Enrutamiento del lado del cliente
- **TanStack React Query 5.83.0** - Gestión de estado y fetching de datos
- **Framer Motion 12.23.21** - Animaciones y transiciones avanzadas
- **GSAP 3.13.0** - Animaciones de alto rendimiento
- **Recharts 2.15.4** - Visualización de datos y gráficos
- **Sonner 1.7.4** - Notificaciones toast elegantes
- **date-fns 3.6.0** - Manipulación y formateo de fechas

### Backend (AWS Cloud Native)
- **AWS Amplify**: Orquestación de servicios y pipeline de CI/CD
- **Amazon Cognito**: Autenticación, gestión de usuarios y control de acceso por roles
- **Amazon S3 (Simple Storage Service)**: Alojamiento del frontend (hosting estático) y almacenamiento de recursos
- **Amazon CloudFront**: Red de entrega de contenidos (CDN) para un acceso rápido y global
- **Amazon API Gateway**: Creación y gestión de APIs RESTful
- **AWS Lambda**: Funciones serverless para ejecutar la lógica de negocio
- **Amazon RDS (Relational Database Service)**: Base de datos MySQL gestionada, escalable y segura
- **AWS IAM (Identity and Access Management)**: Gestión de permisos y roles seguros

## 🛠️ Stack Tecnológico Frontend Detallado

### Framework y Herramientas de Construcción
- **React 18.3.1**: Biblioteca principal para construir interfaces de usuario interactivas y reutilizables.
- **TypeScript 5.5.3**: Proporciona tipado estático para mayor robustez y detección de errores en tiempo de desarrollo.
- **Vite 7.1.9**: Herramienta de construcción rápida y eficiente con soporte para HMR (Hot Module Replacement). Utiliza el plugin React SWC para compilación optimizada.

### Estilos y Diseño
- **Tailwind CSS 3.4.1**: Framework de CSS utilitario para un diseño rápido, responsive y personalizable. Incluye extensiones de tema personalizadas para colores, fuentes y componentes.
- **PostCSS y Autoprefixer**: Procesamiento de CSS para compatibilidad con navegadores.

### Componentes de UI
- **Radix UI Primitives**: Conjunto de componentes de UI headless, accesibles y personalizables. Incluye:
  - Accordion: Para secciones colapsables.
  - Dialog: Modales y diálogos.
  - Dropdown Menu: Menús desplegables.
  - Alert Dialog: Diálogos de confirmación.
  - Popover: Elementos flotantes.
  - Select: Selectores personalizados.
  - Tabs: Pestañas para navegación.
- Estos componentes se integran con Tailwind CSS para un diseño consistente.

### Iconos
- **Lucide React 0.344.0**: Biblioteca moderna de íconos SVG optimizados para React, con más de 1000 iconos personalizables.

### Formularios y Validación
- **React Hook Form 7.53.0**: Manejo eficiente de formularios con hooks, minimizando re-renders.
- **Zod 3.23.8**: Esquemas de validación para TypeScript, integrados con React Hook Form para validación robusta y tipada.
- **@hookform/resolvers**: Resolvers para conectar Zod con React Hook Form.

### Enrutamiento
- **React Router DOM 6.30.1**: Enrutamiento del lado del cliente con soporte para rutas anidadas, lazy loading y protección de rutas.

### Gestión de Estado y Datos
- **TanStack React Query 5.83.0**: Librería para fetching, caching y sincronización de datos del servidor. Proporciona herramientas para mutaciones, queries y manejo de errores.

### Animaciones
- **Framer Motion 12.23.21**: Librería para animaciones declarativas en React, incluyendo transiciones, gestos y animaciones de página.
- **GSAP 3.13.0**: Motor de animaciones de alto rendimiento para efectos avanzados y complejos.

### Visualización de Datos
- **Recharts 2.15.4**: Librería para gráficos y visualizaciones de datos, compatible con React. Incluye gráficos de barras, líneas, pie, etc.

### Notificaciones
- **Sonner 1.7.4**: Sistema de notificaciones toast elegante y personalizable para feedback al usuario.

### Manejo de Fechas
- **date-fns 3.6.0**: Librería modular para manipulación, formateo y parsing de fechas, con soporte para múltiples locales.

## 🎨 Estándares de Diseño

Para mantener una estética consistente en toda la plataforma, basada en la página de aterrizaje (landing page), se definen los siguientes estándares de diseño. Todos los componentes y páginas deben adherirse a estos lineamientos para garantizar una experiencia de usuario coherente.

### Paleta de Colores

Utilizamos una paleta de colores basada en azules primarios, con tonos neutros y grises para el contenido.

- **Primarios** (Azules):
  - `primary-50`: #f0f0ff (Muy claro, para fondos sutiles)
  - `primary-100`: #e0e0ff (Claro, para elementos secundarios)
  - `primary-200`: #c1c1ff (Para texto destacado en fondos oscuros)
  - `primary-600`: #0404E4 (Principal, para botones y elementos destacados)
  - `primary-700`: #0303B3 (Oscuro, para gradientes)
  - `primary-800`: #020282 (Muy oscuro, para fondos hero)

- **Neutros y Grises**:
  - `gray-50`: #f9fafb (Fondo de secciones)
  - `gray-600`: #4b5563 (Texto secundario)
  - `gray-900`: #111827 (Texto principal y títulos)
  - `white`: #ffffff (Fondos y texto en elementos oscuros)

- **Especiales**:
  - `secondary`: #000000 (Negro para elementos específicos)
  - `neutral`: #cfd1d1 (Para elementos neutros)
  - `yellow-400`: #fbbf24 (Para estrellas y calificaciones)

### Tipografía

- **Fuente Principal**: Crimson Pro (serif) - Aplicada al body globalmente.
- **Jerarquía de Títulos**:
  - H1: `text-4xl md:text-6xl font-bold` (Hero principal)
  - H2: `text-3xl md:text-4xl font-bold` (Secciones principales)
  - H3: `text-xl font-semibold` (Subtítulos y tarjetas)
- **Texto del Cuerpo**:
  - Principal: `text-xl` (Descripciones en hero)
  - Secundario: `text-lg` (Estadísticas)
  - Base: `text-base` (Contenido general)
  - Pequeño: `text-sm` (Metadatos)
- **Pesos**: `font-bold` para títulos, `font-semibold` para énfasis, `font-normal` para texto regular.

### Layout y Espaciado

- **Contenedores**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` para secciones principales.
- **Espaciado Vertical**: `py-20` para secciones principales, `py-16` para headers.
- **Grids Responsivos**:
  - 1 columna en móvil, 2-4 en desktop según contenido.
  - Ej: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- **Fondos**: Gradientes para hero (`bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800`), `bg-white` para contenido, `bg-gray-50` para secciones alternas.

### Componentes Estándar

- **Botones Primarios**:
  - Estilos: `bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-primary-50 transition-all duration-300`
  - Hover: Cambia fondo a primary-50
  - Con iconos: Agregar `flex items-center group`, icono con `ml-2 h-5 w-5 group-hover:translate-x-1`

- **Botones Secundarios**:
  - Estilos: `border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-all duration-300`

- **Tarjetas (Cards)**:
  - Estilos: `bg-white p-6 rounded-xl shadow-sm border border-gray-200`
  - Hover: `hover:bg-primary-50 transition-all duration-300` para interactivas
  - Con iconos: Icono en `w-16 h-16 bg-primary-100 rounded-full` centrado

- **Secciones**:
  - Hero: Gradiente azul, texto centrado, botones en fila/columna responsive
  - Features: Grid de tarjetas con iconos
  - Estadísticas: Texto centrado con números grandes
  - Testimonios: Grid de tarjetas con estrellas
  - CTA: Gradiente azul a indigo, texto centrado

### Animaciones y Transiciones

- **Transiciones**: `transition-all duration-300` para hover states
- **Gradientes**: `bg-gradient-to-br` o `bg-gradient-to-r` para fondos dinámicos
- **Iconos**: Hover con `group-hover:translate-x-1` para movimiento sutil

### Responsive Design

- Breakpoints: `sm:`, `md:`, `lg:` siguiendo Tailwind
- Texto: Escala de `text-xl` a `text-6xl` según importancia
- Layout: Flex y grid adaptativos

Estos estándares deben aplicarse en todos los nuevos componentes y páginas para mantener la coherencia visual con la landing page.


## 🚀 Instalación y Configuración en la Nube

### Prerrequisitos
- Node.js (versión 16 o superior)
- npm o yarn
- Una cuenta de AWS
- AWS CLI instalado y configurado
- AWS Amplify CLI instalado:
  ```bash
  npm install -g @aws-amplify/cli
  ```

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd project
   ```

2. **Instalar dependencias del frontend**
   ```bash
   npm install
   ```

3. **Inicializar y Desplegar el Backend de Amplify**
   
   Configura Amplify en tu cuenta de AWS:
   ```bash
   amplify configure
   ```
   
   Inicializa Amplify en el proyecto:
   ```bash
   amplify init
   ```
   
   Despliega todos los recursos del backend:
   ```bash
   amplify push
   ```

4. **Ejecutar el frontend en modo desarrollo**
   ```bash
   npm run dev
   ```
   
   La aplicación se abrirá en `http://localhost:5173`

## 📜 Scripts Disponibles

```bash
# Desarrollo local del frontend
npm run dev

# Construir la aplicación para producción
npm run build

# Calidad de código
npm run lint

# Desplegar backend a AWS
amplify push

# Publicar frontend y backend a producción
amplify publish
```

## 🔐 Sistema de Autenticación con Amazon Cognito

El sistema de autenticación está completamente gestionado por Amazon Cognito.

### Roles de Usuario
- **Estudiante**: Acceso básico al dashboard y a los cursos
- **Profesor**: Acceso extendido para la gestión de cursos (en desarrollo)
- **Administrador**: Acceso completo al panel de administración

Los roles se pueden gestionar a través de los Grupos de Usuarios de Cognito, permitiendo un control de acceso granular a los recursos de la API.

## 🚧 Estado del Desarrollo

### ✅ Implementado
- Sistema de autenticación básico con Amazon Cognito
- Layout responsive con sidebar y rutas protegidas
- Dashboard diferenciado por roles (controlado por grupos de Cognito)
- Navegación dinámica
- Alojamiento del frontend en AWS S3/CloudFront a través de Amplify

### 🔄 En Desarrollo
- Integración completa con servicios de AWS:
  - Lógica de negocio con AWS Lambda (sistema de cursos, calendario, calificaciones)
  - Conexión a base de datos Amazon RDS
  - Almacenamiento de archivos de cursos en Amazon S3
  - Panel de administración completo

### 📋 Próximas Características
- Sistema de notificaciones con Amazon SNS
- Chat en tiempo real (posiblemente con AWS AppSync)
- Reportes y analíticas con Amazon QuickSight

## 🔧 Implementación del Stack Frontend

### ✅ Implementado
- Configuración base de React con TypeScript y Vite (con SWC plugin)
- Tailwind CSS con tema personalizado
- Lucide React para iconos
- React Router DOM para enrutamiento
- Framer Motion para animaciones básicas
- AWS Amplify para integración con backend

### 🔄 En Implementación
- **Radix UI Primitives**: Componentes como Dialog y AlertDialog integrados, refactorizando Modal y Alert para mayor accesibilidad.
- **React Hook Form + Zod**: Esquemas de validación creados, integración en formularios como UserForm en progreso.
- **TanStack React Query**: Configuración inicial, refactorización de API calls pendiente.
- **Recharts**: Preparado para reemplazar gráficos personalizados en AdminDashboard.
- **Sonner**: Integración para notificaciones en lugar de alert() en progreso.
- **date-fns**: Listo para manejo de fechas en componentes.
- **GSAP**: Configuración para animaciones avanzadas.

### 📋 Pendiente
- Refactorización completa de componentes para usar Radix UI.
- Integración total de React Hook Form en todos los formularios.
- Migración de API calls a TanStack React Query.
- Reemplazo de gráficos personalizados por Recharts.
- Implementación de Sonner en todo el proyecto.
- Uso de date-fns en funcionalidades de calendario y fechas.

## 🌐 Despliegue y CI/CD

El despliegue está automatizado con AWS Amplify Hosting.

### Proceso de Despliegue
1. Conecta tu repositorio de Git (GitHub, GitLab, etc.) a AWS Amplify en la consola de AWS
2. Configura las ramas que deseas desplegar (ej. `main` para producción, `develop` para staging)
3. Con cada `git push` a una rama configurada, Amplify automáticamente construirá el frontend y desplegará los cambios

Esto crea un pipeline de CI/CD robusto que asegura entregas rápidas y consistentes.

## 🤝 Contribución

1. Haz un Fork del proyecto
2. Crea una rama para tu nueva característica (`git checkout -b feature/AmazingFeature`)
3. Realiza tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Empuja tu rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🔗 Enlaces Útiles

- [Documentación de React](https://reactjs.org/)
- [Documentación de AWS Amplify](https://docs.amplify.aws/)
- [Documentación de Amazon Cognito](https://docs.aws.amazon.com/cognito/)
- [Documentación de AWS Lambda](https://docs.aws.amazon.com/lambda/)
- [Documentación de Amazon RDS](https://docs.aws.amazon.com/rds/)
- [Documentación de Tailwind CSS](https://tailwindcss.com/)

---

**Desarrollado con ❤️ para EBS Online**