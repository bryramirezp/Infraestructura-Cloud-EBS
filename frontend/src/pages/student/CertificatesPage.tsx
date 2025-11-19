import React from 'react';
import { useCertificadosByUsuario } from '@/entities/certificate/api/use-certificate';
import { useDescargarCertificado } from '@/entities/certificate/api/use-certificate';
import { useAuth } from '@/app/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { Alert, AlertDescription } from '@/shared/ui/Alert';
import { AlertCircle, Award, Download, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export const CertificatesPage: React.FC = () => {
  const { user } = useAuth();
  const { data: certificados, isLoading, error } = useCertificadosByUsuario(user?.id);
  const descargarMutation = useDescargarCertificado();

  const handleDescargar = async (certificadoId: string) => {
    try {
      const resultado = await descargarMutation.mutateAsync(certificadoId);
      if (resultado?.url) {
        window.open(resultado.url, '_blank');
      } else {
        toast.error('No se pudo obtener la URL de descarga');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Error al descargar el certificado');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 md:space-y-8">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
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
            Error al cargar los certificados. Por favor, intenta nuevamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl p-6 md:p-8 shadow-soft">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Mis Certificados</h1>
        <p className="text-primary-100 text-sm md:text-base">Certificados obtenidos por completar cursos</p>
      </div>

      {!certificados || certificados.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tienes certificados aún. Completa cursos para obtener certificados.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificados.map((certificado) => (
            <Card key={certificado.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-6 w-6 text-primary-600" />
                    <CardTitle>Certificado</CardTitle>
                  </div>
                  {certificado.valido ? (
                    <Badge variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Válido
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inválido</Badge>
                  )}
                </div>
                {certificado.folio && (
                  <CardDescription>Folio: {certificado.folio}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Emitido el</p>
                    <p className="font-medium">
                      {new Date(certificado.emitido_en).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  {certificado.hash_verificacion && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Hash de verificación</p>
                      <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                        {certificado.hash_verificacion}
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={() => handleDescargar(certificado.id)}
                    disabled={descargarMutation.isPending}
                    className="w-full gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Descargar Certificado
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

