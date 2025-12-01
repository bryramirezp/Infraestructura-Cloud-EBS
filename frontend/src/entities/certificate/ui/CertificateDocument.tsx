import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Registrar fuentes (opcional, usar fuentes estándar por ahora)
// Font.register({ family: 'Inter', src: '...' });

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  border: {
    border: '5px solid #1e293b', // Slate-800
    width: '100%',
    height: '100%',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    fontSize: 36,
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 10,
    color: '#64748b', // Slate-500
  },
  recipient: {
    fontSize: 30,
    marginBottom: 10,
    fontWeight: 'bold',
    color: '#0f172a', // Slate-900
    textDecoration: 'underline',
  },
  courseText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#475569', // Slate-600
  },
  courseName: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#2563eb', // Blue-600
  },
  date: {
    fontSize: 14,
    marginTop: 30,
    color: '#94a3b8', // Slate-400
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    fontSize: 10,
    color: '#cbd5e1', // Slate-300
    textAlign: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    backgroundColor: '#f1f5f9', // Slate-100 placeholder
    borderRadius: 50,
  },
});

interface CertificateDocumentProps {
  studentName: string;
  courseName: string;
  completionDate: string;
  folio: string;
}

export const CertificateDocument = ({ studentName, courseName, completionDate, folio }: CertificateDocumentProps) => {
  const formattedDate = format(new Date(completionDate), "d 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border}>
          {/* Placeholder logo */}
          <View style={styles.logo} />
          
          <Text style={styles.header}>Certificado de Finalización</Text>
          
          <Text style={styles.subtitle}>Este certificado se otorga a:</Text>
          
          <Text style={styles.recipient}>{studentName}</Text>
          
          <Text style={styles.courseText}>Por haber completado satisfactoriamente el curso:</Text>
          
          <Text style={styles.courseName}>{courseName}</Text>
          
          <Text style={styles.date}>Fecha de emisión: {formattedDate}</Text>
          
          <View style={styles.footer}>
            <Text>Folio: {folio}</Text>
            <Text>Verificable en: https://plataforma.ebs.com/verify/{folio}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
