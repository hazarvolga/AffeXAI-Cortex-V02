'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  File, 
  FileText, 
  FileImage, 
  FileSpreadsheet,
  X,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadAreaProps {
  onFilesSelected: (files: File[]) => void;
  onCancel: () => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
  className?: string;
}

interface FileUploadStatus {
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  id: string;
}

const SUPPORTED_TYPES = {
  'application/pdf': { icon: FileText, label: 'PDF' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: FileText, label: 'DOCX' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: FileSpreadsheet, label: 'XLSX' },
  'text/plain': { icon: FileText, label: 'TXT' },
  'text/markdown': { icon: FileText, label: 'MD' },
  'image/jpeg': { icon: FileImage, label: 'JPEG' },
  'image/png': { icon: FileImage, label: 'PNG' },
  'image/gif': { icon: FileImage, label: 'GIF' }
};

const DEFAULT_ACCEPTED_TYPES = Object.keys(SUPPORTED_TYPES);
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_MAX_FILES = 5;

export function FileUploadArea({
  onFilesSelected,
  onCancel,
  maxFiles = DEFAULT_MAX_FILES,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  className
}: FileUploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadStatus[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `Desteklenmeyen dosya türü: ${file.type}`;
    }

    // Check file size
    if (file.size > maxFileSize) {
      return `Dosya boyutu çok büyük: ${formatFileSize(file.size)} (maksimum: ${formatFileSize(maxFileSize)})`;
    }

    return null;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    const typeInfo = SUPPORTED_TYPES[fileType as keyof typeof SUPPORTED_TYPES];
    return typeInfo ? typeInfo.icon : File;
  };

  const getFileLabel = (fileType: string) => {
    const typeInfo = SUPPORTED_TYPES[fileType as keyof typeof SUPPORTED_TYPES];
    return typeInfo ? typeInfo.label : 'Unknown';
  };

  const generateFileId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    // Check total file count
    if (uploadedFiles.length + fileArray.length > maxFiles) {
      newErrors.push(`Maksimum ${maxFiles} dosya yükleyebilirsiniz`);
      setErrors(newErrors);
      return;
    }

    // Validate each file
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear errors and add files
    setErrors([]);
    const newFileStatuses: FileUploadStatus[] = validFiles.map(file => ({
      file,
      status: 'pending',
      progress: 0,
      id: generateFileId()
    }));

    setUploadedFiles(prev => [...prev, ...newFileStatuses]);

    // Simulate upload progress for each file
    newFileStatuses.forEach(fileStatus => {
      simulateUpload(fileStatus.id);
    });
  }, [uploadedFiles.length, maxFiles, maxFileSize, acceptedTypes]);

  const simulateUpload = (fileId: string) => {
    setUploadedFiles(prev => 
      prev.map(f => f.id === fileId ? { ...f, status: 'uploading' } : f)
    );

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileId ? { 
            ...f, 
            status: 'processing', 
            progress: 100 
          } : f)
        );

        // Simulate processing
        setTimeout(() => {
          setUploadedFiles(prev => 
            prev.map(f => f.id === fileId ? { 
              ...f, 
              status: 'completed' 
            } : f)
          );
        }, 1000);
      } else {
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileId ? { ...f, progress } : f)
        );
      }
    }, 200);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleUploadFiles = () => {
    const completedFiles = uploadedFiles
      .filter(f => f.status === 'completed')
      .map(f => f.file);
    
    if (completedFiles.length > 0) {
      onFilesSelected(completedFiles);
    }
  };

  const allFilesCompleted = uploadedFiles.length > 0 && 
    uploadedFiles.every(f => f.status === 'completed');

  const hasErrors = errors.length > 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drag & Drop Area */}
      <Card 
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          hasErrors && "border-destructive"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Upload className={cn(
            "h-12 w-12 mb-4",
            isDragOver ? "text-primary" : "text-muted-foreground"
          )} />
          <h3 className="text-lg font-semibold mb-2">
            Dosyaları buraya sürükleyin
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            veya dosya seçmek için tıklayın
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.entries(SUPPORTED_TYPES).map(([type, info]) => (
              <Badge key={type} variant="secondary" className="text-xs">
                {info.label}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Maksimum {maxFiles} dosya, her biri {formatFileSize(maxFileSize)} boyutunda
          </p>
        </CardContent>
      </Card>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Error Messages */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Yüklenen Dosyalar</h4>
          {uploadedFiles.map((fileStatus) => {
            const FileIcon = getFileIcon(fileStatus.file.type);
            
            return (
              <Card key={fileStatus.id} className="p-3">
                <div className="flex items-center space-x-3">
                  <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">
                        {fileStatus.file.name}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {getFileLabel(fileStatus.file.type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(fileStatus.file.size)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    {(fileStatus.status === 'uploading' || fileStatus.status === 'processing') && (
                      <div className="space-y-1">
                        <Progress value={fileStatus.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {fileStatus.status === 'uploading' ? 'Yükleniyor...' : 'İşleniyor...'}
                          {fileStatus.status === 'uploading' && ` ${Math.round(fileStatus.progress)}%`}
                        </p>
                      </div>
                    )}
                    
                    {/* Status */}
                    {fileStatus.status === 'completed' && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <Check className="h-3 w-3" />
                        <span className="text-xs">Tamamlandı</span>
                      </div>
                    )}
                    
                    {fileStatus.status === 'error' && (
                      <div className="flex items-center space-x-1 text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        <span className="text-xs">{fileStatus.error || 'Hata oluştu'}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFile(fileStatus.id)}
                    className="h-8 w-8 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          İptal
        </Button>
        <Button 
          onClick={handleUploadFiles}
          disabled={!allFilesCompleted}
        >
          {uploadedFiles.some(f => f.status === 'uploading' || f.status === 'processing') ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              İşleniyor...
            </>
          ) : (
            `Dosyaları Gönder (${uploadedFiles.filter(f => f.status === 'completed').length})`
          )}
        </Button>
      </div>
    </div>
  );
}