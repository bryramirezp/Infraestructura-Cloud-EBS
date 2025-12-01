import React from 'react';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { FileText, Video, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { LeccionContenido, TipoContenido } from '@/entities/lesson/model/types';

export interface LessonContentViewProps {
  contenido: LeccionContenido;
  onComplete?: () => void;
  className?: string;
}

const renderContenido = (contenido: LeccionContenido) => {
  switch (contenido.tipo) {
    case 'TEXTO':
      return (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {contenido.descripcion && (
            <div
              dangerouslySetInnerHTML={{ __html: contenido.descripcion }}
              className="text-foreground"
            />
          )}
        </div>
      );

    case 'PDF':
      return (
        <div className="space-y-4">
          {contenido.titulo && (
            <h3 className="text-lg font-semibold">{contenido.titulo}</h3>
          )}
          {contenido.descripcion && (
            <p className="text-muted-foreground">{contenido.descripcion}</p>
          )}
          {contenido.url ? (
            <div className="border rounded-lg overflow-hidden">
              <iframe
                src={contenido.url}
                className="w-full h-[600px]"
                title={contenido.titulo || 'PDF Viewer'}
              />
            </div>
          ) : (
            <p className="text-muted-foreground">URL del PDF no disponible</p>
          )}
        </div>
      );

    case 'VIDEO':
      return (
        <div className="space-y-4">
          {contenido.titulo && (
            <h3 className="text-lg font-semibold">{contenido.titulo}</h3>
          )}
          {contenido.descripcion && (
            <p className="text-muted-foreground">{contenido.descripcion}</p>
          )}
          {contenido.url ? (
            <div className="aspect-video border rounded-lg overflow-hidden">
              <iframe
                src={contenido.url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={contenido.titulo || 'Video Player'}
              />
            </div>
          ) : (
            <p className="text-muted-foreground">URL del video no disponible</p>
          )}
        </div>
      );

    case 'LINK':
      return (
        <div className="space-y-4">
          {contenido.titulo && (
            <h3 className="text-lg font-semibold">{contenido.titulo}</h3>
          )}
          {contenido.descripcion && (
            <p className="text-muted-foreground">{contenido.descripcion}</p>
          )}
          {contenido.url ? (
            <Button
              onClick={() => window.open(contenido.url!, '_blank')}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir enlace
            </Button>
          ) : (
            <p className="text-muted-foreground">URL no disponible</p>
          )}
        </div>
      );

    default:
      return (
        <p className="text-muted-foreground">Tipo de contenido no soportado</p>
      );
  }
};

const getIcon = (tipo: TipoContenido) => {
  switch (tipo) {
    case 'TEXTO':
      return <FileText className="h-5 w-5" />;
    case 'PDF':
      return <FileText className="h-5 w-5" />;
    case 'VIDEO':
      return <Video className="h-5 w-5" />;
    case 'LINK':
      return <LinkIcon className="h-5 w-5" />;
    default:
      return null;
  }
};

export const LessonContentView: React.FC<LessonContentViewProps> = ({
  contenido,
  onComplete,
  className
}) => {
  return (
    <Card className={cn('', className)}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          {getIcon(contenido.tipo)}
          <span className="text-sm font-medium text-muted-foreground uppercase">
            {contenido.tipo}
          </span>
        </div>
        {renderContenido(contenido)}
        {onComplete && (
          <div className="mt-6">
            <Button onClick={onComplete}>
              Marcar como completado
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

