import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModulos } from '@/entities/module/api/use-module';
import { ModuloCard } from '@/widgets/module';
import { Skeleton } from '@/shared/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { Modulo } from '@/entities/module/model/types';

type FiltroFecha = 'todos' | 'activos' | 'proximos' | 'finalizados';

const getModuloEstado = (fechaInicio: string, fechaFin: string): 'activo' | 'proximo' | 'finalizado' => {
  const hoy = new Date();
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  
  if (hoy < inicio) return 'proximo';
  if (hoy > fin) return 'finalizado';
  return 'activo';
};

const filtrarModulos = (modulos: Modulo[], filtro: FiltroFecha): Modulo[] => {
  if (filtro === 'todos') return modulos;
  
  return modulos.filter(modulo => {
    const estado = getModuloEstado(modulo.fecha_inicio, modulo.fecha_fin);
    return estado === filtro.slice(0, -1); // Remove 's' from 'activos', 'proximos', 'finalizados'
  });
};

export const ModulosPage: React.FC = () => {
  const navigate = useNavigate();
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>('todos');
  
  const { data: modulos, isLoading, error } = useModulos({ publicado: true });

  const modulosFiltrados = useMemo(() => {
    if (!modulos) return [];
    return filtrarModulos(modulos, filtroFecha);
  }, [modulos, filtroFecha]);

  const handleViewModulo = (moduloId: string) => {
    navigate(`/modulos/${moduloId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 md:space-y-8">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl p-6 md:p-8 shadow-soft">
          <Skeleton className="h-8 w-64 mb-2 bg-primary-400/20" />
          <Skeleton className="h-4 w-96 bg-primary-400/20" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 md:space-y-8">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl p-6 md:p-8 shadow-soft">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Módulos</h1>
          <p className="text-primary-100 text-sm md:text-base">Explora los módulos disponibles</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar los módulos. Por favor, intenta nuevamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl p-6 md:p-8 shadow-soft">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Módulos</h1>
        <p className="text-primary-100 text-sm md:text-base">Explora los módulos disponibles</p>
      </div>

      <Tabs value={filtroFecha} onValueChange={(value) => setFiltroFecha(value as FiltroFecha)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="activos">Activos</TabsTrigger>
          <TabsTrigger value="proximos">Próximos</TabsTrigger>
          <TabsTrigger value="finalizados">Finalizados</TabsTrigger>
        </TabsList>

        <TabsContent value={filtroFecha} className="mt-6">
          {modulosFiltrados.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No hay módulos disponibles en esta categoría.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modulosFiltrados.map((modulo) => (
                <ModuloCard
                  key={modulo.id}
                  modulo={modulo}
                  onView={handleViewModulo}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

