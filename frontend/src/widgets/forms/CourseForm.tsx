/**
 * Widget: CourseForm
 * Formulario completo para crear/editar cursos
 * 
 * @module widgets/forms/CourseForm
 */

import React, { useState, useEffect } from 'react';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { cn } from '@/shared/lib/utils';
import type { CourseFormData, CourseLevel, CourseStatus } from '@/entities/course';
import type { Module } from '@/entities/module';

/**
 * Props del componente CourseForm
 */
export interface CourseFormProps {
  /**
   * Datos iniciales del formulario (para edición)
   */
  initialData?: Partial<CourseFormData>;
  
  /**
   * Modo del formulario
   * @default 'create'
   */
  mode?: 'create' | 'edit';
  
  /**
   * Callback cuando se envía el formulario
   */
  onSubmit: (data: CourseFormData) => Promise<void> | void;
  
  /**
   * Callback cuando se cancela
   */
  onCancel?: () => void;
  
  /**
   * Si el formulario está abierto (para usar como modal)
   */
  isOpen?: boolean;
  
  /**
   * Si el formulario está enviando
   */
  isSubmitting?: boolean;
  
  /**
   * Lista de módulos disponibles (opcional)
   */
  modules?: Module[];
  
  /**
   * Lista de coordinadores disponibles (IDs)
   */
  coordinators?: Array<{ id: number; name: string }>;
}

const COURSE_LEVELS: CourseLevel[] = ['Básico', 'Intermedio', 'Avanzado'];
const COURSE_STATUSES: CourseStatus[] = ['Borrador', 'Publicado', 'Archivado'];

/**
 * Widget de formulario de curso
 * 
 * Formulario completo para crear o editar cursos con validación
 * 
 * @example
 * ```tsx
 * <CourseForm
 *   mode="create"
 *   onSubmit={handleCreateCourse}
 *   onCancel={() => setIsOpen(false)}
 *   isOpen={isOpen}
 *   modules={modules}
 *   coordinators={coordinators}
 * />
 * ```
 */
