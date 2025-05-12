import { jsPDF } from 'jspdf';
import { Student, ProgressEntry, TeachingPlan } from '@shared/schema';
import { IStorage } from './storage';
import axios from 'axios';

// Add Nepali font support
// This is a simplified implementation
// In a production environment, we would properly add font support

interface ReportOptions {
  startDate?: string;
  endDate?: string;
  includePhotos?: boolean;
  templateType?: 'studentProgress' | 'teachingPlans';
  storage: IStorage;
}

/**
 * Generate a PDF report for students or teaching plans
 */
export async function generatePdfReport(
  data: Student[] | TeachingPlan[],
  options: ReportOptions
): Promise<Buffer> {
  const doc = new jsPDF();
  const templateType = options.templateType || 'studentProgress';
  
  // Add header
  addHeader(doc);
  
  if (templateType === 'studentProgress') {
    await generateStudentProgressReport(doc, data as Student[], options);
  } else {
    generateTeachingPlansReport(doc, data as TeachingPlan[]);
  }
  
  // Add footer
  addFooter(doc);
  
  // Return the PDF as a buffer
  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Add the school header to the PDF
 */
function addHeader(doc: jsPDF): void {
  doc.setFontSize(18);
  doc.setTextColor(124, 58, 237); // Purple color
  doc.text('Nepal Central High School', 105, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Pre-Primary Student Record System', 105, 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Narephat, Kathmandu', 105, 40, { align: 'center' });
  
  // Add horizontal line
  doc.setDrawColor(124, 58, 237);
  doc.setLineWidth(0.5);
  doc.line(20, 45, 190, 45);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
}

/**
 * Add the footer to the PDF
 */
function addFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    
    doc.text(`Generated on: ${dateStr}`, 20, 285);
    doc.text(`Page ${i} of ${pageCount}`, 180, 285);
    
    // Add horizontal line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(20, 280, 190, 280);
  }
}

/**
 * Generate student progress report
 */
async function generateStudentProgressReport(
  doc: jsPDF,
  students: Student[],
  options: ReportOptions
): Promise<void> {
  // Add report title
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Student Progress Report', 105, 60, { align: 'center' });
  
  // Add date range if specified
  if (options.startDate && options.endDate) {
    doc.setFontSize(10);
    doc.text(`Period: ${options.startDate} to ${options.endDate}`, 105, 70, { align: 'center' });
  }
  
  let yPos = 80;
  
  // Process each student
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    
    // Check if we need to add a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Add student information
    doc.setFontSize(12);
    doc.setTextColor(124, 58, 237);
    doc.text(`${student.name}`, 20, yPos);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    yPos += 10;
    doc.text(`Class: ${student.classType.toUpperCase()}`, 20, yPos);
    
    yPos += 6;
    doc.text(`Age: ${student.age} years`, 20, yPos);
    
    yPos += 6;
    doc.text(`Learning Ability: ${formatEnumValue(student.learningAbility)}`, 20, yPos);
    
    yPos += 6;
    doc.text(`Writing Speed: ${formatEnumValue(student.writingSpeed)}`, 20, yPos);
    
    // Add student photo if required and available
    if (options.includePhotos && student.photoUrl) {
      try {
        const photoX = 150;
        const photoY = yPos - 28;
        const photoWidth = 40;
        const photoHeight = 40;
        
        // Try to load the image from URL
        if (student.photoUrl.startsWith('http')) {
          const response = await axios.get(student.photoUrl, { responseType: 'arraybuffer' });
          const buffer = Buffer.from(response.data, 'binary');
          const base64Image = buffer.toString('base64');
          
          const imageType = student.photoUrl.endsWith('.png') ? 'PNG' : 'JPEG';
          doc.addImage(base64Image, imageType, photoX, photoY, photoWidth, photoHeight);
        }
      } catch (error) {
        console.error(`Failed to add image for student ${student.id}:`, error);
      }
    }
    
    // Get progress entries for this student
    const progressEntries = await options.storage.getProgressEntriesByStudentId(student.id);
    
    if (progressEntries.length > 0) {
      yPos += 10;
      doc.setFontSize(11);
      doc.setTextColor(124, 58, 237);
      doc.text('Progress History:', 20, yPos);
      
      yPos += 8;
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      
      // Add table header
      const headers = ['Date', 'Social Skills', 'Pre-Literacy', 'Pre-Numeracy', 'Motor Skills', 'Emotional Dev.'];
      const colWidths = [30, 30, 30, 30, 30, 30];
      let xPos = 20;
      
      for (let j = 0; j < headers.length; j++) {
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.text(headers[j], xPos, yPos);
        xPos += colWidths[j];
      }
      
      // Add progress entries
      for (let j = 0; j < Math.min(progressEntries.length, 5); j++) {
        const entry = progressEntries[j];
        xPos = 20;
        yPos += 8;
        
        // Check if we need to add a new page
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
          
          // Re-add headers on new page
          xPos = 20;
          for (let k = 0; k < headers.length; k++) {
            doc.setFontSize(8);
            doc.setFont(undefined, 'bold');
            doc.text(headers[k], xPos, yPos);
            xPos += colWidths[k];
          }
          
          yPos += 8;
          xPos = 20;
        }
        
        doc.setFont(undefined, 'normal');
        const date = new Date(entry.date).toLocaleDateString();
        doc.text(date, xPos, yPos);
        xPos += colWidths[0];
        
        doc.text(formatEnumValue(entry.socialSkills), xPos, yPos);
        xPos += colWidths[1];
        
        doc.text(formatEnumValue(entry.preLiteracy), xPos, yPos);
        xPos += colWidths[2];
        
        doc.text(formatEnumValue(entry.preNumeracy), xPos, yPos);
        xPos += colWidths[3];
        
        doc.text(formatEnumValue(entry.motorSkills), xPos, yPos);
        xPos += colWidths[4];
        
        doc.text(formatEnumValue(entry.emotionalDevelopment), xPos, yPos);
      }
    } else {
      yPos += 10;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('No progress entries found for this student.', 20, yPos);
    }
    
    // Add separator
    yPos += 15;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
  }
}

