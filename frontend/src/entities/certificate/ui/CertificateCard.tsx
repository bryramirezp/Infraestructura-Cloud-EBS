import { Certificado } from '../model/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { CertificateDocument } from './CertificateDocument';
import { Download, FileCheck } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CertificateCardProps {
  certificado: Certificado;
  courseName: string;
  studentName: string;
}

export const CertificateCard = ({ certificado, courseName, studentName }: CertificateCardProps) => {
  const formattedDate = format(new Date(certificado.emitido_en), "d 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <Card className="w-full max-w-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="p-2 bg-primary/10 rounded-full">
          <FileCheck className="w-8 h-8 text-primary" />
        </div>
        <div>
          <CardTitle className="text-lg">{courseName}</CardTitle>
          <CardDescription>Completado el {formattedDate}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          <p>Folio: <span className="font-mono text-xs">{certificado.folio || 'Pendiente'}</span></p>
          <p className="mt-1">Estado: <span className={certificado.valido ? "text-green-600 font-medium" : "text-red-600"}>
            {certificado.valido ? 'Válido' : 'Revocado'}
          </span></p>
        </div>
      </CardContent>
      <CardFooter>
        {certificado.valido && (
          <PDFDownloadLink
            document={
              <CertificateDocument
                studentName={studentName}
                courseName={courseName}
                completionDate={certificado.emitido_en}
                folio={certificado.folio || ''}
              />
            }
            fileName={`certificado-${courseName.replace(/\s+/g, '-').toLowerCase()}.pdf`}
            className="w-full"
          >
            {({ blob, url, loading, error }) => (
              <Button className="w-full gap-2" disabled={loading}>
                <Download className="w-4 h-4" />
                {loading ? 'Generando PDF...' : 'Descargar Certificado'}
              </Button>
            )}
          </PDFDownloadLink>
        )}
      </CardFooter>
    </Card>
  );
};
