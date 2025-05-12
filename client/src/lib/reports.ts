import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { apiRequest } from './queryClient';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// Report types
export type ReportType = 'student' | 'plan';
export type ExportFormat = 'pdf' | 'excel';

interface ReportFilter {
  class?: string;
  teacherId?: number;
  startDate?: string;
  endDate?: string;
  includePhotos?: boolean;
}

interface ReportOptions {
  type: ReportType;
  format: ExportFormat;
  filters: ReportFilter;
}

export function useReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const generateReport = async (options: ReportOptions) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Fetch report data from API
      const response = await apiRequest('POST', `/api/reports/${options.type}`, options.filters);
      
      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }
      
      const data = await response.json();
      
      // Handle the appropriate export format
      if (options.format === 'pdf') {
        return generatePDF(data, options);
      } else {
        return generateExcel(data, options);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report';
      setError(new Error(errorMessage));
      toast({
        title: "Report Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePDF = (data: any, options: ReportOptions) => {
    const doc = new jsPDF();
    
    // Add header with school name
    doc.setFontSize(18);
    doc.text('Nepal Central High School', 105, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text(options.type === 'student' ? 'Student Progress Report' : 'Teaching Plan Report', 105, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text('Narephat, Kathmandu', 105, 32, { align: 'center' });
    
    // Add filters info
    doc.setFontSize(10);
    let yPos = 40;
    
    if (options.filters.class) {
      doc.text(`Class: ${options.filters.class}`, 14, yPos);
      yPos += 6;
    }
    
    if (options.filters.startDate && options.filters.endDate) {
      doc.text(`Date Range: ${options.filters.startDate} to ${options.filters.endDate}`, 14, yPos);
      yPos += 6;
    }
    
    // Add table headers and data based on report type
    if (options.type === 'student') {
      // Student report formatting
      const headers = ['Name', 'Class', 'Learning Ability', 'Writing Speed', 'Progress'];
      let startY = yPos + 5;
      
      // Table headers
      doc.setFillColor(241, 245, 249); // bg-slate-100
      doc.rect(14, startY, 182, 8, 'F');
      doc.setFont("helvetica", "bold");
      
      headers.forEach((header, index) => {
        doc.text(header, 14 + (index * 36), startY + 6);
      });
      
      // Table rows
      doc.setFont("helvetica", "normal");
      startY += 8;
      
      data.students.forEach((student: any, index: number) => {
        const rowY = startY + (index * 10);
        
        // Add alternating row background
        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251); // bg-slate-50
          doc.rect(14, rowY, 182, 10, 'F');
        }
        
        doc.text(student.name, 14, rowY + 6);
        doc.text(student.class, 14 + 36, rowY + 6);
        doc.text(student.learningAbility, 14 + 72, rowY + 6);
        doc.text(student.writingSpeed || 'N/A', 14 + 108, rowY + 6);
        doc.text(student.overallProgress || 'N/A', 14 + 144, rowY + 6);
        
        // Add student photo if requested
        if (options.filters.includePhotos && student.photoUrl) {
          try {
            // This would normally load the image, but for this implementation we'll skip
            // doc.addImage(student.photoUrl, 'JPEG', 150, rowY, 8, 8);
          } catch (e) {
            console.error('Failed to load student photo', e);
          }
        }
      });
    } else {
      // Teaching plan report formatting
      // Similar implementation for plans
      const headers = ['Title', 'Type', 'Class', 'Date Range', 'Goals'];
      // ... implement plan report formatting
    }
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 290);
      doc.text(`Page ${i} of ${pageCount}`, 180, 290);
    }
    
    // Save the PDF
    const fileName = `${options.type}_report_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
    
    return fileName;
  };

  const generateExcel = (data: any, options: ReportOptions) => {
    let worksheetData: any[] = [];
    
    if (options.type === 'student') {
      // Prepare headers
      const headers = ['Name', 'Age', 'Class', 'Learning Ability', 'Writing Speed'];
      
      // Add progress categories if available
      if (data.students[0]?.progress) {
        headers.push('Social Skills', 'Pre-Literacy', 'Pre-Numeracy', 'Motor Skills', 'Emotional Dev.');
      }
      
      worksheetData.push(headers);
      
      // Add student data
      data.students.forEach((student: any) => {
        const row = [
          student.name,
          student.age,
          student.class,
          student.learningAbility,
          student.writingSpeed || 'N/A',
        ];
        
        // Add progress data if available
        if (student.progress) {
          row.push(
            student.progress.socialSkills || 'N/A',
            student.progress.preLiteracy || 'N/A',
            student.progress.preNumeracy || 'N/A',
            student.progress.motorSkills || 'N/A',
            student.progress.emotionalDevelopment || 'N/A',
          );
        }
        
        worksheetData.push(row);
      });
    } else {
      // Teaching plans export
      // Similar implementation for plans
    }
    
    // Create workbook and add worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, options.type === 'student' ? 'Students' : 'Plans');
    
    // Generate file name
    const fileName = `${options.type}_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
    
    // Write and download Excel file
    XLSX.writeFile(wb, fileName);
    
    return fileName;
  };

  return {
    generateReport,
    isGenerating,
    error,
  };
}