/**
 * Generate teaching plans report
 */
function generateTeachingPlansReport(doc: jsPDF, plans: TeachingPlan[]): void {
  // Add report title
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Teaching Plans Report', 105, 60, { align: 'center' });
  
  let yPos = 80;
  
  // Process each teaching plan
  for (let i = 0; i < plans.length; i++) {
    const plan = plans[i];
    
    // Check if we need to add a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Add plan information
    doc.setFontSize(12);
    doc.setTextColor(124, 58, 237);
    doc.text(`${plan.title}`, 20, yPos);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    yPos += 8;
    doc.text(`Type: ${formatEnumValue(plan.type)}`, 20, yPos);
    
    yPos += 6;
    doc.text(`Class: ${plan.classType.toUpperCase()}`, 20, yPos);
    
    yPos += 6;
    const startDate = new Date(plan.startDate).toLocaleDateString();
    const endDate = new Date(plan.endDate).toLocaleDateString();
    doc.text(`Period: ${startDate} to ${endDate}`, 20, yPos);
    
    yPos += 10;
    doc.setFontSize(11);
    doc.setTextColor(124, 58, 237);
    doc.text('Description:', 20, yPos);
    
    yPos += 6;
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    
    // Handle long description with word wrapping
    const descriptionLines = doc.splitTextToSize(plan.description, 170);
    doc.text(descriptionLines, 20, yPos);
    yPos += descriptionLines.length * 5;
    
    // Add activities
    yPos += 6;
    doc.setFontSize(11);
    doc.setTextColor(124, 58, 237);
    doc.text('Activities:', 20, yPos);
    
    yPos += 6;
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    
    // Handle long activities text with word wrapping
    const activitiesLines = doc.splitTextToSize(plan.activities, 170);
    doc.text(activitiesLines, 20, yPos);
    yPos += activitiesLines.length * 5;
    
    // Add goals
    yPos += 6;
    doc.setFontSize(11);
    doc.setTextColor(124, 58, 237);
    doc.text('Goals:', 20, yPos);
    
    yPos += 6;
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    
    // Handle long goals text with word wrapping
    const goalsLines = doc.splitTextToSize(plan.goals, 170);
    doc.text(goalsLines, 20, yPos);
    yPos += goalsLines.length * 5;
    
    // Add separator
    yPos += 10;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
  }
}

/**
 * Format enum values for display
 */
function formatEnumValue(value: string): string {
  if (!value) return 'N/A';
  
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
