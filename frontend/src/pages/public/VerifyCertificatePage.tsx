import React, { useState } from 'react';
import { useVerificarCertificado } from '@/entities/certificate/api/use-certificate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';

export const VerifyCertificatePage: React.FC = () => {
  const [hash, setHash] = useState('');
  const [certificadoId, setCertificadoId] = useState('');
  const [hashToVerify, setHashToVerify] = useState<string | null>(null);
  const [certificadoIdToVerify, setCertificadoIdToVerify] = useState<string | null>(null);
  const { data: certificado, isLoading, error } = useVerificarCertificado(certificadoIdToVerify, hashToVerify);

  const handleVerify = () => {
    if (hash.trim() && certificadoId.trim()) {
      setHashToVerify(hash.trim());
      setCertificadoIdToVerify(certificadoId.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Verificar Certificado</CardTitle>
          <CardDescription>
            Ingresa el hash de verificación del certificado para validar su autenticidad
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="certificadoId">ID del Certificado</Label>
              <Input
                id="certificadoId"
                value={certificadoId}
                onChange={(e) => setCertificadoId(e.target.value)}
                placeholder="Ingresa el ID del certificado"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hash">Hash de Verificación</Label>
              <div className="flex gap-2">
                <Input
                  id="hash"
                  value={hash}
                  onChange={(e) => setHash(e.target.value)}
                  placeholder="Ingresa el hash del certificado"
                  className="flex-1"
                />
                <Button onClick={handleVerify} disabled={!hash.trim() || !certificadoId.trim() || isLoading}>
                  <Search className="h-4 w-4 mr-2" />
                  Verificar
                </Button>
              </div>
            </div>
          </div>

          {hashToVerify && (
            <>
              {isLoading && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Verificando certificado...</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    El certificado no es válido o no existe.
                  </AlertDescription>
                </Alert>
              )}

              {certificado && (
                <Alert className="bg-green-500/10 border-green-500/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="space-y-4">
                    <div>
                      <p className="font-semibold text-green-700 dark:text-green-400 mb-2">
                        Certificado Válido
                      </p>
                      <div className="space-y-2 text-sm">
                        {certificado.folio && (
                          <div>
                            <span className="font-medium">Folio:</span> {certificado.folio}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Emitido el:</span>{' '}
                          {new Date(certificado.emitido_en).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div>
                          <Badge variant={certificado.valido ? 'default' : 'secondary'}>
                            {certificado.valido ? 'Válido' : 'Inválido'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

