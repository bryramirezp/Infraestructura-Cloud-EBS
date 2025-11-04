import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BookOpen, Award, Clock, TrendingUp } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const courses = [
    { id: 1, title: 'Introducción a la Biblia', instructor: 'Pastor Juan', progress: 75, color: 'bg-primary' },
    { id: 2, title: 'Estudio del Nuevo Testamento', instructor: 'Pastora María', progress: 50, color: 'bg-success' },
    { id: 3, title: 'Vida de Jesús', instructor: 'Pastor Carlos', progress: 90, color: 'bg-primary/80' },
    { id: 4, title: 'Salmo 23', instructor: 'Pastora Ana', progress: 30, color: 'bg-warning' },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Hero Section con mejor jerarquía */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl p-6 md:p-8 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              ¡Bienvenido{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
            </h1>
            <p className="text-primary-100 text-sm md:text-base">Aquí está tu resumen bíblico</p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-primary-200 text-sm">Panel de</p>
            <p className="text-xl md:text-2xl font-bold capitalize">{user?.role || 'Estudiante'}</p>
          </div>
        </div>
      </div>

      {/* Mejor jerarquía visual: Estadísticas destacadas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos Bíblicos Activos</CardTitle>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            {/* <p className="text-xs text-muted-foreground">+2 desde el último mes</p> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Bíblico</CardTitle>
            <Award className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.5</div>
            {/* <p className="text-xs text-muted-foreground">Calificación (A-)</p> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas de Estudio Bíblico</CardTitle>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24h</div>
            {/* <p className="text-xs text-muted-foreground">Esta semana</p> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Bíblicas Pendientes</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            {/* <p className="text-xs text-muted-foreground">Para esta semana</p> */}
          </CardContent>
        </Card>
      </div>
      {/* --- FIN DE LA SECCIÓN DE ESTADÍSTICAS --- */}

      {/* Mejor jerarquía visual: Sección de cursos */}
      <div className="mt-8">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">Mis Cursos Bíblicos</h2>
        
        {/* Mejor jerarquía visual: Grid responsive con mejor espaciado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {courses.map((course) => (
            // Reemplazamos el 'div' principal por el componente 'Card'
            <Card key={course.id} className="hover:shadow-lg transition-shadow flex flex-col">
              
              {/* 'CardHeader' para el título y la pastilla de progreso */}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold leading-tight">
                    {course.title}
                  </CardTitle>
                  <span className={`flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full ${course.color} text-white`}>
                    {course.progress}%
                  </span>
                </div>
              </CardHeader>
              
              {/* 'CardContent' para el resto del contenido, usamos flex-grow para que ocupe el espacio */}
              <CardContent className="flex flex-col flex-grow justify-end">
                <p className="text-sm text-muted-foreground mb-4">{course.instructor}</p>
                
                {/* Mantenemos tu barra de progreso personalizada para conservar los colores */}
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${course.color}`}
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </CardContent>

            </Card>
          ))}
        </div>
        {/* --- FIN DE LA SECCIÓN DE CURSOS --- */}

      </div>
    </div>
  );
};

export default Dashboard;