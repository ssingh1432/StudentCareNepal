// PDF Generation helper functions
import { apiRequest } from './queryClient';

export interface PdfOptions {
  classLevel?: string;
  teacherId?: number;
  includePhotos?: boolean;
}

export const generateStudentPdf = async (options: PdfOptions = {}): Promise<void> => {
  try {
    // Build query string
    const params = new URLSearchParams();
    if (options.classLevel) params.append('class', options.classLevel);
    if (options.teacherId) params.append('teacher', options.teacherId.toString());
    if (options.includePhotos) params.append('includePhotos', 'true');
    
    // Request the PDF from the server
    const url = `/api/reports/students/pdf?${params.toString()}`;
    
    // Use window.open to open a new tab with the PDF
    window.open(url, '_blank');
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF');
  }
};

export interface PlanPdfOptions {
  classLevel?: string;
  planType?: string;
}

export const generatePlanPdf = async (options: PlanPdfOptions = {}): Promise<void> => {
  try {
    // Build query string
    const params = new URLSearchParams();
    if (options.classLevel) params.append('class', options.classLevel);
    if (options.planType) params.append('type', options.planType);
    
    // Request the PDF from the server
    const url = `/api/reports/plans/pdf?${params.toString()}`;
    
    // Use window.open to open a new tab with the PDF
    window.open(url, '_blank');
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF');
  }
};
