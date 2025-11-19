import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import type { Pregunta, PreguntaConfig, Opcion } from '@/entities/question/model/types';

export interface PreguntaCompleta extends Pregunta {
  config?: PreguntaConfig;
  opciones?: Opcion[];
}

export interface QuizQuestionCardProps {
  pregunta: PreguntaCompleta;
  respuesta?: {
    respuesta_texto?: string | null;
    opcion_id?: string | null;
    respuesta_bool?: boolean | null;
  };
  onChange: (respuesta: {
    respuesta_texto?: string | null;
    opcion_id?: string | null;
    respuesta_bool?: boolean | null;
  }) => void;
  showCorrectAnswer?: boolean;
  isCorrect?: boolean;
  className?: string;
}

export const QuizQuestionCard: React.FC<QuizQuestionCardProps> = ({
  pregunta,
  respuesta,
  onChange,
  showCorrectAnswer = false,
  isCorrect,
  className
}) => {
  const config = pregunta.config;
  const opciones = pregunta.opciones || [];

  const opcionesOrdenadas = React.useMemo(() => {
    return [...opciones].sort((a, b) => {
      const ordenA = a.orden ?? 999;
      const ordenB = b.orden ?? 999;
      return ordenA - ordenB;
    });
  }, [opciones]);

  const renderPregunta = () => {
    if (!config) {
      return (
        <p className="text-muted-foreground">Configuración de pregunta no disponible</p>
      );
    }

    switch (config.tipo) {
      case 'ABIERTA':
        return (
          <div className="space-y-2">
            <Textarea
              value={respuesta?.respuesta_texto || ''}
              onChange={(e) => onChange({ respuesta_texto: e.target.value })}
              placeholder="Escribe tu respuesta aquí..."
              className="min-h-[120px]"
              disabled={showCorrectAnswer}
            />
            {showCorrectAnswer && config.abierta_modelo_respuesta && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Respuesta modelo:</p>
                <p className="text-sm text-muted-foreground">{config.abierta_modelo_respuesta}</p>
              </div>
            )}
          </div>
        );

      case 'OPCION_MULTIPLE':
        if (config.om_seleccion_multiple) {
          return (
            <div className="space-y-3">
              {opcionesOrdenadas.map((opcion) => {
                const isSelected = respuesta?.opcion_id === opcion.id;
                return (
                  <div key={opcion.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={`opcion-${opcion.id}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onChange({ opcion_id: opcion.id });
                        } else {
                          onChange({ opcion_id: null });
                        }
                      }}
                      disabled={showCorrectAnswer}
                    />
                    <Label
                      htmlFor={`opcion-${opcion.id}`}
                      className={cn(
                        'flex-1 cursor-pointer',
                        showCorrectAnswer && opcion.es_correcta && 'text-green-600 dark:text-green-400',
                        showCorrectAnswer && !opcion.es_correcta && isSelected && 'text-red-600 dark:text-red-400'
                      )}
                    >
                      {opcion.texto}
                      {showCorrectAnswer && opcion.es_correcta && (
                        <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-700 dark:text-green-400">
                          Correcta
                        </Badge>
                      )}
                    </Label>
                  </div>
                );
              })}
            </div>
          );
        } else {
          return (
            <RadioGroup
              value={respuesta?.opcion_id || undefined}
              onValueChange={(value) => onChange({ opcion_id: value })}
              disabled={showCorrectAnswer}
            >
              {opcionesOrdenadas.map((opcion) => (
                <div key={opcion.id} className="flex items-start space-x-3">
                  <RadioGroupItem value={opcion.id} id={`opcion-${opcion.id}`} />
                  <Label
                    htmlFor={`opcion-${opcion.id}`}
                    className={cn(
                      'flex-1 cursor-pointer',
                      showCorrectAnswer && opcion.es_correcta && 'text-green-600 dark:text-green-400',
                      showCorrectAnswer && !opcion.es_correcta && respuesta?.opcion_id === opcion.id && 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {opcion.texto}
                    {showCorrectAnswer && opcion.es_correcta && (
                      <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-700 dark:text-green-400">
                        Correcta
                      </Badge>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          );
        }

      case 'VERDADERO_FALSO':
        return (
          <RadioGroup
            value={respuesta?.respuesta_bool !== null ? String(respuesta.respuesta_bool) : undefined}
            onValueChange={(value) => onChange({ respuesta_bool: value === 'true' })}
            disabled={showCorrectAnswer}
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="true" id="vf-true" />
              <Label htmlFor="vf-true" className="cursor-pointer">Verdadero</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="false" id="vf-false" />
              <Label htmlFor="vf-false" className="cursor-pointer">Falso</Label>
            </div>
            {showCorrectAnswer && config.vf_respuesta_correcta !== null && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Respuesta correcta: {config.vf_respuesta_correcta ? 'Verdadero' : 'Falso'}
                </p>
              </div>
            )}
          </RadioGroup>
        );

      default:
        return <p className="text-muted-foreground">Tipo de pregunta no soportado</p>;
    }
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{pregunta.enunciado}</CardTitle>
          {pregunta.puntos && (
            <Badge variant="outline">{pregunta.puntos} puntos</Badge>
          )}
        </div>
        {config && (
          <Badge variant="secondary" className="mt-2">
            {config.tipo.replace('_', ' ')}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {renderPregunta()}
        {showCorrectAnswer && isCorrect !== undefined && (
          <div className={cn(
            'mt-4 p-3 rounded-lg',
            isCorrect ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-red-500/10 text-red-700 dark:text-red-400'
          )}>
            <p className="text-sm font-medium">
              {isCorrect ? '✓ Respuesta correcta' : '✗ Respuesta incorrecta'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

