import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Upload, File, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';

interface AssignmentUploadProps {
  assignmentId: string;
  assignmentTitle: string;
  onUploadComplete?: () => void;
}

export const AssignmentUpload = ({ assignmentId, assignmentTitle, onUploadComplete }: AssignmentUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      // TODO: Implement actual upload logic when backend endpoint is ready
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsUploaded(true);
      toast.success('Tarea enviada exitosamente');
      onUploadComplete?.();
    } catch (error) {
      toast.error('Error al subir la tarea. Intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{assignmentTitle}</CardTitle>
        <CardDescription>Sube tu archivo de tarea</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isUploaded ? (
          <>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                file && "border-primary bg-primary/5"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="flex items-center justify-between p-4 bg-background rounded-md">
                  <div className="flex items-center gap-3">
                    <File className="w-8 h-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium">Arrastra tu archivo aquí</p>
                    <p className="text-sm text-muted-foreground">o haz clic para seleccionar</p>
                  </div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label htmlFor="file-upload">
                    <Button variant="outline" asChild>
                      <span>Seleccionar archivo</span>
                    </Button>
                  </Label>
                </div>
              )}
            </div>

            {file && (
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? 'Subiendo...' : 'Enviar Tarea'}
              </Button>
            )}
          </>
        ) : (
          <div className="text-center py-8 space-y-4">
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
            <div>
              <h3 className="text-lg font-semibold">¡Tarea enviada!</h3>
              <p className="text-muted-foreground">Tu tarea ha sido enviada exitosamente</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
