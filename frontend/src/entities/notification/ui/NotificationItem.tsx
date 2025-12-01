import { Notificacion } from '../model/types';
import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Bell, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';

interface NotificationItemProps {
  notificacion: Notificacion;
  onMarkAsRead?: (id: string) => void;
}

const iconMap = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

const colorMap = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
};

export const NotificationItem = ({ notificacion, onMarkAsRead }: NotificationItemProps) => {
  const Icon = iconMap[notificacion.tipo];
  const formattedDate = format(new Date(notificacion.creado_en), "d MMM, HH:mm", { locale: es });

  const handleClick = () => {
    if (!notificacion.leida && onMarkAsRead) {
      onMarkAsRead(notificacion.id);
    }
    if (notificacion.link) {
      window.location.href = notificacion.link;
    }
  };

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200",
        !notificacion.leida && "border-l-4 border-l-primary bg-primary/5"
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("mt-1", colorMap[notificacion.tipo])}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h4 className="font-semibold text-sm truncate">{notificacion.titulo}</h4>
              {!notificacion.leida && (
                <Badge variant="default" className="shrink-0 h-5 px-2 text-xs">
                  Nueva
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{notificacion.mensaje}</p>
            <p className="text-xs text-muted-foreground mt-2">{formattedDate}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
