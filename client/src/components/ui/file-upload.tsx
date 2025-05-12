import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileClear?: () => void;
  accept?: string;
  maxSize?: number; // in bytes
  value?: File | string;
  previewUrl?: string;
  className?: string;
}

export function FileUpload({
  onFileSelect,
  onFileClear,
  accept = 'image/jpeg, image/png',
  maxSize = 1024 * 1024, // 1MB default
  value,
  previewUrl,
  className
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(
    typeof value === 'string' ? value : previewUrl || null
  );
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (file) {
      // Validate file size
      if (file.size > maxSize) {
        setError(`File is too large. Maximum size is ${maxSize / 1024 / 1024}MB.`);
        return;
      }
      
      // Reset error
      setError(null);
      
      // Create preview URL
      const fileUrl = URL.createObjectURL(file);
      setPreview(fileUrl);
      
      // Call callback
      onFileSelect(file);
    }
  };
  
  const handleClear = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Revoke object URL to prevent memory leaks
    if (preview && !previewUrl) {
      URL.revokeObjectURL(preview);
    }
    
    setPreview(null);
    setError(null);
    
    if (onFileClear) {
      onFileClear();
    }
  };
  
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-4">
        {preview ? (
          <div className="relative">
            <img 
              src={preview} 
              alt="Preview" 
              className="h-24 w-24 rounded-full object-cover border-2 border-purple-100"
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute -top-2 -right-2 p-1 bg-white rounded-full border border-gray-300 shadow-sm hover:bg-gray-100"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-purple-50 border-2 border-dashed border-purple-200">
            <Upload className="h-8 w-8 text-purple-300" />
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? "Change Photo" : "Upload Photo"}
          </Button>
          <p className="text-xs text-muted-foreground">
            JPEG or PNG, max {maxSize / 1024 / 1024}MB
          </p>
        </div>
      </div>
      
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}
