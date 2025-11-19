import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForoByLeccion, useForoByCurso, useCrearForoComentario, useEliminarForoComentario } from '@/entities/forum/api/use-forum';
import { useAuth } from '@/app/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Skeleton } from '@/shared/ui/skeleton';
import { Alert, AlertDescription } from '@/shared/ui/Alert';
import { AlertCircle, MessageSquare, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const comentarioSchema = z.object({
  contenido: z.string().min(1, 'El comentario no puede estar vacío'),
});

type ComentarioFormData = z.infer<typeof comentarioSchema>;

export const ForumPage: React.FC = () => {
  const params = useParams<{ leccionId?: string; cursoId?: string }>();
  const leccionId = params.leccionId;
  const cursoId = params.cursoId;
  const { user } = useAuth();
  
  const { data: comentariosLeccion } = useForoByLeccion(leccionId);
  const { data: comentariosCurso } = useForoByCurso(cursoId);
  const crearMutation = useCrearForoComentario();
  const eliminarMutation = useEliminarForoComentario();

  const comentarios = leccionId ? comentariosLeccion : comentariosCurso;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ComentarioFormData>({
    resolver: zodResolver(comentarioSchema),
  });

  const onSubmit = async (data: ComentarioFormData) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión para comentar');
      return;
    }

    try {
      await crearMutation.mutateAsync({
        usuario_id: user.id,
        curso_id: cursoId || '',
        leccion_id: leccionId || '',
        contenido: data.contenido,
      });
      reset();
      toast.success('Comentario publicado exitosamente');
    } catch (error: any) {
      toast.error(error?.message || 'Error al publicar el comentario');
    }
  };

  const handleEliminar = async (comentarioId: string) => {
    if (!confirm('¿Estás seguro de eliminar este comentario?')) return;

    try {
      await eliminarMutation.mutateAsync(comentarioId);
      toast.success('Comentario eliminado exitosamente');
    } catch (error: any) {
      toast.error(error?.message || 'Error al eliminar el comentario');
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl p-6 md:p-8 shadow-soft">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Foro de Discusión</h1>
        <p className="text-primary-100 text-sm md:text-base">Comparte tus ideas y preguntas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Nuevo Comentario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Textarea
                {...register('contenido')}
                placeholder="Escribe tu comentario aquí..."
                className="min-h-[120px]"
              />
              {errors.contenido && (
                <p className="text-sm text-red-600 mt-1">{errors.contenido.message}</p>
              )}
            </div>
            <Button type="submit" disabled={crearMutation.isPending} className="gap-2">
              <Send className="h-4 w-4" />
              Publicar Comentario
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comentarios</CardTitle>
          <CardDescription>
            {comentarios?.length || 0} comentario(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!comentarios ? (
            <Skeleton className="h-32 w-full" />
          ) : comentarios.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No hay comentarios aún. Sé el primero en comentar.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {comentarios.map((comentario) => (
                <div key={comentario.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">Usuario {comentario.usuario_id}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(comentario.creado_en).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {user?.id === comentario.usuario_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEliminar(comentario.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-foreground whitespace-pre-wrap">{comentario.contenido}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

