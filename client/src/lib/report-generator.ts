import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Student, Progress, Plan } from '@shared/schema';

// Types for report generation
interface StudentWithProgress extends Student {
  progressHistory: Progress[];
  teacherName: string;
}

interface TeachingPlan extends Plan {
  teacherName: string;
}

interface ReportOptions {
  includePhotos?: boolean;
  startDate?: Date;
  endDate?: Date;
  class?: string;
  teacherId?: number;
}

export function useReportGenerator() {
  // Generate PDF student report
  const generateStudentPDF = async (students: StudentWithProgress[], options: ReportOptions = {}) => {
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(16);
    doc.setTextColor(124, 58, 237); // purple-600
    doc.text("Nepal Central High School", 105, 15, { align: "center" });
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Pre-Primary Student Progress Report", 105, 25, { align: "center" });
    doc.text("Narephat, Kathmandu", 105, 35, { align: "center" });
    
    // Add date range if provided
    if (options.startDate && options.endDate) {
      doc.text(`Date Range: ${options.startDate.toISOString().split('T')[0]} to ${options.endDate.toISOString().split('T')[0]}`, 105, 45, { align: "center" });
    }
    
    // Add class filter if provided
    if (options.class) {
      doc.text(`Class: ${options.class.toUpperCase()}`, 105, 55, { align: "center" });
    }
    
    let yPos = 70; // Start position for student entries
    
    // Add each student
    for (const student of students) {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(124, 58, 237);
      doc.text(`${student.name}`, 15, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Class: ${student.class.toUpperCase()}`, 15, yPos);
      yPos += 5;
      doc.text(`Age: ${student.age} years`, 15, yPos);
      yPos += 5;
      doc.text(`Learning Ability: ${student.learningAbility}`, 15, yPos);
      yPos += 5;
      doc.text(`Writing Speed: ${student.writingSpeed || 'N/A'}`, 15, yPos);
      yPos += 5;
      doc.text(`Teacher: ${student.teacherName}`, 15, yPos);
      yPos += 10;
      
      // Add student photo if enabled
      if (options.includePhotos && student.photoUrl) {
        try {
          // In a real implementation, we would load and add the image
          // For simplicity, we'll just leave space for it
          yPos += 40;
        } catch (error) {
          console.error("Failed to add student photo:", error);
        }
      }
      
      // Add progress history table
      if (student.progressHistory.length > 0) {
        doc.text("Progress History:", 15, yPos);
        yPos += 10;
        
        // Table headers
        doc.setFontSize(8);
        doc.text("Date", 15, yPos);
        doc.text("Social", 50, yPos);
        doc.text("Literacy", 85, yPos);
        doc.text("Numeracy", 120, yPos);
        doc.text("Motor", 155, yPos);
        doc.text("Emotional", 185, yPos);
        yPos += 5;
        
        // Draw header line
        doc.line(15, yPos, 195, yPos);
        yPos += 5;
        
        // Table rows
        for (const entry of student.progressHistory) {
          const date = new Date(entry.date).toISOString().split('T')[0];
          doc.text(date, 15, yPos);
          doc.text(entry.socialSkills, 50, yPos);
          doc.text(entry.preLiteracy, 85, yPos);
          doc.text(entry.preNumeracy, 120, yPos);
          doc.text(entry.motorSkills, 155, yPos);
          doc.text(entry.emotionalDevelopment, 185, yPos);
          yPos += 5;
        }
      } else {
        doc.text("No progress entries recorded.", 15, yPos);
      }
      
      yPos += 15;
      doc.line(15, yPos, 195, yPos);
      yPos += 15;
    }
    
    // Add footer
    const today = new Date().toISOString().split('T')[0];
    doc.setFontSize(8);
    doc.text(`Generated on: ${today}`, 15, 280);
    doc.text("Nepal Central High School Pre-Primary Student Record-Keeping System", 105, 280, { align: "center" });
    
    return doc.output('blob');
  };
  
  // Generate Excel student report
  const generateStudentExcel = (students: StudentWithProgress[], options: ReportOptions = {}) => {
    // Create worksheet data
    const wsData = [
      ['Nepal Central High School - Student Progress Report'],
      ['Name', 'Class', 'Age', 'Learning Ability', 'Writing Speed', 'Teacher', 'Social Skills', 'Pre-Literacy', 'Pre-Numeracy', 'Motor Skills', 'Emotional Development', 'Latest Progress Date']
    ];
    
    for (const student of students) {
      // Get latest progress entry if any
      const latestProgress = student.progressHistory.length > 0 
        ? student.progressHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        : null;
      
      wsData.push([
        student.name,
        student.class.toUpperCase(),
        student.age.toString(),
        student.learningAbility,
        student.writingSpeed || 'N/A',
        student.teacherName,
        latestProgress?.socialSkills || 'N/A',
        latestProgress?.preLiteracy || 'N/A',
        latestProgress?.preNumeracy || 'N/A',
        latestProgress?.motorSkills || 'N/A',
        latestProgress?.emotionalDevelopment || 'N/A',
        latestProgress ? new Date(latestProgress.date).toISOString().split('T')[0] : 'N/A'
      ]);
    }
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    const colWidths = [
      { wch: 20 }, // Name
      { wch: 10 }, // Class
      { wch: 5 },  // Age
      { wch: 15 }, // Learning Ability
      { wch: 15 }, // Writing Speed
      { wch: 20 }, // Teacher
      { wch: 15 }, // Social Skills
      { wch: 15 }, // Pre-Literacy
      { wch: 15 }, // Pre-Numeracy
      { wch: 15 }, // Motor Skills
      { wch: 20 }, // Emotional Development
      { wch: 15 }  // Latest Progress Date
    ];
    
    ws['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Student Progress");
    
    // Generate Excel file
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    
    // Convert to blob
    const buf = new ArrayBuffer(wbout.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < wbout.length; i++) {
      view[i] = wbout.charCodeAt(i) & 0xFF;
    }
    
    return new Blob([buf], { type: 'application/octet-stream' });
  };
  
  // Generate PDF plan report
  const generatePlanPDF = async (plans: TeachingPlan[], options: ReportOptions = {}) => {
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(16);
    doc.setTextColor(124, 58, 237); // purple-600
    doc.text("Nepal Central High School", 105, 15, { align: "center" });
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Teaching Plans Report", 105, 25, { align: "center" });
    doc.text("Narephat, Kathmandu", 105, 35, { align: "center" });
    
    // Add date range if provided
    if (options.startDate && options.endDate) {
      doc.text(`Date Range: ${options.startDate.toISOString().split('T')[0]} to ${options.endDate.toISOString().split('T')[0]}`, 105, 45, { align: "center" });
    }
    
    // Add class filter if provided
    if (options.class) {
      doc.text(`Class: ${options.class.toUpperCase()}`, 105, 55, { align: "center" });
    }
    
    let yPos = 70; // Start position for plan entries
    
    // Add each plan
    for (const plan of plans) {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(124, 58, 237);
      doc.text(`${plan.title} (${plan.type.charAt(0).toUpperCase() + plan.type.slice(1)})`, 15, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Class: ${plan.class.toUpperCase()}`, 15, yPos);
      yPos += 5;
      doc.text(`Date Range: ${new Date(plan.startDate).toISOString().split('T')[0]} to ${new Date(plan.endDate).toISOString().split('T')[0]}`, 15, yPos);
      yPos += 5;
      doc.text(`Teacher: ${plan.teacherName}`, 15, yPos);
      yPos += 10;
      
      doc.text("Description:", 15, yPos);
      yPos += 5;
      
      // Add description text with word wrap
      const descLines = doc.splitTextToSize(plan.description, 180);
      doc.text(descLines, 15, yPos);
      yPos += 5 * descLines.length + 5;
      
      doc.text("Activities:", 15, yPos);
      yPos += 5;
      
      // Add activities text with word wrap
      const actLines = doc.splitTextToSize(plan.activities, 180);
      doc.text(actLines, 15, yPos);
      yPos += 5 * actLines.length + 5;
      
      doc.text("Learning Goals:", 15, yPos);
      yPos += 5;
      
      // Add goals text with word wrap
      const goalLines = doc.splitTextToSize(plan.goals, 180);
      doc.text(goalLines, 15, yPos);
      yPos += 5 * goalLines.length + 10;
      
      doc.line(15, yPos, 195, yPos);
      yPos += 15;
    }
    
    // Add footer
    const today = new Date().toISOString().split('T')[0];
    doc.setFontSize(8);
    doc.text(`Generated on: ${today}`, 15, 280);
    doc.text("Nepal Central High School Pre-Primary Student Record-Keeping System", 105, 280, { align: "center" });
    
    return doc.output('blob');
  };
  
  // Generate Excel plan report
  const generatePlanExcel = (plans: TeachingPlan[], options: ReportOptions = {}) => {
    // Create worksheet data
    const wsData = [
      ['Nepal Central High School - Teaching Plans Report'],
      ['Title', 'Type', 'Class', 'Start Date', 'End Date', 'Teacher', 'Description', 'Activities', 'Learning Goals']
    ];
    
    for (const plan of plans) {
      wsData.push([
        plan.title,
        plan.type,
        plan.class.toUpperCase(),
        new Date(plan.startDate).toISOString().split('T')[0],
        new Date(plan.endDate).toISOString().split('T')[0],
        plan.teacherName,
        plan.description,
        plan.activities,
        plan.goals
      ]);
    }
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    const colWidths = [
      { wch: 30 }, // Title
      { wch: 10 }, // Type
      { wch: 10 }, // Class
      { wch: 12 }, // Start Date
      { wch: 12 }, // End Date
      { wch: 20 }, // Teacher
      { wch: 40 }, // Description
      { wch: 40 }, // Activities
      { wch: 40 }  // Learning Goals
    ];
    
    ws['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Teaching Plans");
    
    // Generate Excel file
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    
    // Convert to blob
    const buf = new ArrayBuffer(wbout.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < wbout.length; i++) {
      view[i] = wbout.charCodeAt(i) & 0xFF;
    }
    
    return new Blob([buf], { type: 'application/octet-stream' });
  };
  
  // Function to download a blob as a file
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return {
    generateStudentPDF,
    generateStudentExcel,
    generatePlanPDF,
    generatePlanExcel,
    downloadBlob
  };
}
