/**
 * Helper functions for Cloudinary image uploads
 */

// Create a Cloudinary upload widget
export const createUploadWidget = (
  callback: (error: any, result: any) => void,
  options: {
    maxFiles?: number;
    maxFileSize?: number; // in MB
    folder?: string;
  } = {}
) => {
  const { maxFiles = 1, maxFileSize = 1, folder = "students" } = options;

  // @ts-ignore - Cloudinary widget is loaded via script tag
  if (!window.cloudinary) {
    console.error("Cloudinary not loaded!");
    return null;
  }
  
  // @ts-ignore - Cloudinary widget is loaded via script tag
  return window.cloudinary.createUploadWidget(
    {
      cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "",
      uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "",
      folder: folder,
      sources: ["local", "camera"],
      multiple: maxFiles > 1,
      maxFiles: maxFiles,
      maxFileSize: maxFileSize * 1024 * 1024, // Convert MB to bytes
      resourceType: "image",
      cropping: true,
      croppingAspectRatio: 1, // Square cropping for profile photos
      styles: {
        palette: {
          window: "#FFFFFF",
          windowBorder: "#90A0B3",
          tabIcon: "#7C3AED",
          menuIcons: "#5A616A",
          textDark: "#000000",
          textLight: "#FFFFFF",
          link: "#7C3AED",
          action: "#7C3AED",
          inactiveTabIcon: "#3f4759",
          error: "#F44235",
          inProgress: "#7C3AED",
          complete: "#20B832",
          sourceBg: "#F4F5F5",
        },
      },
    },
    callback
  );
};

// Format the Cloudinary URL to optimize images
export const formatCloudinaryUrl = (url: string, options: { width?: number; height?: number; crop?: string } = {}) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  const { width, height, crop = 'fill' } = options;
  
  // Replace upload with specific transformation
  let transformedUrl = url.replace('/upload/', `/upload/c_${crop},g_face,q_auto,f_auto`);
  
  if (width) {
    transformedUrl = transformedUrl.replace('/upload/', `/upload/w_${width},`);
  }
  
  if (height) {
    transformedUrl = transformedUrl.replace('/upload/', `/upload/h_${height},`);
  }
  
  return transformedUrl;
};

// Utility function to get image dimensions
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };
    img.src = URL.createObjectURL(file);
  });
};
