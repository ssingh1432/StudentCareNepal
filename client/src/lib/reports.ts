import { StudentReportOptions, PlanReportOptions } from "@/types";
import { 
  generateStudentPdfReport, 
  generateStudentExcelReport,
  generatePlanPdfReport,
  generatePlanExcelReport
} from "./api";

// Helper to download blob as file
function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// Function to generate and download student report as PDF
export async function downloadStudentPdfReport(options: StudentReportOptions): Promise<void> {
  try {
    const blob = await generateStudentPdfReport(options);
    
    // Generate filename
    const classText = options.className !== 'all' ? options.className : 'All-Classes';
    const date = new Date().toISOString().slice(0, 10);
    const filename = `Student_Progress_${classText}_${date}.pdf`;
    
    downloadBlob(blob, filename);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
}

// Function to generate and download student report as Excel
export async function downloadStudentExcelReport(options: StudentReportOptions): Promise<void> {
  try {
    const blob = await generateStudentExcelReport(options);
    
    // Generate filename
    const classText = options.className !== 'all' ? options.className : 'All-Classes';
    const date = new Date().toISOString().slice(0, 10);
    const filename = `Student_Progress_${classText}_${date}.xlsx`;
    
    downloadBlob(blob, filename);
  } catch (error) {
    console.error('Error generating Excel report:', error);
    throw error;
  }
}

// Function to generate and download teaching plan report as PDF
export async function downloadPlanPdfReport(options: PlanReportOptions): Promise<void> {
  try {
    const blob = await generatePlanPdfReport(options);
    
    // Generate filename
    const typeText = options.type !== 'all' ? options.type : 'All';
    const classText = options.className !== 'all' ? options.className : 'All';
    const date = new Date().toISOString().slice(0, 10);
    const filename = `Teaching_Plans_${typeText}_${classText}_${date}.pdf`;
    
    downloadBlob(blob, filename);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
}

// Function to generate and download teaching plan report as Excel
export async function downloadPlanExcelReport(options: PlanReportOptions): Promise<void> {
  try {
    const blob = await generatePlanExcelReport(options);
    
    // Generate filename
    const typeText = options.type !== 'all' ? options.type : 'All';
    const classText = options.className !== 'all' ? options.className : 'All';
    const date = new Date().toISOString().slice(0, 10);
    const filename = `Teaching_Plans_${typeText}_${classText}_${date}.xlsx`;
    
    downloadBlob(blob, filename);
  } catch (error) {
    console.error('Error generating Excel report:', error);
    throw error;
  }
}
