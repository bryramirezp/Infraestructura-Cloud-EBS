/**
 * Entidad: Certificado
 * Certificados de cursos y módulos completados
 */

export type CertificateType = 'curso' | 'modulo';
export type CertificateStatus = 'pendiente' | 'generado' | 'enviado' | 'verificado';

/**
 * Certificado base
 */
export interface Certificate {
  id: number;
  certificateNumber: string; // Número único del certificado (ej: "CERT-2025-001")
  type: CertificateType;
  status: CertificateStatus;
  
  // Relaciones
  studentId: number;
  studentName: string;
  courseId?: number; // Si es certificado de curso
  courseName?: string;
  moduleId?: number; // Si es certificado de módulo
  moduleName?: string;
  
  // Calificación
  grade: number;
  maxGrade: number;
  percentage: number;
  
  // Fechas
  completionDate: string; // Fecha en que completó el curso/módulo
  issuedDate: string; // Fecha de emisión del certificado
  expiryDate?: string; // Fecha de expiración (si aplica)
  
  // Archivo
  pdfUrl?: string; // URL del PDF del certificado
  verificationUrl?: string; // URL para verificar el certificado
  
  // Metadatos
  issuedBy?: number; // ID del coordinador/administrador
  issuedByName?: string;
  templateId?: number; // ID de la plantilla usada
}

/**
 * Certificado para formularios
 */
export interface CertificateFormData {
  studentId: number;
  type: CertificateType;
  courseId?: number;
  moduleId?: number;
  grade: number;
  maxGrade: number;
  completionDate: string;
  templateId?: number;
}

/**
 * Plantilla de certificado
 */
export interface CertificateTemplate {
  id: number;
  name: string;
  type: CertificateType;
  templateUrl: string; // URL de la plantilla
  isActive: boolean;
  createdAt: string;
}