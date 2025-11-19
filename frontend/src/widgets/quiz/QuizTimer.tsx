import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/shared/ui/card';
import { Clock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/shared/ui/Alert';
import { cn } from '@/shared/lib/utils';

export interface QuizTimerProps {
  tiempoLimiteMinutos: number;
  onTimeUp?: () => void;
  className?: string;
}

export const QuizTimer: React.FC<QuizTimerProps> = ({
  tiempoLimiteMinutos,
  onTimeUp,
  className
}) => {
  const [tiempoRestante, setTiempoRestante] = useState(tiempoLimiteMinutos * 60);

  useEffect(() => {
    if (tiempoRestante <= 0) {
      onTimeUp?.();
      return;
    }

    const interval = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tiempoRestante, onTimeUp]);

  const minutos = Math.floor(tiempoRestante / 60);
  const segundos = tiempoRestante % 60;
  const tiempoFormateado = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

  const isLowTime = tiempoRestante < 300; // Menos de 5 minutos

  if (tiempoRestante <= 0) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          El tiempo se ha agotado. El quiz se enviará automáticamente.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-center gap-2">
          <Clock className={cn('h-5 w-5', isLowTime && 'text-red-600 dark:text-red-400')} />
          <span className={cn(
            'text-2xl font-bold font-mono',
            isLowTime && 'text-red-600 dark:text-red-400'
          )}>
            {tiempoFormateado}
          </span>
        </div>
        {isLowTime && (
          <p className="text-sm text-red-600 dark:text-red-400 text-center mt-2">
            Tiempo restante bajo
          </p>
        )}
      </CardContent>
    </Card>
  );
};

