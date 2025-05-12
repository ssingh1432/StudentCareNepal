// Excel Generation helper functions
import { apiRequest } from './queryClient';
import { PdfOptions, PlanPdfOptions } from './pdf-generator';

export const generateStudentExcel = async (options: PdfOptions = {}): Promise<void> => {
  try {
    // Build query string
    const params = new URLSearchParams();
    if (options.classLevel) params.append('class', options.classLevel);
    if (options.teacherId) params.append('teacher', options.teacherId.toString());
    
    // Request the Excel from the server
    const url = `/api/reports/students/excel?${params.toString()}`;
    
    // Use window.open to open a new tab with the Excel
    window.open(url, '_blank');
  } catch (error) {
    console.error('Excel generation error:', error);
    throw new Error('Failed to generate Excel');
  }
};

export const generatePlanExcel = async (options: PlanPdfOptions = {}): Promise<void> => {
  try {
    // Build query string
    const params = new URLSearchParams();
    if (options.classLevel) params.append('class', options.classLevel);
    if (options.planType) params.append('type', options.planType);
    
    // Request the Excel from the server
    const url = `/api/reports/plans/excel?${params.toString()}`;
    
    // Use window.open to open a new tab with the Excel
    window.open(url, '_blank');
  } catch (error) {
    console.error('Excel generation error:', error);
    throw new Error('Failed to generate Excel');
  }
};
