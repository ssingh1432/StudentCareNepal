import axios from 'axios';

// Interface for report options
export interface ReportOptions {
  format: 'pdf' | 'excel';
  reportType: 'students' | 'plans';
  className?: string;
  teacherId?: number;
  includePhotos?: boolean;
  planType?: string;
  startDate?: string;
  endDate?: string;
}

// Function to download a student progress report
export async function downloadStudentReport(options: ReportOptions): Promise<void> {
  try {
    const { format, className, includePhotos } = options;
    
    // Build query parameters
    const params = new URLSearchParams();
    if (className) params.append('class', className);
    if (includePhotos) params.append('includePhotos', 'true');
    
    // Generate the URL based on format
    const url = `/api/reports/students/${format}?${params.toString()}`;
    
    // Use axios to download the file with proper response handling
    const response = await axios.get(url, {
      responseType: 'blob',
    });
    
    // Create a filename
    const now = new Date().toISOString().slice(0, 10);
    const classStr = className ? `-${className}` : '';
    const filename = `student-progress${classStr}-${now}.${format}`;
    
    // Create a download link and trigger download
    const url2 = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url2;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    link.remove();
    window.URL.revokeObjectURL(url2);
  } catch (error) {
    console.error('Error downloading student report:', error);
    throw new Error('Failed to download student report');
  }
}

// Function to download a teaching plan report
export async function downloadTeachingPlanReport(options: ReportOptions): Promise<void> {
  try {
    const { format, className, planType } = options;
    
    // Build query parameters
    const params = new URLSearchParams();
    if (className) params.append('class', className);
    if (planType) params.append('type', planType);
    
    // Generate the URL based on format
    const url = `/api/reports/plans/${format}?${params.toString()}`;
    
    // Use axios to download the file with proper response handling
    const response = await axios.get(url, {
      responseType: 'blob',
    });
    
    // Create a filename
    const now = new Date().toISOString().slice(0, 10);
    const classStr = className ? `-${className}` : '';
    const typeStr = planType ? `-${planType}` : '';
    const filename = `teaching-plans${typeStr}${classStr}-${now}.${format}`;
    
    // Create a download link and trigger download
    const url2 = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url2;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    link.remove();
    window.URL.revokeObjectURL(url2);
  } catch (error) {
    console.error('Error downloading teaching plan report:', error);
    throw new Error('Failed to download teaching plan report');
  }
}
