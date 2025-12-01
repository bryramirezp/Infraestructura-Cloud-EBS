import { useAuth } from '@/app/providers/AuthProvider';
import { useCertificadosByUsuario } from '@/entities/certificate/api/use-certificate';
import { CertificateCard } from '@/entities/certificate/ui/CertificateCard';
import { Loader2 } from 'lucide-react';

export const CertificateList = () => {
  const { user } = useAuth();
  const { data: certificados, isLoading, error } = useCertificadosByUsuario(user?.id);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500">
        Error al cargar los certificados. Por favor intenta de nuevo.
      </div>
    );
  }

  if (!certificados || certificados.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No tienes certificados disponibles aún. ¡Completa tus cursos para obtenerlos!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {certificados.map((cert) => (
        <CertificateCard
          key={cert.id}
          certificado={cert}
          courseName={cert.curso_nombre || 'Curso EBS'} // Fallback si no viene del backend
          studentName={user?.nombre || user?.name || user?.email || 'Estudiante'}
        />
      ))}
    </div>
  );
};
