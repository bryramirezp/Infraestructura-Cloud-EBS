/**
 * Widget: ModuleForm
 * Formulario completo para crear/editar módulos
 * 
 * @module widgets/forms/ModuleForm
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
import { Checkbox } from '@/shared/ui/checkbox';
import { cn } from '@/shared/lib/utils';
import type { ModuleFormData, ModuleLevel, ModuleStatus } from '@/entities/module';
import type { Course } from '@/entities/course';

/**
 * Props del componente ModuleForm
 */
export interface ModuleFormProps {
  /**
   * Datos iniciales del formulario (para edición)
   */
  initialData?: Partial<ModuleFormData>;
  
  /**
   * Modo del formulario
   * @default 'create'
   */
  mode?: 'create' | 'edit';
  
  /**
   * Callback cuando se envía el formulario
   */
  onSubmit: (data: ModuleFormData) => Promise<void> | void;
  
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
   * Lista de cursos disponibles
   */
  courses?: Course[];
  
  /**
   * Lista de coordinadores disponibles (IDs)
   */
  coordinators?: Array<{ id: number; name: string }>;
  
  /**
   * Lista de módulos disponibles (para prerrequisitos)
   */
  modules?: Array<{ id: number; name: string }>;
}

const MODULE_LEVELS: ModuleLevel[] = ['Básico', 'Intermedio', 'Avanzado'];
const MODULE_STATUSES: ModuleStatus[] = ['Borrador', 'Publicado', 'Archivado'];

/**
 * Widget de formulario de módulo
 * 
 * Formulario completo para crear o editar módulos con validación
 * 
 * @example
 * ```tsx
 * <ModuleForm
 *   mode="create"
 *   onSubmit={handleCreateModule}
 *   onCancel={() => setIsOpen(false)}
 *   isOpen={isOpen}
 *   courses={courses}
 *   coordinators={coordinators}
 * />
 * ```
 */
export const ModuleForm: React.FC<ModuleFormProps> = ({
  initialData,
  mode = 'create',
  onSubmit,
  onCancel,
  isOpen = true,
  isSubmitting = false,
  courses = [],
  coordinators = [],
  modules = []
}) => {
  const [formData, setFormData] = useState<ModuleFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    code: initialData?.code || '',
    level: initialData?.level || 'Básico',
    status: initialData?.status || 'Borrador',
    imageUrl: initialData?.imageUrl || '',
    coordinatorId: initialData?.coordinatorId || coordinators[0]?.id || 0,
    courseIds: initialData?.courseIds || [],
    estimatedDuration: initialData?.estimatedDuration || '',
    category: initialData?.category || '',
    prerequisites: initialData?.prerequisites || [],
    minGradeToPass: initialData?.minGradeToPass || 7.0
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ModuleFormData, string>>>({});

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
        coordinatorId: initialData.coordinatorId || coordinators[0]?.id || 0,
        courseIds: initialData.courseIds || [],
        estimatedDuration: initialData.estimatedDuration || '',
        category: initialData.category || '',
        prerequisites: initialData.prerequisites || [],
        minGradeToPass: initialData.minGradeToPass || 7.0
      });
    }
  }, [initialData, coordinators]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ModuleFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'El código es obligatorio';
    }

    if (formData.courseIds.length === 0) {
      newErrors.courseIds = 'Debe seleccionar al menos un curso';
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
      ? parseFloat(value) || 0
      : value;

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Limpiar error cuando el usuario empieza a escribir
    if (errors[name as keyof ModuleFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSelectChange = (name: keyof ModuleFormData, value: string) => {
    const processedValue = name === 'coordinatorId'
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

  const handleCourseToggle = (courseId: number) => {
    setFormData(prev => {
      const newCourseIds = prev.courseIds.includes(courseId)
        ? prev.courseIds.filter(id => id !== courseId)
        : [...prev.courseIds, courseId];
      
      return {
        ...prev,
        courseIds: newCourseIds
      };
    });

    // Limpiar error
    if (errors.courseIds) {
      setErrors(prev => ({
        ...prev,
        courseIds: undefined
      }));
    }
  };

  const handlePrerequisiteToggle = (moduleId: number) => {
    setFormData(prev => {
      const newPrerequisites = prev.prerequisites?.includes(moduleId)
        ? prev.prerequisites.filter(id => id !== moduleId)
        : [...(prev.prerequisites || []), moduleId];
      
      return {
        ...prev,
        prerequisites: newPrerequisites
      };
    });
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      code: '',
      level: 'Básico',
      status: 'Borrador',
      imageUrl: '',
      coordinatorId: coordinators[0]?.id || 0,
      courseIds: [],
      estimatedDuration: '',
      category: '',
      prerequisites: [],
      minGradeToPass: 7.0
    });
    setErrors({});
    onCancel?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Crear Nuevo Módulo' : 'Editar Módulo'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="name">
                Nombre del Módulo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ej: Módulo de Teología Fundamental"
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
                placeholder="Ej: MOD-001"
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
                placeholder="Ej: Teología"
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
                placeholder="Describe el contenido del módulo"
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
                onValueChange={(value) => handleSelectChange('level', value as ModuleLevel)}
              >
                <SelectTrigger id="level">
                  <SelectValue placeholder="Seleccionar nivel" />
                </SelectTrigger>
                <SelectContent>
                  {MODULE_LEVELS.map((level) => (
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
                onValueChange={(value) => handleSelectChange('status', value as ModuleStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {MODULE_STATUSES.map((status) => (
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

            {/* Duración Estimada */}
            <div className="space-y-2">
              <Label htmlFor="estimatedDuration">Duración Estimada</Label>
              <Input
                id="estimatedDuration"
                name="estimatedDuration"
                value={formData.estimatedDuration}
                onChange={handleInputChange}
                placeholder="Ej: 12 semanas"
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
                placeholder="Ej: /images/module.jpg"
              />
            </div>

            {/* Cursos */}
            <div className="md:col-span-2 space-y-2">
              <Label>
                Cursos del Módulo <span className="text-destructive">*</span>
              </Label>
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                {courses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay cursos disponibles</p>
                ) : (
                  courses.map((course) => (
                    <div key={course.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`course-${course.id}`}
                        checked={formData.courseIds.includes(course.id)}
                        onCheckedChange={() => handleCourseToggle(course.id)}
                      />
                      <Label
                        htmlFor={`course-${course.id}`}
                        className="cursor-pointer flex-1"
                      >
                        {course.name} ({course.code})
                      </Label>
                    </div>
                  ))
                )}
              </div>
              {errors.courseIds && (
                <p className="text-sm text-destructive">{errors.courseIds}</p>
              )}
            </div>

            {/* Prerrequisitos */}
            {modules.length > 0 && (
              <div className="md:col-span-2 space-y-2">
                <Label>Módulos Prerrequisitos (opcional)</Label>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                  {modules.map((module) => (
                    <div key={module.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`prerequisite-${module.id}`}
                        checked={formData.prerequisites?.includes(module.id) || false}
                        onCheckedChange={() => handlePrerequisiteToggle(module.id)}
                      />
                      <Label
                        htmlFor={`prerequisite-${module.id}`}
                        className="cursor-pointer flex-1"
                      >
                        {module.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                ? 'Crear Módulo'
                : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

