import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadImage, validateFile } from "@/lib/cloudinary";
import { useToast } from "@/hooks/use-toast";
import { Image, Upload, X } from "lucide-react";

interface CloudinaryUploadProps {
  value?: string;
  onChange: (url: string) => void;
}

export function CloudinaryUpload({ value, onChange }: CloudinaryUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file before upload
    const validation = validateFile(file);
    if (!validation.valid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    // Create local preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    setIsUploading(true);
    try {
      const result = await uploadImage(file);
      onChange(result.url);
      toast({
        title: "Upload successful",
        description: "Image has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
      // Clear preview on error
      setPreview(value || null);
    } finally {
      setIsUploading(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>Student Photo</Label>
      <div className="mt-1 flex items-center">
        {preview ? (
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Preview"
              className="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
            <Image className="h-10 w-10 text-gray-400" />
          </div>
        )}

        <div className="ml-4">
          <Input
            ref={fileInputRef}
            type="file"
            id="photo"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
          <p className="mt-1 text-xs text-gray-500">
            JPG or PNG. Max 1MB.
          </p>
        </div>
      </div>
    </div>
  );
}