export const CourseForm: React.FC<CourseFormProps> = ({
  initialData,
  mode = 'create',
  onSubmit,
  onCancel,
  isOpen = true,
  isSubmitting = false,
  modules = [],
  coordinators = []
}) => {
  const [formData, setFormData] = useState<CourseFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    code: initialData?.code || '',
    level: initialData?.level || 'Básico',
    status: initialData?.status || 'Borrador',
    imageUrl: initialData?.imageUrl || '',
    moduleId: initialData?.moduleId,
    coordinatorId: initialData?.coordinatorId || coordinators[0]?.id || 0,
    lessons: initialData?.lessons || 0,
    estimatedDuration: initialData?.estimatedDuration || '',
    category: initialData?.category || '',
    prerequisites: initialData?.prerequisites || [],
    minGradeToPass: initialData?.minGradeToPass || 7.0,
    hasCertificate: initialData?.hasCertificate ?? true
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CourseFormData, string>>>({});

  // Resetear formulario cuando cambian los datos iniciales
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        code: initialData.code || '',
        level: initialData.level || 'Básico',
        status: initialData.status || 'Borrador',
        imageUrl: initialData.imageUrl || '',
        moduleId: initialData.moduleId,
        coordinatorId: initialData.coordinatorId || coordinators[0]?.id || 0,
        lessons: initialData.lessons || 0,
        estimatedDuration: initialData.estimatedDuration || '',
        category: initialData.category || '',
        prerequisites: initialData.prerequisites || [],
        minGradeToPass: initialData.minGradeToPass || 7.0,
        hasCertificate: initialData.hasCertificate ?? true
      });
    }
  }, [initialData, coordinators]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CourseFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'El código es obligatorio';
    }

    if (formData.lessons <= 0) {
      newErrors.lessons = 'El número de lecciones debe ser mayor a 0';
    }

    if (!formData.coordinatorId || formData.coordinatorId === 0) {
      newErrors.coordinatorId = 'Debe seleccionar un coordinador';
    }

    if (formData.minGradeToPass && (formData.minGradeToPass < 0 || formData.minGradeToPass > 10)) {
      newErrors.minGradeToPass = 'La nota mínima debe estar entre 0 y 10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const processedValue = type === 'number' 
      ? (name === 'lessons' ? parseInt(value) || 0 : parseFloat(value) || 0)
      : type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : value;

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Limpiar error cuando el usuario empieza a escribir
    if (errors[name as keyof CourseFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSelectChange = (name: keyof CourseFormData, value: string) => {
    const processedValue = name === 'moduleId' || name === 'coordinatorId'
      ? parseInt(value) || 0
      : value;

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Limpiar error
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      code: '',
      level: 'Básico',
      status: 'Borrador',
      imageUrl: '',
      moduleId: undefined,
      coordinatorId: coordinators[0]?.id || 0,
      lessons: 0,
      estimatedDuration: '',
      category: '',
      prerequisites: [],
      minGradeToPass: 7.0,
      hasCertificate: true
    });
    setErrors({});
    onCancel?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Crear Nuevo Curso' : 'Editar Curso'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="name">
                Nombre del Curso <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ej: Fundamentos Bíblicos"
                className={cn(errors.name && 'border-destructive')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Código */}
            <div className="space-y-2">
              <Label htmlFor="code">
                Código <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="Ej: CUR-001"
                className={cn(errors.code && 'border-destructive')}
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code}</p>
              )}
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="Ej: Nuevo Testamento"
              />
            </div>

            {/* Descripción */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">
                Descripción <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Describe el contenido del curso"
                className={cn(errors.description && 'border-destructive')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            {/* Nivel */}
            <div className="space-y-2">
              <Label htmlFor="level">Nivel</Label>
              <Select
                value={formData.level}
                onValueChange={(value) => handleSelectChange('level', value as CourseLevel)}
              >
                <SelectTrigger id="level">
                  <SelectValue placeholder="Seleccionar nivel" />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange('status', value as CourseStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Coordinador */}
            <div className="space-y-2">
              <Label htmlFor="coordinatorId">
                Coordinador <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.coordinatorId?.toString() || '0'}
                onValueChange={(value) => handleSelectChange('coordinatorId', value)}
              >
                <SelectTrigger id="coordinatorId" className={cn(errors.coordinatorId && 'border-destructive')}>
                  <SelectValue placeholder="Seleccionar coordinador" />
                </SelectTrigger>
                <SelectContent>
                  {coordinators.map((coordinator) => (
                    <SelectItem key={coordinator.id} value={coordinator.id.toString()}>
                      {coordinator.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.coordinatorId && (
                <p className="text-sm text-destructive">{errors.coordinatorId}</p>
              )}
            </div>

            {/* Módulo */}
            {modules.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="moduleId">Módulo (opcional)</Label>
                <Select
                  value={formData.moduleId?.toString() || 'none'}
                  onValueChange={(value) => handleSelectChange('moduleId', value === 'none' ? '0' : value)}
                >
                  <SelectTrigger id="moduleId">
                    <SelectValue placeholder="Seleccionar módulo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguno</SelectItem>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={module.id.toString()}>
                        {module.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Lecciones */}
            <div className="space-y-2">
              <Label htmlFor="lessons">
                Número de Lecciones <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lessons"
                name="lessons"
                type="number"
                min="1"
                value={formData.lessons}
                onChange={handleInputChange}
                className={cn(errors.lessons && 'border-destructive')}
              />
              {errors.lessons && (
                <p className="text-sm text-destructive">{errors.lessons}</p>
              )}
            </div>

            {/* Duración Estimada */}
            <div className="space-y-2">
              <Label htmlFor="estimatedDuration">Duración Estimada</Label>
              <Input
                id="estimatedDuration"
                name="estimatedDuration"
                value={formData.estimatedDuration}
                onChange={handleInputChange}
                placeholder="Ej: 4 semanas"
              />
            </div>

            {/* Nota Mínima para Aprobar */}
            <div className="space-y-2">
              <Label htmlFor="minGradeToPass">Nota Mínima para Aprobar</Label>
              <Input
                id="minGradeToPass"
                name="minGradeToPass"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.minGradeToPass}
                onChange={handleInputChange}
                className={cn(errors.minGradeToPass && 'border-destructive')}
              />
              {errors.minGradeToPass && (
                <p className="text-sm text-destructive">{errors.minGradeToPass}</p>
              )}
            </div>

            {/* URL de Imagen */}
            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL de Imagen</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={handleInputChange}
                placeholder="Ej: /images/course.jpg"
              />
            </div>

            {/* Certificado */}
            <div className="md:col-span-2 flex items-center space-x-2">
              <input
                id="hasCertificate"
                name="hasCertificate"
                type="checkbox"
                checked={formData.hasCertificate}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="hasCertificate" className="cursor-pointer">
                Otorga certificado al completarlo
              </Label>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Guardando...'
                : mode === 'create'
                ? 'Crear Curso'
                : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

