import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Upload, X, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotoUploadProps {
  initialPhotoUrl?: string;
  onPhotoChange: (file: File | null) => void;
  studentName?: string;
}

export function PhotoUpload({ initialPhotoUrl, onPhotoChange, studentName }: PhotoUploadProps) {
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(initialPhotoUrl);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) return;
    
    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(selectedFile.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG or PNG image.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (1MB max)
    if (selectedFile.size > 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 1MB.",
        variant: "destructive",
      });
      return;
    }
    
    // Create temporary URL for preview
    const previewUrl = URL.createObjectURL(selectedFile);
    setPhotoUrl(previewUrl);
    setFile(selectedFile);
    onPhotoChange(selectedFile);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(undefined);
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onPhotoChange(null);
  };

  const handleClickUpload = () => {
    inputRef.current?.click();
  };

  // Generate initials for avatar fallback
  const getInitials = () => {
    if (!studentName) return "S";
    return studentName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex flex-col items-center">
      <input
        type="file"
        accept="image/jpeg, image/png"
        className="hidden"
        ref={inputRef}
        onChange={handleFileChange}
      />
      
      <Card className="relative w-32 h-32 flex items-center justify-center mb-2 p-0 overflow-hidden">
        <Avatar className="w-full h-full rounded-none">
          <AvatarImage 
            src={photoUrl} 
            alt="Student photo" 
            className="object-cover"
          />
          <AvatarFallback className="text-2xl bg-purple-100 text-purple-600 rounded-none">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        
        {photoUrl && (
          <button
            type="button"
            onClick={handleRemovePhoto}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-sm"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </Card>
      
      <Button 
        type="button" 
        variant="outline" 
        size="sm"
        className="mt-2"
        onClick={handleClickUpload}
      >
        <Upload className="h-4 w-4 mr-2" />
        {photoUrl ? "Change Photo" : "Upload Photo"}
      </Button>
      
      <p className="text-xs text-gray-500 mt-1">JPEG or PNG, max 1MB</p>
    </div>
  );
}
