import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function generatePdf(element: HTMLElement, filename: string) {
  // This is a placeholder for jsPDF implementation
  // In a real implementation, we would use jsPDF here
  console.log('Generating PDF:', element, filename);
}

export function generateExcel(data: any[], filename: string) {
  // This is a placeholder for xlsx implementation
  // In a real implementation, we would use xlsx here
  console.log('Generating Excel:', data, filename);
}

export function classColorMap(className: string) {
  switch (className) {
    case "Nursery":
      return "yellow";
    case "LKG":
      return "blue";
    case "UKG":
      return "green";
    default:
      return "gray";
  }
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' bytes';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}
