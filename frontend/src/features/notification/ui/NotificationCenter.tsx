import { useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { NotificationItem } from '@/entities/notification/ui/NotificationItem';
import { Button } from '@/shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Bell, CheckCheck } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';

// Mock hook - replace with actual implementation when backend is ready
const useNotifications = (usuarioId: string | undefined) => {
  return {
    data: [] as any[],
    isLoading: false,
    refetch: () => {},
  };
};

const useMarkAsRead = () => {
  return {
    mutate: (id: string) => {
      console.log('Marking notification as read:', id);
    },
  };
};

const useMarkAllAsRead = () => {
  return {
    mutate: () => {
      console.log('Marking all notifications as read');
    },
  };
};

export const NotificationCenter = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { data: notificaciones, isLoading, refetch } = useNotifications(user?.id);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount = notificaciones?.filter((n) => !n.leida).length || 0;

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
    refetch();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
    refetch();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-8 gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Marcar todas
            </Button>
          )}
        </div>
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando...</div>
          ) : notificaciones && notificaciones.length > 0 ? (
            <div className="p-2 space-y-2">
              {notificaciones.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notificacion={notif}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No tienes notificaciones
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
