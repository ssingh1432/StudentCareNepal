import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, ImagePlus, RefreshCw, Trash2 } from "lucide-react";
import { createUploadWidget, formatCloudinaryUrl } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface PhotoUploadProps {
  photoUrl?: string;
  onChange: (url: string, publicId: string) => void;
  onError?: (error: string) => void;
  className?: string;
  defaultImage?: string;
  width?: number;
  height?: number;
}

export function PhotoUpload({
  photoUrl,
  onChange,
  onError,
  className = "",
  defaultImage = "",
  width = 120,
  height = 120,
}: PhotoUploadProps) {
  const [url, setUrl] = useState<string | undefined>(photoUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [cloudinaryWidget, setCloudinaryWidget] = useState<any>(null);

  // Initialize Cloudinary widget
  useEffect(() => {
    // Check if Cloudinary script is loaded
    if (typeof window !== "undefined" && "cloudinary" in window) {
      initWidget();
    } else {
      // Load Cloudinary script if not already loaded
      const script = document.createElement("script");
      script.src = "https://upload-widget.cloudinary.com/global/all.js";
      script.async = true;
      script.onload = initWidget;
      document.body.appendChild(script);
    }

    return () => {
      // Cleanup widget
      if (cloudinaryWidget) {
        try {
          cloudinaryWidget.destroy();
        } catch (error) {
          console.error("Error destroying Cloudinary widget:", error);
        }
      }
    };
  }, []);

  // Update URL if photoUrl prop changes
  useEffect(() => {
    setUrl(photoUrl);
  }, [photoUrl]);

  const initWidget = () => {
    // @ts-ignore - Cloudinary is loaded via script
    if (!window.cloudinary) {
      setTimeout(initWidget, 500); // Try again in 500ms
      return;
    }

    const widget = createUploadWidget(
      (error, result) => {
        setIsLoading(false);
        
        if (error) {
          console.error("Cloudinary upload error:", error);
          onError?.(error.message || "Upload failed");
          return;
        }
        
        if (result.event === "success") {
          const { secure_url, public_id } = result.info;
          setUrl(secure_url);
          onChange(secure_url, public_id);
        }
      },
      {
        maxFiles: 1,
        maxFileSize: 1, // 1MB
        folder: "students",
      }
    );
    
    setCloudinaryWidget(widget);
  };

  const handleUploadClick = () => {
    if (!cloudinaryWidget) {
      onError?.("Upload widget is not ready. Please try again.");
      return;
    }
    
    setIsLoading(true);
    cloudinaryWidget.open();
  };

  const handleRemovePhoto = () => {
    setUrl(undefined);
    onChange("", "");
  };

  // Format URL with Cloudinary transformations if it's a Cloudinary URL
  const optimizedUrl = url 
    ? formatCloudinaryUrl(url, { width, height }) 
    : defaultImage;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div 
        className="relative overflow-hidden rounded-full border-2 border-gray-200"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {isLoading ? (
          <Skeleton className="w-full h-full rounded-full" />
        ) : optimizedUrl ? (
          <img
            src={optimizedUrl}
            alt="Uploaded photo"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <Camera className="h-1/3 w-1/3 text-gray-400" />
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center">
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={handleUploadClick}
          disabled={isLoading}
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4 mr-1" />
          )}
          {url ? "Change" : "Upload"}
        </Button>
        
        {url && (
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={handleRemovePhoto}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
