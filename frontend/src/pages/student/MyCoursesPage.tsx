import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInscripcionesByUsuario } from '@/entities/enrollment/api/use-enrollment';
import { useAuth } from '@/app/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Progress } from '@/shared/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Skeleton } from '@/shared/ui/skeleton';
import { Alert, AlertDescription } from '@/shared/ui/Alert';
import { AlertCircle, BookOpen, Award, ArrowRight } from 'lucide-react';
import type { EstadoInscripcion } from '@/entities/enrollment/model/types';

export const MyCoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filtroEstado, setFiltroEstado] = useState<EstadoInscripcion | 'todos'>('todos');
  
  const { data: inscripciones, isLoading, error } = useInscripcionesByUsuario(user?.id);

  const inscripcionesFiltradas = React.useMemo(() => {
    if (!inscripciones) return [];
    if (filtroEstado === 'todos') return inscripciones;
    return inscripciones.filter(ins => ins.estado === filtroEstado);
  }, [inscripciones, filtroEstado]);

  if (isLoading) {
    return (
      <div className="space-y-6 md:space-y-8">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 md:space-y-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar tus inscripciones. Por favor, intenta nuevamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl p-6 md:p-8 shadow-soft">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Mis Cursos</h1>
        <p className="text-primary-100 text-sm md:text-base">Gestiona y revisa el progreso de tus cursos</p>
      </div>

      <Tabs value={filtroEstado} onValueChange={(value) => setFiltroEstado(value as EstadoInscripcion | 'todos')}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="ACTIVA">Activas</TabsTrigger>
          <TabsTrigger value="PAUSADA">Pausadas</TabsTrigger>
          <TabsTrigger value="CONCLUIDA">Concluidas</TabsTrigger>
          <TabsTrigger value="REPROBADA">Reprobadas</TabsTrigger>
        </TabsList>

        <TabsContent value={filtroEstado} className="mt-6">
          {inscripcionesFiltradas.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No tienes inscripciones en esta categoría.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inscripcionesFiltradas.map((inscripcion) => (
                <Card key={inscripcion.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">Curso {inscripcion.curso_id}</CardTitle>
                      <Badge variant={
                        inscripcion.estado === 'ACTIVA' ? 'default' :
                        inscripcion.estado === 'CONCLUIDA' ? 'default' :
                        inscripcion.estado === 'REPROBADA' ? 'destructive' :
                        'secondary'
                      }>
                        {inscripcion.estado}
                      </Badge>
                    </div>
                    {inscripcion.acreditado && (
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <Award className="h-4 w-4" />
                        Acreditado
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progreso</span>
                          <span>0%</span>
                        </div>
                        <Progress value={0} />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/cursos/${inscripcion.curso_id}`)}
                          className="flex-1"
                        >
                          Ver Curso
                        </Button>
                        {inscripcion.acreditado && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/certificados')}
                          >
                            <Award className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

